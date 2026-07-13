import { configStore } from "@wenyan-md/core/wrapper";
import { AppError } from "../types.js";
import { isCoreTheme, isProjectTheme, listThemeDescriptors, resolveTheme, ThemeDescriptor } from "../theme-registry.js";
import {
    installTheme,
    readThemeSource,
    removeInstalledTheme,
    validateThemeCss,
    validateThemeId,
} from "../theme-authoring.js";

export interface ThemeOptions {
    action?: string;
    value?: string;
    list?: boolean;
    show?: string;
    add?: boolean;
    name?: string;
    description?: string;
    path?: string;
    rm?: string;
    remove?: string;
    check?: string;
    json?: boolean;
}

export async function themeCommand(options: ThemeOptions) {
    const action = resolveAction(options);
    switch (action) {
        case "list":
            return listThemes(options.json === true);
        case "show":
            return showTheme(options.value || options.show, options.json === true);
        case "add":
            return addTheme(options, options.json === true);
        case "remove":
            return removeTheme(options.value || options.rm || options.remove, options.json === true);
        case "check":
            return checkTheme(options.value || options.check || options.path, options.json === true);
        default:
            throw new AppError(`不支持的主题操作：${action}`, "INVALID_THEME_ACTION", { action }, 3);
    }
}

function resolveAction(options: ThemeOptions): string {
    if (options.action) return options.action.toLowerCase();
    if (options.list) return "list";
    if (options.show) return "show";
    if (options.add) return "add";
    if (options.rm || options.remove) return "remove";
    if (options.check) return "check";
    // `theme` historically did not require an option; listing is the safest
    // and most discoverable default for both humans and automation.
    return "list";
}

async function listThemes(json: boolean) {
    const themes = await listThemeDescriptors();
    const result = {
        ok: true as const,
        command: "theme" as const,
        action: "list" as const,
        themes,
    };

    if (!json) printThemeList(themes);
    return result;
}

async function showTheme(themeId: string | undefined, json: boolean) {
    if (!themeId) {
        throw new AppError("查看主题时必须提供主题 ID", "MISSING_THEME_ID", undefined, 3);
    }

    const themes = await listThemeDescriptors();
    const descriptor = themes.find((theme) => theme.id === themeId);
    if (!descriptor) {
        throw new AppError(`主题 "${themeId}" 不存在`, "THEME_NOT_FOUND", { theme_id: themeId }, 3);
    }

    const resolved = await resolveTheme(themeId);
    const result = {
        ok: true as const,
        command: "theme" as const,
        action: "show" as const,
        theme: descriptor,
        css_bytes: resolved?.css ? Buffer.byteLength(resolved.css, "utf8") : null,
    };

    if (!json) {
        console.log(`主题：${descriptor.name} (${descriptor.id})`);
        console.log(`来源：${descriptor.origin}`);
        console.log(`说明：${descriptor.description || "（无）"}`);
        console.log(`CSS：${result.css_bytes === null ? "由 core 内置" : `${result.css_bytes} bytes`}`);
    }
    return result;
}

async function addTheme(options: ThemeOptions, json: boolean) {
    const sourcePath = options.path;
    if (!sourcePath) {
        throw new AppError("添加主题时必须提供路径(path)", "MISSING_THEME_SOURCE", undefined, 3);
    }

    // 已明确提供 ID 时先做冲突检查，避免在明显失败的情况下读取网络或文件。
    if (options.name && (isCoreTheme(options.name) || isProjectTheme(options.name) || (await hasCustomTheme(options.name)))) {
        throw new AppError(`主题 "${options.name}" 已存在`, "THEME_EXISTS", { theme_id: options.name }, 3);
    }

    const source = await readThemeSource(sourcePath);
    const themeId = options.name || source.id;
    if (!themeId) {
        throw new AppError("添加主题时必须提供名称(name)，或在 theme.json 中提供 id", "MISSING_THEME_ID", undefined, 3);
    }
    if (source.id && options.name && source.id !== options.name) {
        throw new AppError(`主题 ID 与 manifest 不一致：${options.name} / ${source.id}`, "INVALID_THEME_MANIFEST", undefined, 3);
    }
    if (themeId !== options.name && (isCoreTheme(themeId) || isProjectTheme(themeId) || (await hasCustomTheme(themeId)))) {
        throw new AppError(`主题 "${themeId}" 已存在`, "THEME_EXISTS", { theme_id: themeId }, 3);
    }

    validateThemeCss(source.css);
    const installed = await installTheme(themeId, source, {
        name: source.name,
        description: options.description || source.description,
    });
    const result = {
        ok: true as const,
        command: "theme" as const,
        action: "add" as const,
        theme: installed,
        source: source.source,
    };

    if (!json) console.log(`✅ 主题 "${themeId}" 已添加`);
    return result;
}

async function removeTheme(themeId: string | undefined, json: boolean) {
    if (!themeId) {
        throw new AppError("删除主题时必须提供主题 ID", "MISSING_THEME_ID", undefined, 3);
    }
    const hasCustom = await hasCustomTheme(themeId);
    if (isCoreTheme(themeId) && !hasCustom) {
        throw new AppError(`内置主题 "${themeId}" 不能删除`, "THEME_NOT_REMOVABLE", { theme_id: themeId }, 3);
    }
    if (isProjectTheme(themeId) && !hasCustom) {
        throw new AppError(`扩展主题 "${themeId}" 不能删除`, "THEME_NOT_REMOVABLE", { theme_id: themeId }, 3);
    }

    const removed = await removeInstalledTheme(themeId);
    const result = {
        ok: true as const,
        command: "theme" as const,
        action: "remove" as const,
        theme: removed,
        fallback: isProjectTheme(themeId) ? "project" : isCoreTheme(themeId) ? "core" : undefined,
    };

    if (!json) {
        const fallbackNotice = isProjectTheme(themeId)
            ? "，当前会回退到同名扩展主题"
            : isCoreTheme(themeId)
              ? "，当前会回退到同名 core 主题"
              : "";
        console.log(`✅ 自定义主题 "${themeId}" 已删除${fallbackNotice}`);
    }
    return result;
}

async function checkTheme(sourcePath: string | undefined, json: boolean) {
    if (!sourcePath) {
        throw new AppError("检查主题时必须提供 CSS 文件、主题目录或 URL", "MISSING_THEME_SOURCE", undefined, 3);
    }
    const source = await readThemeSource(sourcePath);
    if (source.id) {
        validateThemeId(source.id);
    }
    validateThemeCss(source.css);
    const result = {
        ok: true as const,
        command: "theme" as const,
        action: "check" as const,
        valid: true as const,
        source: source.source,
        css_bytes: Buffer.byteLength(source.css, "utf8"),
        manifest: source.name || source.description ? { name: source.name, description: source.description } : undefined,
    };
    if (!json) console.log(`✅ 主题 CSS 校验通过：${source.source}`);
    return result;
}

function printThemeList(themes: ThemeDescriptor[]) {
    printThemeGroup("内置主题（core）", themes.filter((theme) => theme.origin === "core"));
    printThemeGroup("扩展主题（稿舟）", themes.filter((theme) => theme.origin === "project"));
    printThemeGroup("自定义主题", themes.filter((theme) => theme.origin === "custom"));
    console.log("");
}

function printThemeGroup(title: string, themes: ThemeDescriptor[]) {
    if (themes.length === 0) return;
    console.log(`\n${title}：`);
    themes.forEach((theme) => console.log(formatTheme(theme)));
}

function formatTheme(theme: ThemeDescriptor): string {
    const shadowed = theme.shadowedOrigins?.length
        ? ` [当前优先级高于：${theme.shadowedOrigins.join("、")}，渲染时使用此主题]`
        : "";
    return `- ${theme.id}: ${theme.description || "（无说明）"}${shadowed}`;
}

async function hasCustomTheme(themeId: string): Promise<boolean> {
    const customThemes = await configStore.getThemes();
    return customThemes.some((theme) => theme.id === themeId);
}
