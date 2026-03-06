import { describe, it, expect, vi, beforeEach } from "vitest";
import { createProgram } from "../src/index.js";
import { publishCommand } from "../src/commands/publish.js";
import { renderCommand } from "../src/commands/render.js";

vi.mock("../src/commands/publish.js", () => ({
    publishCommand: vi.fn().mockResolvedValue({
        ok: true,
        command: "publish",
        media_id: "mock_media_123",
    }),
}));

vi.mock("../src/commands/render.js", () => ({
    renderCommand: vi.fn().mockResolvedValue({
        ok: true,
        command: "render",
        html: "<h1>Hello</h1>",
    }),
}));

describe("CLI Argument Parsing", () => {
    let program: ReturnType<typeof createProgram>;

    beforeEach(() => {
        vi.clearAllMocks();
        program = createProgram("1.0.0");
        // 关键：防止 commander 在测试失败或调用 help 时直接退出进程
        program.exitOverride();
    });

    it("should verify version flag", () => {
        expect(program.version()).toBe("1.0.0");
    });

    it("should call publish command with correct options", async () => {
        // 模拟命令行输入: wenyan publish -f test.md -t rainbow --no-mac-style
        const args = ["node", "wenyan", "publish", "-f", "test.md", "-t", "rainbow", "--no-mac-style"];
        const stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

        await program.parseAsync(args);

        expect(publishCommand).toHaveBeenCalledTimes(1);

        // 验证传入 publishCommand 的参数
        // 第一个参数是 argument (input-content)，这里没传所以是 undefined
        // 第二个参数是 options 对象
        const expectedOptions = expect.objectContaining({
            file: "test.md",
            footnote: true,
            theme: "rainbow",
            macStyle: false,
            highlight: "solarized-light",
        });

        expect(publishCommand).toHaveBeenCalledWith(undefined, expectedOptions);
        expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('"media_id":"mock_media_123"'));
    });

    it("should call render command with string input", async () => {
        // 模拟命令行输入: wenyan render "# Hello"
        const args = ["node", "wenyan", "render", "# Hello"];
        const stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

        await program.parseAsync(args);

        expect(renderCommand).toHaveBeenCalledTimes(1);
        const expectedOptions = expect.objectContaining({
            footnote: true,
            theme: "default",
            macStyle: true,
            highlight: "solarized-light",
        });
        expect(renderCommand).toHaveBeenCalledWith("# Hello", expectedOptions);
        expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('"command":"render"'));
    });

    it("should pass preflight option to publish command", async () => {
        const args = ["node", "wenyan", "publish", "-f", "test.md", "--preflight"];

        await program.parseAsync(args);

        expect(publishCommand).toHaveBeenCalledWith(
            undefined,
            expect.objectContaining({
                file: "test.md",
                preflight: true,
            }),
        );
    });

    it("should display help when no command is provided", async () => {
        // Spy on console.log or process.stdout if needed,
        // but here we just ensure the default action doesn't crash
        const outputSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
        const args = ["node", "wenyan"];

        await program.parseAsync(args);

        // 默认 action 会调用 outputHelp，通常会写到 stdout
        expect(outputSpy).toHaveBeenCalled();
        outputSpy.mockRestore();
    });
});
