import { afterAll, beforeAll, describe, expect, it } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

describe("theme rendering compatibility", () => {
    let renderContent: typeof import("../src/commands/render.js").renderContent;
    let getAllGzhThemes: typeof import("@wenyan-md/core").getAllGzhThemes;
    let registerAllBuiltInThemes: typeof import("@wenyan-md/core").registerAllBuiltInThemes;
    let listProjectThemes: typeof import("../src/project-themes.js").listProjectThemes;
    let runtimeRoot: string;
    const originalAppData = process.env.APPDATA;
    const originalXdgConfigHome = process.env.XDG_CONFIG_HOME;

    beforeAll(async () => {
        runtimeRoot = await fs.mkdtemp(path.join(os.tmpdir(), "gaozhou-theme-test-"));
        process.env.APPDATA = runtimeRoot;
        process.env.XDG_CONFIG_HOME = runtimeRoot;

        ({ renderContent } = await import("../src/commands/render.js"));
        ({ getAllGzhThemes, registerAllBuiltInThemes } = await import("@wenyan-md/core"));
        ({ listProjectThemes } = await import("../src/project-themes.js"));
        registerAllBuiltInThemes();
    });

    afterAll(async () => {
        await fs.rm(runtimeRoot, { recursive: true, force: true });
        if (originalAppData === undefined) delete process.env.APPDATA;
        else process.env.APPDATA = originalAppData;
        if (originalXdgConfigHome === undefined) delete process.env.XDG_CONFIG_HOME;
        else process.env.XDG_CONFIG_HOME = originalXdgConfigHome;
    });

    it("renders every bundled core and project theme against a representative article", async () => {
        const themeIds = [
            ...getAllGzhThemes().map((theme) => theme.meta.id),
            ...listProjectThemes().map((theme) => theme.id),
        ];
        const fixture = `---\ntitle: 主题兼容性测试\ncover: https://example.com/cover.jpg\n---\n# 主标题\n\n> 引用\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n\n\`\`\`ts\nconst answer = 42;\n\`\`\`\n\n![远程图片](https://example.com/article.jpg)`;

        expect(themeIds.length).toBeGreaterThanOrEqual(26);
        for (const themeId of themeIds) {
            const rendered = await renderContent(fixture, {
                theme: themeId,
                highlight: "solarized-light",
                macStyle: false,
                footnote: false,
            });

            expect(rendered.content, themeId).toContain('id="wenyan"');
            expect(rendered.content, themeId).toContain("<h1");
            expect(rendered.content, themeId).toContain("<blockquote");
            expect(rendered.content, themeId).toContain("<table");
            expect(rendered.content, themeId).toContain("<pre");
            expect(rendered.content, themeId).toContain("article.jpg");
        }
    }, 120_000);
});
