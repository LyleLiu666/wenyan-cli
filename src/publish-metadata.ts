import { AppError, CoverSource, InputSource } from "./types.js";

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

function getFirstImageUrl(content: string): string | undefined {
    const match = content.match(/<img\b[^>]*?\bsrc\s*=\s*["']([^"']+)["']/i);
    return match?.[1]?.trim();
}

function countImages(content: string): number {
    return content.match(/<img\b/gi)?.length || 0;
}
