import { Command } from "commander";
import pkg from "../package.json" with { type: "json" };
import { AppError, PublishOptions, RenderOptions } from "./types.js";
import { CLI_DESCRIPTION, CLI_NAME } from "./brand.js";
import { configureRuntimeNamespace } from "./runtime-namespace.js";

configureRuntimeNamespace();

export function createProgram(version: string = pkg.version): Command {
    const program = new Command();

    program
        .name(CLI_NAME)
        .description(CLI_DESCRIPTION)
        .version(version, "-v, --version", "output the current version")
        .action(() => {
            program.outputHelp();
        });

    const addCommonOptions = (cmd: Command) => {
        return cmd
            .argument("[input-content]", "markdown content (string input)")
            .option("-f, --file <path>", "read markdown content from local file")
            .option("-t, --theme <theme-id>", "ID of the theme to use", "default")
            .option("-h, --highlight <highlight-theme-id>", "ID of the code highlight theme to use", "solarized-light")
            .option("-c, --custom-theme <path>", "path to custom theme CSS file")
            .option("--mac-style", "display codeblock with mac style", true)
            .option("--no-mac-style", "disable mac style")
            .option("--footnote", "convert link to footnote", true)
            .option("--no-footnote", "disable footnote");
    };

    const pubCmd = program
        .command("publish")
        .description("Render a markdown file to styled HTML and publish to wechat GZH");

    // 先添加公共选项，再追加 publish 专属选项
    addCommonOptions(pubCmd)
        .option("--server <url>", "Server URL to publish through (e.g. https://api.yourdomain.com)")
        .option("--api-key <apiKey>", "API key for the remote server")
        .option("--preflight", "Validate article metadata without publishing", false)
        .action(async (inputContent: string | undefined, options: PublishOptions) => {
            await runCommandWrapper(async () => {
                // 如果传入了 --server，则走客户端（远程）模式
                if (options.server) {
                    const { publishClient } = await import("./commands/client.js");
                    const result = await publishClient(inputContent, options);
                    return { ...result, mode: "remote" };
                } else {
                    // 走原有的本地直接发布模式
                    const { publishCommand } = await import("./commands/publish.js");
                    const result = await publishCommand(inputContent, options);
                    return { ...result, mode: "local" };
                }
            });
        });

    const renderCmd = program.command("render").description("Render a markdown file to styled HTML");

    addCommonOptions(renderCmd).action(async (inputContent: string | undefined, options: RenderOptions) => {
        await runCommandWrapper(async () => {
            const { renderCommand } = await import("./commands/render.js");
            return await renderCommand(inputContent, options);
        });
    });

    program
        .command("theme")
        .description("Manage themes")
        .option("-l, --list", "List all available themes")
        .option("--add", "Add a new custom theme")
        .option("--name <name>", "Name of the new custom theme")
        .option("--path <path>", "Path to the new custom theme CSS file")
        .option("--rm <name>", "Name of the custom theme to remove")
        .action(async (options) => {
            const { themeCommand } = await import("./commands/theme.js");
            await themeCommand(options);
        });

    program
        .command("broadcast")
        .description("Broadcast a published article to all WeChat followers")
        .requiredOption("-m, --media-id <id>", "Media ID of the article to broadcast")
        .action(async (options: { mediaId: string }) => {
            await runCommandWrapper(async () => {
                const { broadcastCommand } = await import("./commands/broadcast.js");
                return await broadcastCommand(options);
            });
        });

    program
        .command("serve")
        .description("Start a server to provide HTTP API for rendering and publishing")
        .option("-p, --port <port>", "Port to listen on (default: 3000)", "3000")
        .option("--api-key <apiKey>", "API key for authentication")
        .action(async (options: { port?: string; apiKey?: string }) => {
            try {
                const { serveCommand } = await import("./commands/serve.js");
                const port = options.port ? parseInt(options.port, 10) : 3000;
                await serveCommand({ port, version, apiKey: options.apiKey });
            } catch (error: any) {
                console.error(error.message);
                process.exit(1);
            }
        });

    return program;
}

// --- 统一的错误处理包装器 ---
async function runCommandWrapper(action: () => Promise<unknown>) {
    try {
        const result = await action();
        process.stdout.write(`${JSON.stringify(result)}\n`);
    } catch (error) {
        if (error instanceof AppError) {
            process.stdout.write(
                `${JSON.stringify({
                    ok: false,
                    code: error.code,
                    message: error.message,
                    details: error.details,
                })}\n`,
            );
            process.exit(error.exitCode);
            return;
        }

        const message = error instanceof Error ? error.message : String(error);
        process.stdout.write(
            `${JSON.stringify({
                ok: false,
                code: "INTERNAL_ERROR",
                message,
            })}\n`,
        );
        process.exit(1);
    }
}
