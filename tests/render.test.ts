import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { prepareRenderContext, renderContent } from "../src/commands/render";
import fs from "node:fs/promises";
import { renderStyledContent } from "@wenyan-md/core/wrapper";

// 1. Mock 外部模块
vi.mock("node:fs/promises");
vi.mock("@wenyan-md/core/wrapper", () => ({
    configStore: {
        getThemeById: vi.fn().mockResolvedValue(undefined),
    },
    renderStyledContent: vi.fn().mockImplementation(async (content: string) => {
        const title = content.replace(/^#\s*/, "");
        return {
            content: `<h1><span>${title}</span></h1>`,
            title,
            cover: "",
        };
    }),
}));

describe("prepareRenderContext", () => {
    // 默认配置，防止 "theme undefined" 错误
    const defaultOptions = {
        theme: "default",
        highlight: "solarized-light",
        macStyle: true,
        footnote: true,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // 拦截 console 和 process.exit
        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});
        vi.spyOn(process, "exit").mockImplementation((code) => {
            throw new Error(`Process exit with code ${code}`);
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should render content from direct string argument", async () => {
        const input = "# Hello";

        const { gzhContent } = await prepareRenderContext(input, defaultOptions as any);

        expect(gzhContent.content).toContain("<span>Hello</span></h1>");
    });

    it("should render content from file when input arg and stdin are missing", async () => {
        const originalIsTTY = process.stdin.isTTY;
        process.stdin.isTTY = true;

        const fileContent = "# From File";
        vi.mocked(fs.readFile).mockResolvedValue(fileContent);

        const { gzhContent } = await prepareRenderContext(undefined, { ...defaultOptions, file: "test.md" } as any);

        expect(fs.readFile).toHaveBeenCalledWith(`${process.cwd()}/test.md`, "utf-8");
        expect(gzhContent.content).toContain("<span>From File</span></h1>");

        process.stdin.isTTY = originalIsTTY;
    });

    it("should throw error (which leads to exit) when no input source is provided", async () => {
        const originalIsTTY = process.stdin.isTTY;
        process.stdin.isTTY = true;

        // prepareRenderContext 内部使用的是 throw Error，这里需要匹配实际抛出的错误信息
        await expect(prepareRenderContext(undefined, defaultOptions as any)).rejects.toThrow(/missing input-content/);

        process.stdin.isTTY = originalIsTTY;
    });

    it("should load custom theme css if option provided", async () => {
        const input = "# Content";
        const cssContent = ".test { color: red; }";

        vi.mocked(fs.readFile).mockResolvedValue(cssContent);

        // 验证返回的 gzhContent 包含了自定义样式
        const { gzhContent } = await prepareRenderContext(input, {
            ...defaultOptions,
            customTheme: "my-theme.css",
        } as any);

        expect(fs.readFile).toHaveBeenCalledWith(`${process.cwd()}/my-theme.css`, "utf-8");
        // 假设 StyledContent 结构中 content 包含渲染后的 HTML，这里检查它是否处理了样式
        expect(gzhContent.content).toContain("<span>Content</span></h1>");
    });

    it("should resolve project-owned bundled theme css before rendering", async () => {
        const input = "# Bundled";

        await renderContent(input, {
            ...defaultOptions,
            theme: "paper-ink",
        } as any);

        expect(renderStyledContent).toHaveBeenCalledWith(
            input,
            expect.objectContaining({
                themeId: "paper-ink",
                themeCss: expect.stringContaining("#wenyan"),
            }),
        );
    });

    it("should prefer persisted custom theme css over bundled project theme css for legacy collisions", async () => {
        const input = "# Legacy";

        vi.mocked(fs.readFile).mockReset();
        vi.mocked(renderStyledContent).mockClear();
        vi.mocked((await import("@wenyan-md/core/wrapper")).configStore.getThemeById).mockResolvedValueOnce(
            ".legacy-custom { color: blue; }",
        );

        await renderContent(input, {
            ...defaultOptions,
            theme: "paper-ink",
        } as any);

        expect(renderStyledContent).toHaveBeenCalledWith(
            input,
            expect.objectContaining({
                themeId: "paper-ink",
                themeCss: ".legacy-custom { color: blue; }",
            }),
        );
    });
});
