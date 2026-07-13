import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import * as coreWrapper from "@wenyan-md/core/wrapper";
import { AppError } from "./types.js";
import { getNormalizeFilePath } from "./utils.js";

const MAX_THEME_CSS_BYTES = 256 * 1024;
const THEME_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{1,63}$/;

export interface ThemeManifest {
    id?: string;
    name?: string;
    description?: string;
    css?: string;
}

export interface ThemeSource {
    css: string;
    id?: string;
    name?: string;
    description?: string;
    source: string;
}

export interface InstalledTheme {
    id: string;
    name: string;
    description: string;
    path: string;
}

export function validateThemeId(themeId: string): void {
    if (!THEME_ID_PATTERN.test(themeId)) {
        throw new AppError(
            `主题 ID 只能使用小写字母、数字、下划线和连字符，长度为 2-64：${themeId}`,
            "INVALID_THEME_ID",
            { theme_id: themeId },
            3,
        );
    }
}

export function validateThemeCss(css: string): void {
    if (!css.trim()) {
        throw new AppError("主题 CSS 不能为空", "INVALID_THEME_CSS", undefined, 3);
    }
    if (Buffer.byteLength(css, "utf8") > MAX_THEME_CSS_BYTES) {
        throw new AppError("主题 CSS 不能超过 256KB", "INVALID_THEME_CSS", { max_bytes: MAX_THEME_CSS_BYTES }, 3);
    }
    if (!/#wenyan\b/i.test(css)) {
        throw new AppError("主题 CSS 必须至少包含一个 #wenyan 选择器", "INVALID_THEME_CSS", undefined, 3);
    }
    const cssWithoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
    if (/@import\b/i.test(cssWithoutComments)) {
        throw new AppError("主题 CSS 不支持 @import，请将依赖样式内联", "INVALID_THEME_CSS", undefined, 3);
    }

    let braces = 0;
    let quote: "'" | '"' | undefined;
    let inComment = false;
    let escaped = false;

    for (let index = 0; index < css.length; index += 1) {
        const character = css[index];
        const next = css[index + 1];

        if (inComment) {
            if (character === "*" && next === "/") {
                inComment = false;
                index += 1;
            }
            continue;
        }

        if (quote) {
            if (escaped) {
                escaped = false;
            } else if (character === "\\") {
                escaped = true;
            } else if (character === quote) {
                quote = undefined;
            }
            continue;
        }

        if (character === "/" && next === "*") {
            inComment = true;
            index += 1;
            continue;
        }
        if (character === "'" || character === '"') {
            quote = character;
            continue;
        }
        if (character === "{") braces += 1;
        if (character === "}") {
            braces -= 1;
            if (braces < 0) break;
        }
    }

    if (inComment || quote || braces !== 0 || !css.includes("{")) {
        throw new AppError("主题 CSS 语法不完整：请检查引号、注释和大括号", "INVALID_THEME_CSS", undefined, 3);
    }
}

export async function readThemeSource(input: string): Promise<ThemeSource> {
    if (/^https?:\/\//i.test(input)) {
        let response: Response;
        try {
            response = await fetch(input, { signal: AbortSignal.timeout(30_000) });
        } catch (error) {
            throw new AppError(
                `无法获取主题源：${error instanceof Error ? error.message : String(error)}`,
                "THEME_SOURCE_ERROR",
                { source: input },
                3,
            );
        }
        if (!response.ok) {
            throw new AppError(`无法从远程获取主题：${response.status} ${response.statusText}`, "THEME_SOURCE_ERROR", {
                source: input,
                status: response.status,
            }, 3);
        }
        return { css: await response.text(), source: input };
    }

    const resolvedPath = getNormalizeFilePath(input);
    let stats;
    try {
        stats = await fs.stat(resolvedPath);
    } catch (error) {
        throw new AppError(
            `主题源不存在：${resolvedPath}`,
            "THEME_SOURCE_ERROR",
            { source: resolvedPath, reason: error instanceof Error ? error.message : String(error) },
            3,
        );
    }
    if (!stats.isDirectory()) {
        try {
            return { css: await fs.readFile(resolvedPath, "utf-8"), source: resolvedPath };
        } catch (error) {
            throw new AppError(
                `主题 CSS 无法读取：${resolvedPath}`,
                "THEME_SOURCE_ERROR",
                { source: resolvedPath, reason: error instanceof Error ? error.message : String(error) },
                3,
            );
        }
    }

    const manifestPath = path.join(resolvedPath, "theme.json");
    let manifest: ThemeManifest = {};
    try {
        manifest = JSON.parse(await fs.readFile(manifestPath, "utf-8")) as ThemeManifest;
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
            throw new AppError(`主题 manifest 无法解析：${manifestPath}`, "INVALID_THEME_MANIFEST", { source: manifestPath }, 3);
        }
    }

    const cssPath = path.join(resolvedPath, manifest.css || "theme.css");
    let css: string;
    try {
        css = await fs.readFile(cssPath, "utf-8");
    } catch (error) {
        throw new AppError(
            `主题目录缺少 CSS 文件：${cssPath}`,
            "THEME_SOURCE_ERROR",
            { source: cssPath, reason: error instanceof Error ? error.message : String(error) },
            3,
        );
    }
    return {
        css,
        id: manifest.id,
        name: manifest.name,
        description: manifest.description,
        source: cssPath,
    };
}

export async function installTheme(themeId: string, source: ThemeSource, metadata: { name?: string; description?: string } = {}) {
    validateThemeId(themeId);
    validateThemeCss(source.css);

    const configStore = getConfigStore();
    const config = await configStore.getConfig();
    const configDir = getConfigDir();
    const configPath = getConfigPath(configDir);
    const previous = config.themes?.[themeId];
    const installedName = metadata.name || source.name || themeId;
    const installedDescription = metadata.description || source.description || "";
    const token = crypto.randomUUID();
    const relativePath = `themes/${themeId}.${token}.css`;
    const absolutePath = path.join(configDir, relativePath);
    const themesDir = path.dirname(absolutePath);

    await fs.mkdir(themesDir, { recursive: true });
    const temporaryCssPath = `${absolutePath}.tmp-${crypto.randomUUID()}`;
    try {
        await fs.writeFile(temporaryCssPath, source.css, "utf-8");
        await fs.rename(temporaryCssPath, absolutePath);
    } catch (error) {
        await fs.rm(temporaryCssPath, { force: true });
        throw new AppError(
            `主题文件写入失败：${error instanceof Error ? error.message : String(error)}`,
            "THEME_INSTALL_FAILED",
            { theme_id: themeId },
            3,
        );
    }

    const nextConfig = {
        ...config,
        themes: {
            ...(config.themes || {}),
            [themeId]: {
                id: themeId,
                name: installedName,
                description: installedDescription,
                path: relativePath,
            },
        },
    };

    try {
        await writeJsonAtomically(configPath, nextConfig);
        config.themes = nextConfig.themes;
    } catch (error) {
        await fs.rm(absolutePath, { force: true });
        throw new AppError(
            `主题安装失败：${error instanceof Error ? error.message : String(error)}`,
            "THEME_INSTALL_FAILED",
            { theme_id: themeId },
            3,
        );
    }

    if (previous?.path && previous.path !== relativePath) {
        await fs.rm(path.join(configDir, previous.path), { force: true });
    }

    return {
        id: themeId,
        name: installedName,
        description: installedDescription,
        path: relativePath,
    } satisfies InstalledTheme;
}

export async function removeInstalledTheme(themeId: string): Promise<InstalledTheme> {
    const configStore = getConfigStore();
    const config = await configStore.getConfig();
    const existing = config.themes?.[themeId];
    if (!existing) {
        throw new AppError(`自定义主题 "${themeId}" 不存在`, "THEME_NOT_FOUND", { theme_id: themeId }, 3);
    }

    const configDir = getConfigDir();
    const configPath = getConfigPath(configDir);
    const nextThemes = { ...(config.themes || {}) };
    delete nextThemes[themeId];
    await writeJsonAtomically(configPath, { ...config, themes: nextThemes });
    config.themes = nextThemes;
    await fs.rm(path.join(configDir, existing.path), { force: true });

    return {
        id: themeId,
        name: existing.name || themeId,
        description: existing.description || "",
        path: existing.path,
    };
}

function getConfigStore() {
    return coreWrapper.configStore;
}

function getConfigDir(): string {
    try {
        const configured = (coreWrapper as unknown as Record<string, unknown>).configDir;
        if (typeof configured === "string" && configured) return configured;
    } catch {
        // Minimal test doubles may omit configDir.
    }
    const root = process.env.XDG_CONFIG_HOME || process.env.APPDATA || path.join(os.homedir(), ".config", "gaozhou-cli");
    return path.join(root, "wenyan-md");
}

function getConfigPath(configDir: string): string {
    try {
        const configured = (coreWrapper as unknown as Record<string, unknown>).configPath;
        if (typeof configured === "string" && configured) return configured;
    } catch {
        // Minimal test doubles may omit configPath.
    }
    return path.join(configDir, "config.json");
}

async function writeJsonAtomically(filePath: string, value: unknown): Promise<void> {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const temporaryPath = `${filePath}.tmp-${crypto.randomUUID()}`;
    try {
        await fs.writeFile(temporaryPath, JSON.stringify(value, null, 2), "utf-8");
        await fs.rename(temporaryPath, filePath);
    } finally {
        await fs.rm(temporaryPath, { force: true });
    }
}
