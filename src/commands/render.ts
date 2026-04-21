import { configStore, renderStyledContent, StyledContent } from "@wenyan-md/core/wrapper";
import { getInputContent, getNormalizeFilePath } from "../utils.js";
import fs from "node:fs/promises";
import { AppError, RenderOptions } from "../types.js";
import { getProjectThemeById } from "../project-themes.js";

interface RenderContext {
    gzhContent: StyledContent;
    absoluteDirPath: string | undefined;
    inputSource: "argument" | "file" | "stdin";
}

async function resolveRegisteredThemeCss(themeId?: string): Promise<string | undefined> {
    if (!themeId) {
        return undefined;
    }

    // 历史上用户保存过的自定义主题需要优先于新增的项目内置主题，
    // 否则升级后会出现“同名主题被静默替换”的行为漂移。
    const customThemeCss = await configStore.getThemeById(themeId);
    if (customThemeCss) {
        return customThemeCss;
    }

    return getProjectThemeById(themeId)?.css;
}

export async function renderContent(content: string, options: RenderOptions): Promise<StyledContent> {
    const { theme, customTheme, highlight, macStyle, footnote } = options;

    let handledCustomTheme: string | undefined = customTheme;
    if (customTheme) {
        const normalizePath = getNormalizeFilePath(customTheme);
        handledCustomTheme = await fs.readFile(normalizePath, "utf-8");
    } else {
        handledCustomTheme = await resolveRegisteredThemeCss(theme);
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
