import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { FormData, File } from "formdata-node";
import { FormDataEncoder } from "form-data-encoder";
import { AppError, PublishOptions } from "../types.js";
import { collectPublishMetadata } from "../publish-metadata.js";
import { extractImageUrls, getInputContent } from "../utils.js";
import { renderContent } from "./render.js";

const logInfo = (message: string) => {
    console.error(message);
};

export async function publishClient(inputContent: string | undefined, options: PublishOptions) {
    const { theme, customTheme, highlight, macStyle, footnote, apiKey } = options;
    const serverUrl = options.server!.replace(/\/$/, ""); // 移除末尾的斜杠

    logInfo(`[Client] Checking server connection at ${serverUrl} ...`);
    try {
        const healthRes = await fetch(`${serverUrl}/health`, {
            method: "GET",
        });

        if (!healthRes.ok) {
            throw new Error(`HTTP Error: ${healthRes.status} ${healthRes.statusText}`);
        }

        const healthData: any = await healthRes.json();

        if (healthData.status !== "ok" || healthData.service !== "wenyan-cli") {
            throw new Error(`Invalid server response. Make sure the server URL is correct.`);
        }

        logInfo(`[Client] Server connected successfully (version: ${healthData.version})`);
    } catch (error: any) {
        throw new AppError(
            `Failed to connect to server (${serverUrl}). Please check if the server is running and the network is accessible. Details: ${error.message}`,
            "NETWORK_ERROR",
            { server: serverUrl },
            4,
        );
    }

    // 统一处理内容和文件所在绝对路径
    const { content, absoluteDirPath, inputSource } = await getInputContent(inputContent, options);
    const gzhContent = await renderContent(content, options);
    const metadata = collectPublishMetadata(gzhContent, inputSource);

    const headers: Record<string, string> = {};

    if (apiKey) {
        headers["x-api-key"] = apiKey;
    }

    let modifiedContent = content;

    if (options.preflight) {
        return {
            ok: true as const,
            command: "publish" as const,
            preflight: true as const,
            can_publish: true as const,
            title: metadata.title,
            input_source: metadata.inputSource,
            cover_source: metadata.coverSource,
            resolved_cover: metadata.resolvedCover,
            image_count: metadata.imageCount,
            server: serverUrl,
        };
    }

    const urlsToProcess = extractImageUrls(content);

    // 遍历去重后的图片地址
    for (const originalUrl of urlsToProcess) {
        // 跳过已经是 http/https 协议的远程图片、Base64 数据，以及 asset:// 协议的本地资源
        if (/^(https?:\/\/|data:|asset:\/\/)/i.test(originalUrl)) {
            continue;
        }

        // 获取本地绝对路径
        let imagePath = originalUrl;
        if (!path.isAbsolute(imagePath)) {
            // 如果是相对路径，以 markdown 文件所在目录为基准进行拼接
            imagePath = path.resolve(absoluteDirPath || process.cwd(), imagePath);
        }

        if (fs.existsSync(imagePath)) {
            try {
                const fileBuffer = fs.readFileSync(imagePath);
                const filename = path.basename(imagePath);

                // 推断 Content-Type
                const ext = path.extname(filename).toLowerCase();
                const mimeTypes: Record<string, string> = {
                    ".jpg": "image/jpeg",
                    ".jpeg": "image/jpeg",
                    ".png": "image/png",
                    ".gif": "image/gif",
                    ".webp": "image/webp",
                    ".svg": "image/svg+xml",
                };
                const type = mimeTypes[ext] || "application/octet-stream";

                // 构建图片上传表单
                const form = new FormData();
                form.append("file", new File([fileBuffer], filename, { type }));
                const encoder = new FormDataEncoder(form);

                logInfo(`[Client] Uploading local image: ${filename} ...`);

                const uploadRes = await fetch(`${serverUrl}/upload`, {
                    method: "POST",
                    headers: { ...headers, ...encoder.headers },
                    body: Readable.from(encoder) as any,
                    duplex: "half",
                } as RequestInit);

                const uploadData: any = await uploadRes.json();

                if (uploadRes.ok && uploadData.success) {
                    const fileId = uploadData.data.fileId;

                    // 替换为可以直接被 Server 渲染访问的 URL
                    const newUrl = `asset://${fileId}`;

                    // 将所有该图片的引用地址替换为新的 Server 远程地址
                    modifiedContent = modifiedContent.replaceAll(originalUrl, newUrl);
                } else {
                    console.warn(
                        `[Client] Warning: Failed to upload ${filename}: ${uploadData.error || uploadData.desc}`,
                    );
                }
            } catch (error: any) {
                console.warn(`[Client] Warning: Error uploading ${imagePath} - ${error.message}`);
            }
        } else {
            console.warn(`[Client] Warning: Local image not found: ${imagePath}`);
        }
    }

    // ==========================================
    // 2. 将替换后的 content 保存成临时文件/流，并上传
    // ==========================================
    const mdFilename = "publish_target.md";
    const mdForm = new FormData();
    mdForm.append("file", new File([Buffer.from(modifiedContent, "utf-8")], mdFilename, { type: "text/markdown" }));

    const mdEncoder = new FormDataEncoder(mdForm);
    logInfo(`[Client] Uploading compiled markdown document ...`);

    const mdUploadRes = await fetch(`${serverUrl}/upload`, {
        method: "POST",
        headers: { ...headers, ...mdEncoder.headers },
        body: Readable.from(mdEncoder) as any,
        duplex: "half",
    } as RequestInit);

    const mdUploadData: any = await mdUploadRes.json();

    if (!mdUploadRes.ok || !mdUploadData.success) {
        throw new Error(`Upload Markdown Failed: ${mdUploadData.error || mdUploadData.desc || mdUploadRes.statusText}`);
    }

    const mdFileId = mdUploadData.data.fileId;
    logInfo(`[Client] Document uploaded, ID: ${mdFileId}`);

    logInfo(`[Client] Requesting remote Server to publish ...`);

    const publishRes = await fetch(`${serverUrl}/publish`, {
        method: "POST",
        headers: {
            ...headers,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            fileId: mdFileId,
            theme,
            highlight,
            customTheme,
            macStyle,
            footnote,
        }),
    });

    const publishData: any = await publishRes.json();

    if (!publishRes.ok || publishData.code === -1) {
        throw new AppError(
            `Remote Publish Failed: ${publishData.desc || publishRes.statusText}`,
            "PUBLISH_FAILED",
            { server: serverUrl },
            5,
        );
    }

    return {
        ok: true as const,
        command: "publish" as const,
        media_id: publishData.media_id,
        title: metadata.title,
        input_source: metadata.inputSource,
        cover_source: metadata.coverSource,
        resolved_cover: metadata.resolvedCover,
        image_count: metadata.imageCount,
        server: serverUrl,
    };
}
