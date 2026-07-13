import * as core from "@wenyan-md/core";
import { configStore } from "@wenyan-md/core/wrapper";
import { getProjectThemeById, listProjectThemes } from "./project-themes.js";

export type ThemeOrigin = "core" | "project" | "custom";

export interface ThemeDescriptor {
    id: string;
    name: string;
    description: string;
    origin: ThemeOrigin;
    shadowedOrigins?: ThemeOrigin[];
}

export interface ResolvedTheme {
    descriptor: ThemeDescriptor;
    css?: string;
}

interface CandidateTheme {
    descriptor: ThemeDescriptor;
    precedence: number;
    css?: string;
}

const ORIGIN_PRECEDENCE: Record<ThemeOrigin, number> = {
    core: 0,
    project: 1,
    custom: 2,
};

function ensureCoreThemesRegistered(): void {
    // v3 core registers built-ins while creating a renderer. Theme listing and
    // validation can run before that renderer is created, so make the registry
    // usable on its own as well. The optional call keeps test doubles and older
    // compatible core versions working.
    try {
        core.registerAllBuiltInThemes?.();
    } catch {
        // Some callers provide a minimal core-compatible test double.
    }
}

function getCoreCandidates(): CandidateTheme[] {
    ensureCoreThemesRegistered();
    return core.getAllGzhThemes().map((theme) => ({
        descriptor: {
            id: theme.meta.id,
            name: theme.meta.name,
            description: theme.meta.description,
            origin: "core",
        },
        precedence: ORIGIN_PRECEDENCE.core,
    }));
}

function getProjectCandidates(): CandidateTheme[] {
    return listProjectThemes().map((theme) => ({
        descriptor: {
            id: theme.id,
            name: theme.name,
            description: theme.description,
            origin: "project",
        },
        precedence: ORIGIN_PRECEDENCE.project,
        css: theme.css,
    }));
}

function getCustomCandidates(customThemes: Array<{ id: string; name?: string; description?: string }>): CandidateTheme[] {
    return customThemes.map((theme) => ({
        descriptor: {
            id: theme.id,
            name: theme.name || theme.id,
            description: theme.description || "",
            origin: "custom",
        },
        precedence: ORIGIN_PRECEDENCE.custom,
    }));
}

function mergeCandidates(candidates: CandidateTheme[]): Map<string, CandidateTheme> {
    const merged = new Map<string, CandidateTheme>();

    for (const candidate of candidates) {
        const current = merged.get(candidate.descriptor.id);
        if (!current) {
            merged.set(candidate.descriptor.id, candidate);
            continue;
        }

        if (candidate.precedence >= current.precedence) {
            const shadowedOrigins = new Set(current.descriptor.shadowedOrigins || []);
            shadowedOrigins.add(current.descriptor.origin);
            merged.set(candidate.descriptor.id, {
                ...candidate,
                descriptor: {
                    ...candidate.descriptor,
                    shadowedOrigins: [...shadowedOrigins],
                },
            });
        } else {
            const shadowedOrigins = new Set(current.descriptor.shadowedOrigins || []);
            shadowedOrigins.add(candidate.descriptor.origin);
            merged.set(candidate.descriptor.id, {
                ...current,
                descriptor: {
                    ...current.descriptor,
                    shadowedOrigins: [...shadowedOrigins],
                },
            });
        }
    }

    return merged;
}

export function isCoreTheme(themeId: string): boolean {
    ensureCoreThemesRegistered();
    return core.getAllGzhThemes().some((theme) => theme.meta.id === themeId);
}

export function isProjectTheme(themeId: string): boolean {
    return Boolean(getProjectThemeById(themeId));
}

export async function listThemeDescriptors(): Promise<ThemeDescriptor[]> {
    const customThemes = await configStore.getThemes();
    return [...mergeCandidates([...getCoreCandidates(), ...getProjectCandidates(), ...getCustomCandidates(customThemes)])]
        .map(([, candidate]) => candidate.descriptor);
}

export async function resolveTheme(themeId: string): Promise<ResolvedTheme | undefined> {
    const customCss = await configStore.getThemeById(themeId);
    if (customCss) {
        const shadowedOrigins: ThemeOrigin[] = [];
        if (isProjectTheme(themeId)) shadowedOrigins.push("project");
        if (isCoreTheme(themeId)) shadowedOrigins.push("core");
        return {
            descriptor: {
                id: themeId,
                name: themeId,
                description: "",
                origin: "custom",
                ...(shadowedOrigins.length > 0 ? { shadowedOrigins } : {}),
            },
            css: customCss,
        };
    }

    const projectTheme = getProjectThemeById(themeId);
    if (projectTheme) {
        return { descriptor: toProjectDescriptor(projectTheme), css: projectTheme.css };
    }

    ensureCoreThemesRegistered();
    const coreTheme = core.getAllGzhThemes().find((theme) => theme.meta.id === themeId);
    if (coreTheme) {
        return {
            descriptor: {
                id: coreTheme.meta.id,
                name: coreTheme.meta.name,
                description: coreTheme.meta.description,
                origin: "core",
            },
        };
    }

    return undefined;
}

function toProjectDescriptor(theme: { id: string; name: string; description: string }): ThemeDescriptor {
    return {
        id: theme.id,
        name: theme.name,
        description: theme.description,
        origin: "project",
    };
}
