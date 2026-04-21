import { describe, expect, it } from "vitest";
import { getProjectThemeById, listProjectThemes } from "../src/project-themes.js";

describe("project-owned themes", () => {
    it("ships multiple bundled themes owned by this fork", () => {
        const themes = listProjectThemes();
        const themeIds = themes.map((theme) => theme.id);

        expect(themes.length).toBeGreaterThanOrEqual(18);
        expect(themeIds).toContain("paper-ink");
        expect(themeIds).toContain("midnight-code");
        expect(themeIds).toContain("aurora-slate");
        expect(themeIds).toContain("bamboo-brief");
        expect(themeIds).toContain("cocoa-paper");
        expect(new Set(themeIds).size).toBe(themeIds.length);
    });

    it("returns theme css by id for rendering", () => {
        const theme = getProjectThemeById("paper-ink");

        expect(theme).toMatchObject({
            id: "paper-ink",
        });
        expect(theme?.css).toContain("#wenyan");
    });
});
