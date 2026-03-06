import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs/promises";
import { getInputContent } from "../src/utils.js";

vi.mock("node:fs/promises");

describe("getInputContent", () => {
    const originalIsTTY = process.stdin.isTTY;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        process.stdin.isTTY = originalIsTTY;
        vi.restoreAllMocks();
    });

    it("prefers file input over stdin in non-tty environments", async () => {
        process.stdin.isTTY = false;
        const stdinOnSpy = vi.spyOn(process.stdin, "on");

        vi.mocked(fs.readFile).mockResolvedValue("# From File" as any);

        const result = await getInputContent(undefined, { file: "test.md" } as any);

        expect(stdinOnSpy).not.toHaveBeenCalled();
        expect(fs.readFile).toHaveBeenCalledWith(`${process.cwd()}/test.md`, "utf-8");
        expect(result).toMatchObject({
            content: "# From File",
            absoluteDirPath: process.cwd(),
            inputSource: "file",
        });
    });

    it("rejects when direct input and file input are both provided", async () => {
        await expect(getInputContent("# Hello", { file: "test.md" } as any)).rejects.toMatchObject({
            code: "INPUT_CONFLICT",
        });
    });

    it("reads stdin when no explicit input source is provided", async () => {
        process.stdin.isTTY = false;

        vi.spyOn(process.stdin, "setEncoding").mockImplementation(() => process.stdin);
        vi.spyOn(process.stdin, "on").mockImplementation(((event: string, handler: (...args: any[]) => void) => {
            if (event === "data") {
                handler("# From Stdin");
            }

            if (event === "end") {
                handler();
            }

            return process.stdin;
        }) as any);

        const result = await getInputContent(undefined, {} as any);

        expect(result).toMatchObject({
            content: "# From Stdin",
            absoluteDirPath: undefined,
            inputSource: "stdin",
        });
    });
});
