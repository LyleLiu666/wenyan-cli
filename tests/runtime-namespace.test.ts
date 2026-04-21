import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import os from "node:os";
import path from "node:path";

describe("runtime namespace isolation", () => {
    const originalAppData = process.env.APPDATA;

    beforeEach(() => {
        vi.resetModules();
        delete process.env.APPDATA;
    });

    afterEach(() => {
        if (originalAppData === undefined) {
            delete process.env.APPDATA;
        } else {
            process.env.APPDATA = originalAppData;
        }
    });

    it("derives an isolated runtime appdata root when APPDATA is missing", async () => {
        const { getRuntimeStateRoot } = await import("../src/runtime-namespace.js");

        expect(getRuntimeStateRoot(undefined, "/tmp/home")).toBe(path.join("/tmp/home", ".config", "gaozhou-cli"));
    });

    it("nests under existing APPDATA to avoid sharing upstream runtime state", async () => {
        const { getRuntimeStateRoot } = await import("../src/runtime-namespace.js");

        expect(getRuntimeStateRoot("/tmp/appdata", "/tmp/home")).toBe(path.join("/tmp/appdata", "gaozhou-cli"));
    });

    it("configures APPDATA before core loads so gaozhou gets its own configDir", async () => {
        const { configureRuntimeNamespace } = await import("../src/runtime-namespace.js");

        configureRuntimeNamespace("/tmp/home");

        const { configDir } = await import("@wenyan-md/core/wrapper");

        expect(configDir).toBe(path.join("/tmp/home", ".config", "gaozhou-cli", "wenyan-md"));
        expect(configDir).not.toBe(path.join(os.homedir(), ".config", "wenyan-md"));
    });

    it("is idempotent and does not keep appending the namespace", async () => {
        const { configureRuntimeNamespace } = await import("../src/runtime-namespace.js");

        configureRuntimeNamespace("/tmp/home");
        const once = process.env.APPDATA;
        configureRuntimeNamespace("/tmp/home");

        expect(process.env.APPDATA).toBe(once);
    });
});
