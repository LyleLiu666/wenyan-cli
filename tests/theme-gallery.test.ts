import { afterAll, beforeAll, describe, expect, it } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

describe("theme gallery", () => {
    let generateThemeGallery: typeof import("../src/theme-gallery.js").generateThemeGallery;
    let outputDir: string;
    const originalAppData = process.env.APPDATA;
    const originalXdgConfigHome = process.env.XDG_CONFIG_HOME;

    beforeAll(async () => {
        outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "gaozhou-gallery-test-"));
        process.env.APPDATA = outputDir;
        process.env.XDG_CONFIG_HOME = outputDir;
        await import("../src/index.js");
        ({ generateThemeGallery } = await import("../src/theme-gallery.js"));
    });

    afterAll(async () => {
        await fs.rm(outputDir, { recursive: true, force: true });
        if (originalAppData === undefined) delete process.env.APPDATA;
        else process.env.APPDATA = originalAppData;
        if (originalXdgConfigHome === undefined) delete process.env.XDG_CONFIG_HOME;
        else process.env.XDG_CONFIG_HOME = originalXdgConfigHome;
    });

    it("writes one semantically valid HTML page per built-in theme", async () => {
        const result = await generateThemeGallery(outputDir);
        const index = await fs.readFile(path.join(outputDir, "index.html"), "utf-8");

        expect(result.themeCount).toBeGreaterThanOrEqual(26);
        expect(result.files).toHaveLength(result.themeCount + 1);
        expect(index).toContain("稿舟主题画廊");
        for (const filePath of result.files.slice(1)) {
            const html = await fs.readFile(filePath, "utf-8");
            expect(html).toContain('id="wenyan"');
            expect(html).toContain("<table");
            expect(html).toContain("<pre");
        }
    });
});
