import { createWenyanCore } from "@wenyan-md/core";
import { renderStyledContent, StyledContent } from "@wenyan-md/core/wrapper";
import { getInputContent, getNormalizeFilePath } from "../utils.js";
import fs from "node:fs/promises";
import { AppError, RenderOptions } from "../types.js";
import { resolveTheme } from "../theme-registry.js";

interface RenderContext {
    gzhContent: StyledContent;
    absoluteDirPath: string | undefined;
    inputSource: "argument" | "file" | "stdin";
}

let parserCorePromise: ReturnType<typeof createWenyanCore> | undefined;

async function getParserCore() {
    parserCorePromise ??= createWenyanCore();
    return parserCorePromise;
}

export async function renderContent(content: string, options: RenderOptions): Promise<StyledContent> {
    const { theme, customTheme, highlight, macStyle, footnote } = options;

    let handledCustomTheme: string | undefined = customTheme;
    let resolvedTheme;
    if (customTheme) {
        const normalizePath = getNormalizeFilePath(customTheme);
        handledCustomTheme = await fs.readFile(normalizePath, "utf-8");
    } else {
        resolvedTheme = theme ? await resolveTheme(theme) : undefined;
        handledCustomTheme = resolvedTheme?.css;
    }

    if (!handledCustomTheme && !theme) {
        throw new AppError(`theme "${theme}" not found.`, "THEME_NOT_FOUND", { theme }, 3);
    }

    if (!handledCustomTheme && theme && !resolvedTheme) {
        throw new AppError(`theme "${theme}" not found.`, "THEME_NOT_FOUND", { theme }, 3);
    }

    // v3 core 将 frontmatter 解析与样式渲染拆成两步；保留此前 CLI 对标题、封面等
    // 发布元数据的读取方式，同时让主题 CSS 继续由本项目解析。
    const parsedContent = await (await getParserCore()).handleFrontMatter(content);
    const renderedContent = await renderStyledContent(parsedContent.content, {
        themeId: theme,
        hlThemeId: highlight,
        isMacStyle: macStyle,
        isAddFootnote: footnote,
        themeCss: handledCustomTheme,
    });

    // 测试替身以及旧版 core 可能直接返回 StyledContent；v3 返回渲染后的 HTML 字符串。
    if (typeof renderedContent === "string") {
        return { ...parsedContent, content: renderedContent };
    }

    return renderedContent;
}

// --- 处理输入源、文件路径和主题 ---
export async function prepareRenderContext(
    inputContent: string | undefined,
    options: RenderOptions,
): Promise<RenderContext> {
    const { content, absoluteDirPath, inputSource } = await getInputContent(inputContent, options);
    const gzhContent = await renderContent(content, options);

    return { gzhContent, absoluteDirPath, inputSource };
}

export async function renderCommand(inputContent: string | undefined, options: RenderOptions) {
    const { gzhContent, inputSource } = await prepareRenderContext(inputContent, options);

    return {
        ok: true as const,
        command: "render" as const,
        input_source: inputSource,
        title: gzhContent.title || null,
        cover: gzhContent.cover || null,
        html: gzhContent.content,
    };
}
