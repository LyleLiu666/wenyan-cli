import { publishToWechatDraft } from "@wenyan-md/core/publish";
import { AppError, RenderOptions } from "../types.js";
import { collectPublishMetadata } from "../publish-metadata.js";
import { prepareRenderContext } from "./render.js";

function normalizePublishError(error: unknown): AppError {
    if (error instanceof AppError) {
        return error;
    }

    const message = error instanceof Error ? error.message : String(error);
    const code = /WECHAT_APP_ID|WECHAT_APP_SECRET|凭据/i.test(message) ? "AUTH_ERROR" : "PUBLISH_FAILED";
    const exitCode = code === "AUTH_ERROR" ? 4 : 5;

    return new AppError(message, code, undefined, exitCode);
}

export async function publishCommand(inputContent: string | undefined, options: RenderOptions & { preflight?: boolean }) {
    const { gzhContent, absoluteDirPath, inputSource } = await prepareRenderContext(inputContent, options);
    const metadata = collectPublishMetadata(gzhContent, inputSource || "argument");

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
        };
    }

    let data: any;
    try {
        data = await publishToWechatDraft(
            {
                title: metadata.title,
                content: gzhContent.content,
                cover: gzhContent.cover?.trim() || undefined,
                author: gzhContent.author,
                source_url: gzhContent.source_url,
            },
            {
                relativePath: absoluteDirPath,
            },
        );
    } catch (error) {
        throw normalizePublishError(error);
    }

    if (!data.media_id) {
        throw new AppError(`上传失败，\n${data}`, "PUBLISH_FAILED", { response: data }, 5);
    }

    return {
        ok: true as const,
        command: "publish" as const,
        media_id: data.media_id,
        title: metadata.title,
        input_source: metadata.inputSource,
        cover_source: metadata.coverSource,
        resolved_cover: metadata.resolvedCover,
        image_count: metadata.imageCount,
    };
}
