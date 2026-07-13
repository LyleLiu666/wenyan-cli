import { describe, expect, it } from "vitest";
import { getProjectThemeById, listProjectThemes } from "../src/project-themes.js";

describe("project-owned themes", () => {
    it("ships multiple bundled themes owned by this fork", () => {
        const themes = listProjectThemes();
        const themeIds = themes.map((theme) => theme.id);

        expect(themes.length).toBeGreaterThanOrEqual(24);
        expect(themeIds).toContain("paper-ink");
        expect(themeIds).toContain("midnight-code");
        expect(themeIds).toContain("aurora-slate");
        expect(themeIds).toContain("bamboo-brief");
        expect(themeIds).toContain("cocoa-paper");
        expect(themeIds).toContain("executive-brief");
        expect(themeIds).toContain("metrics-brief");
        expect(themeIds).toContain("terminal-brief");
        expect(themeIds).toContain("research-notebook");
        expect(themeIds).toContain("literary-margin");
        expect(themeIds).toContain("newspaper-column");
        expect(new Set(themeIds).size).toBe(themeIds.length);
    });

    it("returns theme css by id for rendering", () => {
        const theme = getProjectThemeById("paper-ink");

        expect(theme).toMatchObject({
            id: "paper-ink",
        });
        expect(theme?.css).toContain("#wenyan");
    });

    it("includes structural recipes instead of only palette changes", () => {
        expect(getProjectThemeById("executive-brief")?.css).toContain('#wenyan h2::before');
        expect(getProjectThemeById("terminal-brief")?.css).toContain('#wenyan pre::before');
        expect(getProjectThemeById("literary-margin")?.css).toContain('#wenyan blockquote::before');
        expect(getProjectThemeById("executive-brief")?.css).not.toBe(getProjectThemeById("metrics-brief")?.css);
    });
});
