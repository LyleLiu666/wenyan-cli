export interface RenderOptions {
    file?: string;
    theme?: string;
    customTheme?: string;
    highlight: string;
    macStyle: boolean;
    footnote: boolean;
}

export interface PublishOptions extends RenderOptions {
    server?: string;
    apiKey?: string;
    preflight?: boolean;
}

export type InputSource = "argument" | "file" | "stdin";
export type CoverSource = "frontmatter" | "first_image";

export class AppError extends Error {
    constructor(
        public message: string,
        public code: string = "APP_ERROR",
        public details?: Record<string, unknown>,
        public exitCode: number = 1,
    ) {
        super(message);
        this.name = "AppError";
    }
}
