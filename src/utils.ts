import path from "node:path";
import { AppError, InputSource, RenderOptions } from "./types.js";
import fs from "node:fs/promises";

export async function readStdin(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        let data = "";
        process.stdin.setEncoding("utf8");
        process.stdin.on("data", (chunk) => (data += chunk));
        process.stdin.on("end", () => resolve(data));
        process.stdin.on("error", reject);
    });
}

/**
 * 路径标准化工具函数
 * 将 Windows 的反斜杠 \ 转换为正斜杠 /，并去除末尾斜杠
 * 目的：在 Linux 容器内也能正确处理 Windows 路径字符串
 */
function normalizePath(p: string): string {
    return p.replace(/\\/g, "/").replace(/\/+$/, "");
}

export function getNormalizeFilePath(inputPath: string): string {
    const isContainer = !!process.env.CONTAINERIZED;
    if (isContainer) {
        const hostFilePath = normalizePath(process.env.HOST_FILE_PATH || "");
        const containerFilePath = normalizePath(process.env.CONTAINER_FILE_PATH || "/mnt/host-downloads");
        let relativePart = normalizePath(inputPath);
        if (relativePart.startsWith(hostFilePath)) {
            relativePart = relativePart.slice(hostFilePath.length);
        }

        if (!relativePart.startsWith("/")) {
            relativePart = "/" + relativePart;
        }

        return containerFilePath + relativePart;
    } else {
        return path.resolve(inputPath);
    }
}

export async function getInputContent(
    inputContent: string | undefined,
    options: RenderOptions,
): Promise<{ content: string; absoluteDirPath: string | undefined; inputSource: InputSource }> {
    const { file } = options;
    let absoluteDirPath: string | undefined = undefined;

    if (inputContent && file) {
        throw new AppError("不能同时提供 input-content 和 --file", "INPUT_CONFLICT", { file }, 2);
    }

    if (inputContent) {
        return {
            content: inputContent,
            absoluteDirPath,
            inputSource: "argument",
        };
    }

    if (file) {
        const normalizePath = getNormalizeFilePath(file);
        inputContent = await fs.readFile(normalizePath, "utf-8");
        absoluteDirPath = path.dirname(normalizePath);

        return {
            content: inputContent,
            absoluteDirPath,
            inputSource: "file",
        };
    }

    if (!process.stdin.isTTY) {
        inputContent = await readStdin();

        if (inputContent) {
            return {
                content: inputContent,
                absoluteDirPath,
                inputSource: "stdin",
            };
        }
    }

    if (!inputContent) {
        throw new AppError("missing input-content (no argument, no stdin, and no file).", "MISSING_INPUT", undefined, 2);
    }

    return {
        content: inputContent,
        absoluteDirPath,
        inputSource: "stdin",
    };
}

/**
 * 从 Markdown / HTML / Frontmatter 中提取所有图片 URL
 */
export function extractImageUrls(content: string): Set<string> {
    const urls = new Set<string>();

    // Frontmatter cover
    // 支持:
    // cover: ./img.png
    // cover: "./img.png"
    // cover: './img.png'
    const coverRegex = /^\s*cover:\s*(?:["']([^"']+)["']|([^"'\s]+))/gm;

    // Markdown 图片
    // 支持:
    // ![](url)
    // ![](url "title")
    // ![](url 'title')
    // ![](<url>)
    const mdRegex = /!\[[^\]]*]\(\s*(?:<([^>]+)>|([^)\s]+))(?:(?:\s+["'][^"']*["'])?)\s*\)/g;

    // HTML img
    const htmlRegex = /<img\b[^>]*?\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi;

    // 1. 提取 Frontmatter 中的 cover
    for (const match of content.matchAll(coverRegex)) {
        // match[1] 匹配带引号的情况，match[2] 匹配不带引号的情况
        const url = (match[1] ?? match[2])?.trim();
        if (url) urls.add(url);
    }

    // 2. 提取 Markdown 图片
    for (const match of content.matchAll(mdRegex)) {
        const url = (match[1] ?? match[2])?.trim();
        if (url) urls.add(url);
    }

    // 3. 提取 HTML img
    for (const match of content.matchAll(htmlRegex)) {
        const url = match[1]?.trim();
        if (url) urls.add(url);
    }

    return urls;
}
