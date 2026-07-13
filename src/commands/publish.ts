import { publishToWechatDraft } from "@wenyan-md/core/wrapper";
import { AppError, RenderOptions } from "../types.js";
import { collectPublishMetadata, validatePublishAssets } from "../publish-metadata.js";
import { prepareRenderContext } from "./render.js";

const DEFAULT_PUBLISH_TIMEOUT_MS = 60_000;
const AUTH_ERROR_CODES = new Set([40001, 40013, 40014, 40125, 41001, 42001, 48001]);

function normalizePublishError(error: unknown): AppError {
    if (error instanceof AppError) {
        return error;
    }

    const message = error instanceof Error ? error.message : String(error);
    const numericCode = message.match(/(?:^|\D)(\d{5})(?:\D|$)/)?.[1];
    const hasAuthErrorCode = numericCode ? AUTH_ERROR_CODES.has(Number(numericCode)) : false;
    const code = hasAuthErrorCode || /WECHAT_APP_ID|WECHAT_APP_SECRET|AppID|AppSecret|凭据|access[_ ]?token/i.test(message)
        ? "AUTH_ERROR"
        : "PUBLISH_FAILED";
    const exitCode = code === "AUTH_ERROR" ? 4 : 5;

    return new AppError(message, code, undefined, exitCode);
}

function getPublishTimeoutMs(): number {
    const configured = Number(process.env.WECHAT_PUBLISH_TIMEOUT_MS);
    if (Number.isFinite(configured) && configured > 0) {
        return configured;
    }
    return DEFAULT_PUBLISH_TIMEOUT_MS;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
        return await Promise.race([
            promise,
            new Promise<T>((_, reject) => {
                timer = setTimeout(() => {
                    reject(
                        new AppError(
                            `微信发布请求超过 ${timeoutMs}ms 仍未完成`,
                            "NETWORK_TIMEOUT",
                            { timeout_ms: timeoutMs },
                            4,
                        ),
                    );
                }, timeoutMs);
            }),
        ]);
    } finally {
        if (timer) clearTimeout(timer);
    }
}

function validateDraftMetadata(gzhContent: { title?: string; author?: string; content: string }) {
    const titleLength = gzhContent.title?.trim().length || 0;
    if (titleLength > 32) {
        throw new AppError("文章标题不能超过 32 个字符", "INVALID_METADATA", { field: "title", max: 32 }, 3);
    }

    const authorLength = gzhContent.author?.trim().length || 0;
    if (authorLength > 16) {
        throw new AppError("文章作者不能超过 16 个字符", "INVALID_METADATA", { field: "author", max: 16 }, 3);
    }
}

export async function publishCommand(inputContent: string | undefined, options: RenderOptions & { preflight?: boolean }) {
    const { gzhContent, absoluteDirPath, inputSource } = await prepareRenderContext(inputContent, options);
    const metadata = collectPublishMetadata(gzhContent, inputSource || "argument");
    validateDraftMetadata(gzhContent);
    await validatePublishAssets({
        content: gzhContent.content,
        cover: gzhContent.cover?.trim() || metadata.resolvedCover,
        baseDir: absoluteDirPath,
    });

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
        data = await withTimeout(
            publishToWechatDraft(
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
            ),
            getPublishTimeoutMs(),
        );
    } catch (error) {
        throw normalizePublishError(error);
    }

    if (!data || typeof data !== "object" || !data.media_id) {
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
