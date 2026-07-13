import { beforeEach, describe, expect, it, vi } from "vitest";

const removeInstalledTheme = vi.hoisted(() => vi.fn());
const installTheme = vi.hoisted(() => vi.fn());
const readThemeSource = vi.hoisted(() => vi.fn());
const validateThemeCss = vi.hoisted(() => vi.fn());

vi.mock("@wenyan-md/core", () => ({
    getAllGzhThemes: vi.fn(() => []),
}));

vi.mock("@wenyan-md/core/wrapper", () => ({
    configStore: {
        getThemes: vi.fn(),
        addThemeToConfig: vi.fn(),
        deleteThemeFromConfig: vi.fn(),
        getThemeById: vi.fn(),
    },
}));

vi.mock("../src/theme-authoring.js", () => ({
    removeInstalledTheme,
    installTheme,
    readThemeSource,
    validateThemeCss,
}));

import { configStore } from "@wenyan-md/core/wrapper";
import { themeCommand } from "../src/commands/theme.js";

describe("themeCommand", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, "log").mockImplementation(() => {});
    });

    it("allows deleting a legacy custom theme that collides with a bundled project theme", async () => {
        vi.mocked(configStore.getThemes).mockResolvedValue([
            { id: "paper-ink", description: "legacy custom theme" },
        ] as any);
        removeInstalledTheme.mockResolvedValue({
            id: "paper-ink",
            name: "paper-ink",
            description: "legacy custom theme",
            path: "themes/paper-ink.css",
        });

        await themeCommand({ rm: "paper-ink" });

        expect(removeInstalledTheme).toHaveBeenCalledWith("paper-ink");
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('自定义主题 "paper-ink" 已删除'));
    });

    it("still blocks adding a new custom theme that collides with a bundled project theme", async () => {
        vi.mocked(configStore.getThemes).mockResolvedValue([] as any);

        await expect(themeCommand({
            add: true,
            name: "paper-ink",
            path: "./paper-ink.css",
        })).rejects.toMatchObject({ code: "THEME_EXISTS" });

        expect(installTheme).not.toHaveBeenCalled();
    });
});
