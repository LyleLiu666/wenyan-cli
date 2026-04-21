import { getAllGzhThemes } from "@wenyan-md/core";
import { getNormalizeFilePath } from "../utils.js";
import fs from "node:fs/promises";
import { configStore } from "@wenyan-md/core/wrapper";
import { getProjectThemeById, listProjectThemes } from "../project-themes.js";

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
    const themes = getAllGzhThemes();
    const projectThemes = listProjectThemes();
    const customThemes = await configStore.getThemes();

    console.log("\n内置主题（core）：");
    themes.forEach((theme) => console.log(`- ${theme.meta.id}: ${theme.meta.description}`));

    console.log("\n扩展主题（稿舟）：");
    projectThemes.forEach((theme) => console.log(`- ${theme.id}: ${theme.description}`));

    if (customThemes.length > 0) {
        console.log("\n自定义主题：");
        customThemes.forEach((theme) => {
            const suffix = checkProjectThemeExists(theme.id) ? " [与扩展主题同名，渲染时优先使用自定义主题]" : "";
            console.log(`- ${theme.id}: ${theme.description ?? ""}${suffix}`);
        });
    }
    console.log("");
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
    const themes = getAllGzhThemes();
    return themes.some((theme) => theme.meta.id === themeId);
}

function checkProjectThemeExists(themeId: string): boolean {
    return Boolean(getProjectThemeById(themeId));
}

async function checkCustomThemeExists(themeId: string): Promise<boolean> {
    const customThemes = await configStore.getThemes();
    return customThemes.some((theme) => theme.id === themeId);
}
