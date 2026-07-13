import os from "node:os";
import path from "node:path";

const RUNTIME_NAMESPACE = "gaozhou-cli";

export function getRuntimeStateRoot(appData = process.env.APPDATA, homeDir = os.homedir()): string {
    if (appData) {
        if (path.basename(appData) === RUNTIME_NAMESPACE) {
            return appData;
        }
        return path.join(appData, RUNTIME_NAMESPACE);
    }

    return path.join(homeDir, ".config", RUNTIME_NAMESPACE);
}

export function configureRuntimeNamespace(homeDir?: string): string {
    // core v3 在 Unix 上优先使用 XDG_CONFIG_HOME；只设置 APPDATA 会让
    // gaozhou 与 wenyan-md 重新共享配置和上传缓存。
    const configuredRoot = process.env.APPDATA || process.env.XDG_CONFIG_HOME;
    const runtimeStateRoot = getRuntimeStateRoot(configuredRoot, homeDir);
    process.env.APPDATA = runtimeStateRoot;
    process.env.XDG_CONFIG_HOME = runtimeStateRoot;
    return runtimeStateRoot;
}
