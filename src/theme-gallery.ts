import fs from "node:fs/promises";
import path from "node:path";
import { renderContent } from "./commands/render.js";
import { listThemeDescriptors } from "./theme-registry.js";

export const THEME_GALLERY_FIXTURE = [
    "---",
    "title: 主题画廊样例",
    "cover: https://example.com/gallery-cover.jpg",
    "---",
    "# 稿舟主题画廊",
    "",
    "> 同一篇文章，用不同主题表达不同的阅读节奏。",
    "",
    "## 关键指标",
    "",
    "| 指标 | 本周 | 变化 |",
    "| --- | ---: | ---: |",
    "| 阅读 | 12,480 | +18% |",
    "| 转发 | 1,240 | +7% |",
    "",
    "```ts",
    "const publish = (theme: string) => `render:${theme}`;",
    "```",
    "",
    "![示例图片](https://example.com/gallery-image.jpg)",
].join("\n");

const REQUIRED_FRAGMENTS = ["id=\"wenyan\"", "<h1", "<h2", "<blockquote", "<table", "<pre", "gallery-image.jpg"];

export interface ThemeGalleryResult {
    outputDir: string;
    themeCount: number;
    files: string[];
}

export async function generateThemeGallery(outputDir: string): Promise<ThemeGalleryResult> {
    await fs.mkdir(outputDir, { recursive: true });
    const themes = (await listThemeDescriptors()).filter((theme) => theme.origin !== "custom");
    const files: string[] = [];
    const links: string[] = [];

    for (const theme of themes) {
        const rendered = await renderContent(THEME_GALLERY_FIXTURE, {
            theme: theme.id,
            highlight: "solarized-light",
            macStyle: false,
            footnote: false,
        });

        for (const fragment of REQUIRED_FRAGMENTS) {
            if (!rendered.content.includes(fragment)) {
                throw new Error(`主题 ${theme.id} 未通过画廊语义检查：缺少 ${fragment}`);
            }
        }

        const filename = `${safeThemeId(theme.id)}.html`;
        const filePath = path.join(outputDir, filename);
        const html = `<!doctype html>
<html lang="zh-CN">
<head><meta charset="utf-8"><title>${escapeHtml(theme.name)}</title></head>
<body>${rendered.content}</body>
</html>
`;
        await fs.writeFile(filePath, html, "utf-8");
        files.push(filePath);
        links.push(`<li><a href="${filename}">${escapeHtml(theme.name)} (${theme.id})</a></li>`);
    }

    const index = `<!doctype html>
<html lang="zh-CN">
<head><meta charset="utf-8"><title>稿舟主题画廊</title></head>
<body><h1>稿舟主题画廊</h1><p>共 ${themes.length} 个 core/稿舟内置主题。</p><ul>${links.join("")}</ul></body>
</html>
`;
    const indexPath = path.join(outputDir, "index.html");
    await fs.writeFile(indexPath, index, "utf-8");
    files.unshift(indexPath);

    return { outputDir, themeCount: themes.length, files };
}

function safeThemeId(themeId: string): string {
    return themeId.replace(/[^a-z0-9_-]/gi, "-");
}

function escapeHtml(value: string): string {
    return value.replace(/[&<>\"]/g, (character) => {
        const entities: Record<string, string> = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
        };
        return entities[character] || character;
    });
}
