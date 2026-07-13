import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const config = vi.hoisted(() => ({ themes: {} as Record<string, any> }));
const getConfig = vi.hoisted(() => vi.fn(async () => config));

vi.mock("@wenyan-md/core/wrapper", () => ({
    configStore: { getConfig },
}));

import {
    installTheme,
    readThemeSource,
    removeInstalledTheme,
    validateThemeCss,
    validateThemeId,
} from "../src/theme-authoring.js";

describe("theme authoring", () => {
    let runtimeRoot: string;
    const originalAppData = process.env.APPDATA;
    const originalXdgConfigHome = process.env.XDG_CONFIG_HOME;

    beforeEach(async () => {
        runtimeRoot = await fs.mkdtemp(path.join(os.tmpdir(), "gaozhou-authoring-test-"));
        process.env.APPDATA = runtimeRoot;
        process.env.XDG_CONFIG_HOME = runtimeRoot;
        config.themes = {};
        getConfig.mockResolvedValue(config);
    });

    afterEach(async () => {
        await fs.rm(runtimeRoot, { recursive: true, force: true });
    });

    afterAll(async () => {
        if (originalAppData === undefined) delete process.env.APPDATA;
        else process.env.APPDATA = originalAppData;
        if (originalXdgConfigHome === undefined) delete process.env.XDG_CONFIG_HOME;
        else process.env.XDG_CONFIG_HOME = originalXdgConfigHome;
    });

    it("validates theme IDs and catches incomplete CSS", () => {
        expect(() => validateThemeId("valid_theme-01")).not.toThrow();
        expect(() => validateThemeId("Display Theme")).toThrowError(/主题 ID/);
        expect(() => validateThemeCss("#wenyan { color: red; }")).not.toThrow();
        expect(() => validateThemeCss("#wenyan { color: red;")).toThrowError(/语法不完整/);
        expect(() => validateThemeCss("body { color: red; }")).toThrowError(/#wenyan/);
    });

    it("reads a directory theme through its optional manifest", async () => {
        const themeDir = await fs.mkdtemp(path.join(runtimeRoot, "theme-"));
        await fs.writeFile(
            path.join(themeDir, "theme.json"),
            JSON.stringify({ id: "manifest-theme", name: "Manifest Theme", description: "from manifest", css: "style.css" }),
        );
        await fs.writeFile(path.join(themeDir, "style.css"), "#wenyan { color: #123456; }");

        await expect(readThemeSource(themeDir)).resolves.toMatchObject({
            id: "manifest-theme",
            name: "Manifest Theme",
            description: "from manifest",
            css: "#wenyan { color: #123456; }",
        });
    });

    it("installs and removes a theme through atomic config pointers", async () => {
        const installed = await installTheme("atomic-theme", {
            css: "#wenyan { color: #123456; }",
            source: "test",
        });

        expect(installed.id).toBe("atomic-theme");
        expect(config.themes["atomic-theme"]).toMatchObject({ id: "atomic-theme" });
        const configPath = path.join(runtimeRoot, "wenyan-md", "config.json");
        const savedConfig = JSON.parse(await fs.readFile(configPath, "utf-8"));
        const cssPath = path.join(runtimeRoot, "wenyan-md", savedConfig.themes["atomic-theme"].path);
        expect(await fs.readFile(cssPath, "utf-8")).toContain("#123456");

        await expect(removeInstalledTheme("atomic-theme")).resolves.toMatchObject({ id: "atomic-theme" });
        expect(config.themes["atomic-theme"]).toBeUndefined();
        await expect(fs.access(cssPath)).rejects.toThrow();
    });
});
