import { beforeEach, describe, expect, it, vi } from "vitest";

const coreThemes = vi.hoisted(() => vi.fn());
const getThemes = vi.hoisted(() => vi.fn());
const getThemeById = vi.hoisted(() => vi.fn());

vi.mock("@wenyan-md/core", () => ({
    getAllGzhThemes: coreThemes,
}));

vi.mock("@wenyan-md/core/wrapper", () => ({
    configStore: {
        getThemes,
        getThemeById,
    },
}));

import { listThemeDescriptors, resolveTheme } from "../src/theme-registry.js";

describe("theme registry", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        coreThemes.mockReturnValue([
            {
                meta: {
                    id: "default",
                    name: "Default",
                    description: "core default",
                },
            },
            {
                meta: {
                    id: "paper-ink",
                    name: "Core Paper",
                    description: "core collision",
                },
            },
        ]);
        getThemes.mockResolvedValue([
            { id: "paper-ink", name: "Legacy Paper", description: "custom collision", path: "themes/paper.css" },
            { id: "custom-only", name: "Custom Only", description: "custom", path: "themes/custom.css" },
        ]);
        getThemeById.mockResolvedValue(undefined);
    });

    it("merges effective themes and records lower-priority collisions", async () => {
        const themes = await listThemeDescriptors();
        const paper = themes.find((theme) => theme.id === "paper-ink");

        expect(paper).toMatchObject({
            id: "paper-ink",
            origin: "custom",
            description: "custom collision",
            shadowedOrigins: ["core", "project"],
        });
        expect(themes.filter((theme) => theme.id === "paper-ink")).toHaveLength(1);
    });

    it("resolves custom CSS before project and core themes", async () => {
        getThemeById.mockImplementation(async (id: string) => (id === "paper-ink" ? ".legacy { color: blue; }" : undefined));

        await expect(resolveTheme("paper-ink")).resolves.toMatchObject({
            descriptor: { origin: "custom" },
            css: ".legacy { color: blue; }",
        });

        await expect(resolveTheme("bamboo-brief")).resolves.toMatchObject({
            descriptor: { origin: "project" },
            css: expect.stringContaining("#wenyan"),
        });

        await expect(resolveTheme("default")).resolves.toMatchObject({
            descriptor: { origin: "core" },
        });
    });

    it("returns undefined for an unknown theme id", async () => {
        await expect(resolveTheme("does-not-exist")).resolves.toBeUndefined();
    });
});
