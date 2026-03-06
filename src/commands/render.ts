import { configStore, renderStyledContent, StyledContent } from "@wenyan-md/core/wrapper";
import { getInputContent, getNormalizeFilePath } from "../utils.js";
import fs from "node:fs/promises";
import { AppError, RenderOptions } from "../types.js";

interface RenderContext {
    gzhContent: StyledContent;
    absoluteDirPath: string | undefined;
    inputSource: "argument" | "file" | "stdin";
}

export async function renderContent(content: string, options: RenderOptions): Promise<StyledContent> {
    const { theme, customTheme, highlight, macStyle, footnote } = options;

    let handledCustomTheme: string | undefined = customTheme;
    if (customTheme) {
        const normalizePath = getNormalizeFilePath(customTheme);
        handledCustomTheme = await fs.readFile(normalizePath, "utf-8");
    } else if (theme) {
        // 否则尝试读取配置中的自定义主题
        handledCustomTheme = await configStore.getThemeById(theme);
    }

    if (!handledCustomTheme && !theme) {
        throw new AppError(`theme "${theme}" not found.`);
    }

    // 5. 执行核心渲染
    const gzhContent = await renderStyledContent(content, {
        themeId: theme,
        hlThemeId: highlight,
        isMacStyle: macStyle,
        isAddFootnote: footnote,
        themeCss: handledCustomTheme,
    });

    return gzhContent;
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
