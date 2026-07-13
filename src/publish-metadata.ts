import { AppError, CoverSource, InputSource } from "./types.js";
import fs from "node:fs/promises";
import path from "node:path";
import { JSDOM } from "jsdom";

interface PublishDraft {
    title?: string;
    cover?: string;
    content: string;
}

export interface PublishMetadata {
    title: string;
    inputSource: InputSource;
    coverSource: CoverSource;
    resolvedCover: string;
    imageCount: number;
}

export interface PublishAssetValidationOptions {
    content: string;
    cover: string | undefined;
    baseDir: string | undefined;
}

export function collectPublishMetadata(draft: PublishDraft, inputSource: InputSource): PublishMetadata {
    const content = draft.content || "";
    const title = draft.title?.trim();
    if (!title) {
        throw new AppError("未能找到文章标题", "MISSING_TITLE", undefined, 3);
    }

    const explicitCover = draft.cover?.trim();
    const firstImage = getFirstImageUrl(content);
    const resolvedCover = explicitCover || firstImage;

    if (!resolvedCover) {
        throw new AppError("未能找到文章封面，且正文中没有图片可用作自动封面", "MISSING_COVER", undefined, 3);
    }

    return {
        title,
        inputSource,
        coverSource: explicitCover ? "frontmatter" : "first_image",
        resolvedCover,
        imageCount: countImages(content),
    };
}

/**
 * 在调用微信接口前检查本地资源。core 会在上传阶段才 stat 图片，
 * 预检提前报出确定性的输入错误，避免发布到一半才失败。
 */
export async function validatePublishAssets({ content, cover, baseDir }: PublishAssetValidationOptions): Promise<void> {
    const urls = new Set<string>();
    if (cover?.trim()) {
        urls.add(cover.trim());
    }

    const dom = new JSDOM(`<body>${content || ""}</body>`);
    for (const image of Array.from(dom.window.document.querySelectorAll("img")) as Element[]) {
        const src = image.getAttribute("src")?.trim();
        if (src) urls.add(src);
    }

    const missing: string[] = [];
    const unsupported: string[] = [];

    for (const url of urls) {
        if (/^https?:\/\//i.test(url)) {
            continue;
        }

        // core 的 Node 发布器目前只接受 HTTP(S) 或本地文件路径。
        // 明确拒绝 data/asset 协议，避免把协议字符串当作本地路径。
        if (/^(?:data:|asset:|file:)/i.test(url)) {
            unsupported.push(url.slice(0, 120));
            continue;
        }

        let decodedUrl: string;
        try {
            decodedUrl = decodeURIComponent(url);
        } catch {
            missing.push(url);
            continue;
        }
        const resolvedPath = path.isAbsolute(decodedUrl)
            ? path.normalize(decodedUrl)
            : path.resolve(baseDir || process.cwd(), decodedUrl);

        try {
            const stats = await fs.stat(resolvedPath);
            if (!stats.isFile() || stats.size === 0) {
                missing.push(url);
            }
        } catch {
            missing.push(url);
        }
    }

    if (unsupported.length > 0) {
        throw new AppError(
            `暂不支持以下图片地址协议，请改用本地文件或 HTTP(S) URL：${unsupported.join(", ")}`,
            "UNSUPPORTED_IMAGE",
            { urls: unsupported },
            3,
        );
    }

    if (missing.length > 0) {
        throw new AppError(`找不到可用的本地图片：${missing.join(", ")}`, "MISSING_IMAGE", { urls: missing }, 3);
    }
}

function getFirstImageUrl(content: string): string | undefined {
    const match = content.match(/<img\b[^>]*?\bsrc\s*=\s*["']([^"']+)["']/i);
    return match?.[1]?.trim();
}

function countImages(content: string): number {
    return content.match(/<img\b/gi)?.length || 0;
}
