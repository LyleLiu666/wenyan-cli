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
    const runtimeStateRoot = getRuntimeStateRoot(process.env.APPDATA, homeDir);
    process.env.APPDATA = runtimeStateRoot;
    return runtimeStateRoot;
}
