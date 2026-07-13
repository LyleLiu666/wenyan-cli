import { getNormalizeFilePath } from "../utils.js";
import fs from "node:fs/promises";
import { configStore } from "@wenyan-md/core/wrapper";
import { isCoreTheme, isProjectTheme, listThemeDescriptors, ThemeDescriptor } from "../theme-registry.js";

interface ThemeOptions {
    list?: boolean;
    add?: boolean;
    name?: string;
    path?: string;
    rm?: string;
}

export async function themeCommand(options: ThemeOptions) {
    const { list, add, name, path, rm } = options;
    if (list) {
        await listThemes();
        return;
    }
    if (add) {
        await addTheme(name, path);
        return;
    }
    if (rm) {
        await removeTheme(rm);
        return;
    }
}

async function listThemes() {
    const themes = await listThemeDescriptors();

    console.log("\n内置主题（core）：");
    themes
        .filter((theme) => theme.origin === "core")
        .forEach((theme) => console.log(formatTheme(theme)));

    console.log("\n扩展主题（稿舟）：");
    themes
        .filter((theme) => theme.origin === "project")
        .forEach((theme) => console.log(formatTheme(theme)));

    const customThemes = themes.filter((theme) => theme.origin === "custom");
    if (customThemes.length > 0) {
        console.log("\n自定义主题：");
        customThemes.forEach((theme) => console.log(formatTheme(theme)));
    }
    console.log("");
}

function formatTheme(theme: ThemeDescriptor): string {
    const shadowed = theme.shadowedOrigins?.length
        ? ` [当前优先级高于：${theme.shadowedOrigins.join("、")}，渲染时使用此主题]`
        : "";
    return `- ${theme.id}: ${theme.description}${shadowed}`;
}

async function addTheme(name?: string, path?: string) {
    if (!name || !path) {
        console.log("❌ 添加主题时必须提供名称(name)和路径(path)\n");
        return;
    }

    if (checkBuiltinThemeExists(name) || checkProjectThemeExists(name) || (await checkCustomThemeExists(name))) {
        console.log(`❌ 主题 "${name}" 已存在\n`);
        return;
    }

    if (path.startsWith("http")) {
        console.log(`⏳ 正在从远程获取主题: ${path} ...`);
        const response = await fetch(path);
        if (!response.ok) {
            console.log(`❌ 无法从远程获取主题: ${response.statusText}\n`);
            return;
        }
        const content = await response.text();
        await configStore.addThemeToConfig(name, content);
    } else {
        const normalizePath = getNormalizeFilePath(path);
        const content = await fs.readFile(normalizePath, "utf-8");
        await configStore.addThemeToConfig(name, content);
    }
    console.log(`✅ 主题 "${name}" 已添加\n`);
}

async function removeTheme(name: string) {
    const hasCustomTheme = await checkCustomThemeExists(name);

    if (hasCustomTheme) {
        await configStore.deleteThemeFromConfig(name);
        const fallbackNotice = checkProjectThemeExists(name) ? "，当前会回退到同名扩展主题" : "";
        console.log(`✅ 自定义主题 "${name}" 已删除${fallbackNotice}\n`);
        return;
    }

    if (checkBuiltinThemeExists(name)) {
        console.log(`❌ 内置主题 "${name}" 不能删除\n`);
        return;
    }
    if (checkProjectThemeExists(name)) {
        console.log(`❌ 扩展主题 "${name}" 不能删除\n`);
        return;
    }

    console.log(`❌ 自定义主题 "${name}" 不存在\n`);
}

function checkBuiltinThemeExists(themeId: string): boolean {
    return isCoreTheme(themeId);
}

function checkProjectThemeExists(themeId: string): boolean {
    return isProjectTheme(themeId);
}

async function checkCustomThemeExists(themeId: string): Promise<boolean> {
    const customThemes = await configStore.getThemes();
    return customThemes.some((theme) => theme.id === themeId);
}
