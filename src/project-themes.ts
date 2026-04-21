export interface ProjectTheme {
    id: string;
    name: string;
    description: string;
    css: string;
}

interface ThemePalette {
    paper: string;
    panel: string;
    text: string;
    muted: string;
    accent: string;
    accentSoft: string;
    border: string;
    codeBg: string;
    quoteBg: string;
    tableHeadBg: string;
    tableStripeBg: string;
}

function createThemeCss(palette: ThemePalette): string {
    return `
#wenyan {
    color: ${palette.text};
    background: ${palette.paper};
    line-height: 1.85;
    letter-spacing: 0.02em;
    font-family: "PingFang SC", "Noto Serif SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
}

#wenyan a {
    color: ${palette.accent};
    text-decoration: none;
    border-bottom: 1px solid ${palette.accentSoft};
}

#wenyan h1,
#wenyan h2,
#wenyan h3 {
    color: ${palette.text};
    line-height: 1.45;
    letter-spacing: 0.01em;
}

#wenyan h1 {
    margin: 1.8em 0 1em;
    padding: 0.55em 0.85em;
    background: linear-gradient(135deg, ${palette.panel}, ${palette.paper});
    border-left: 6px solid ${palette.accent};
    border-radius: 14px;
}

#wenyan h2 {
    margin: 1.6em 0 0.9em;
    padding-bottom: 0.35em;
    border-bottom: 2px solid ${palette.border};
}

#wenyan h3 {
    margin: 1.3em 0 0.7em;
    padding-left: 0.7em;
    border-left: 4px solid ${palette.accentSoft};
}

#wenyan p,
#wenyan li {
    color: ${palette.text};
}

#wenyan strong {
    color: ${palette.accent};
}

#wenyan blockquote {
    margin: 1.2em 0;
    padding: 1em 1.1em;
    background: ${palette.quoteBg};
    border-left: 4px solid ${palette.accent};
    border-radius: 12px;
    color: ${palette.muted};
}

#wenyan img {
    border-radius: 12px;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}

#wenyan hr {
    border: none;
    border-top: 1px solid ${palette.border};
    margin: 2em 0;
}

#wenyan p code,
#wenyan li code {
    color: ${palette.accent};
    background: ${palette.panel};
    padding: 0.18em 0.42em;
    border-radius: 6px;
}

#wenyan pre {
    background: ${palette.codeBg};
    border: 1px solid ${palette.border};
    border-radius: 16px;
    padding: 1em;
    overflow-x: auto;
}

#wenyan table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.2em 0;
    overflow: hidden;
    border-radius: 12px;
    border: 1px solid ${palette.border};
}

#wenyan table th {
    background: ${palette.tableHeadBg};
    color: ${palette.text};
}

#wenyan table th,
#wenyan table td {
    padding: 0.7em 0.85em;
    border: 1px solid ${palette.border};
}

#wenyan table tr:nth-child(even) {
    background: ${palette.tableStripeBg};
}
`.trim();
}

const projectThemes: ProjectTheme[] = [
    {
        id: "paper-ink",
        name: "Paper Ink",
        description: "A calm editorial theme with ink-like contrast and paper warmth.",
        css: createThemeCss({
            paper: "#fcfaf6",
            panel: "#f4ede2",
            text: "#2f241f",
            muted: "#5d4d44",
            accent: "#8f3f2f",
            accentSoft: "#d8b49b",
            border: "#dbcdbd",
            codeBg: "#f3eee7",
            quoteBg: "#f8f1e8",
            tableHeadBg: "#efe4d6",
            tableStripeBg: "#fbf6ef",
        }),
    },
    {
        id: "forest-notes",
        name: "Forest Notes",
        description: "A botanical green theme for calm, structured long-form reading.",
        css: createThemeCss({
            paper: "#f7fbf8",
            panel: "#e9f4ee",
            text: "#1f3a2f",
            muted: "#436052",
            accent: "#2f7d5c",
            accentSoft: "#b8ddcb",
            border: "#c8dfd3",
            codeBg: "#edf6f1",
            quoteBg: "#eef8f2",
            tableHeadBg: "#dfefe7",
            tableStripeBg: "#f6faf7",
        }),
    },
    {
        id: "sunset-magazine",
        name: "Sunset Magazine",
        description: "A bold magazine tone with coral accents and warm highlights.",
        css: createThemeCss({
            paper: "#fff9f6",
            panel: "#ffe9e1",
            text: "#3c2a28",
            muted: "#6b504c",
            accent: "#dd6b4d",
            accentSoft: "#f3c0a9",
            border: "#f1d3c5",
            codeBg: "#fff1ea",
            quoteBg: "#fff0e8",
            tableHeadBg: "#ffe1d5",
            tableStripeBg: "#fff7f2",
        }),
    },
    {
        id: "midnight-code",
        name: "Midnight Code",
        description: "A sharp reader theme with deeper contrast and darker code surfaces.",
        css: createThemeCss({
            paper: "#f7f8fb",
            panel: "#e8ecf5",
            text: "#1f2937",
            muted: "#475569",
            accent: "#3452a5",
            accentSoft: "#bcc7ea",
            border: "#d4dbeb",
            codeBg: "#1f2937",
            quoteBg: "#edf2ff",
            tableHeadBg: "#dce5fb",
            tableStripeBg: "#f5f7fd",
        }),
    },
    {
        id: "lotus-breeze",
        name: "Lotus Breeze",
        description: "A soft rose-toned theme with gentle contrast and elegant spacing.",
        css: createThemeCss({
            paper: "#fffafc",
            panel: "#fdeef4",
            text: "#472a35",
            muted: "#7a5160",
            accent: "#c0557a",
            accentSoft: "#efbfd0",
            border: "#efd6df",
            codeBg: "#fdf1f5",
            quoteBg: "#fff2f6",
            tableHeadBg: "#f9e1ea",
            tableStripeBg: "#fff8fb",
        }),
    },
    {
        id: "amber-ledger",
        name: "Amber Ledger",
        description: "A notebook-like amber palette with strong section hierarchy.",
        css: createThemeCss({
            paper: "#fffdf8",
            panel: "#f9f0d9",
            text: "#44351c",
            muted: "#6d5c3d",
            accent: "#b7791f",
            accentSoft: "#ead29f",
            border: "#e7d7b0",
            codeBg: "#fbf4e3",
            quoteBg: "#fff5df",
            tableHeadBg: "#f6e7bd",
            tableStripeBg: "#fffbf1",
        }),
    },
    {
        id: "ocean-journal",
        name: "Ocean Journal",
        description: "A crisp teal theme that feels clean, modern, and quietly technical.",
        css: createThemeCss({
            paper: "#f6fbfc",
            panel: "#e2f2f4",
            text: "#1f3941",
            muted: "#47656d",
            accent: "#16839a",
            accentSoft: "#b5dde5",
            border: "#c7e1e6",
            codeBg: "#eaf6f8",
            quoteBg: "#edf7f9",
            tableHeadBg: "#d7edf1",
            tableStripeBg: "#f7fbfc",
        }),
    },
    {
        id: "graphite-letter",
        name: "Graphite Letter",
        description: "A monochrome letterpress-inspired theme with precise contrast.",
        css: createThemeCss({
            paper: "#fafafa",
            panel: "#eeeeee",
            text: "#222222",
            muted: "#4a4a4a",
            accent: "#5b5b5b",
            accentSoft: "#cfcfcf",
            border: "#dddddd",
            codeBg: "#f0f0f0",
            quoteBg: "#f5f5f5",
            tableHeadBg: "#ebebeb",
            tableStripeBg: "#fbfbfb",
        }),
    },
    {
        id: "aurora-slate",
        name: "Aurora Slate",
        description: "A cool slate theme with gentle aurora greens and a calm technical feel.",
        css: createThemeCss({
            paper: "#f7fafb",
            panel: "#e6f0ef",
            text: "#20323a",
            muted: "#4e6871",
            accent: "#3d8b83",
            accentSoft: "#b9dcd5",
            border: "#cfe1de",
            codeBg: "#edf5f4",
            quoteBg: "#eef7f5",
            tableHeadBg: "#dceceb",
            tableStripeBg: "#f8fbfb",
        }),
    },
    {
        id: "bamboo-brief",
        name: "Bamboo Brief",
        description: "A restrained bamboo-green theme that feels neat, steady, and readable.",
        css: createThemeCss({
            paper: "#f9fcf7",
            panel: "#edf5e7",
            text: "#243625",
            muted: "#506550",
            accent: "#5f8b3a",
            accentSoft: "#cfe2b9",
            border: "#d7e5cb",
            codeBg: "#f1f7eb",
            quoteBg: "#f3f8ef",
            tableHeadBg: "#e6f1dc",
            tableStripeBg: "#fbfdf9",
        }),
    },
    {
        id: "cocoa-paper",
        name: "Cocoa Paper",
        description: "A cocoa-toned reading theme with cozy contrast for essay-style writing.",
        css: createThemeCss({
            paper: "#fdf8f3",
            panel: "#f3e5d9",
            text: "#3b2a22",
            muted: "#6c5448",
            accent: "#9a5a3c",
            accentSoft: "#ddbea9",
            border: "#e5d1c3",
            codeBg: "#f6ece4",
            quoteBg: "#f9efe8",
            tableHeadBg: "#ecdacc",
            tableStripeBg: "#fefaf7",
        }),
    },
    {
        id: "dune-notebook",
        name: "Dune Notebook",
        description: "A desert-beige notebook style with warm structure and soft contrast.",
        css: createThemeCss({
            paper: "#fffdf8",
            panel: "#f5ecd8",
            text: "#403221",
            muted: "#705d45",
            accent: "#b2884a",
            accentSoft: "#e5cfab",
            border: "#e8dcc1",
            codeBg: "#faf3e4",
            quoteBg: "#fdf5e8",
            tableHeadBg: "#f1e2c0",
            tableStripeBg: "#fffdf7",
        }),
    },
    {
        id: "mist-ledger",
        name: "Mist Ledger",
        description: "A misty blue-gray palette for clean, structured notes and reports.",
        css: createThemeCss({
            paper: "#f8fafc",
            panel: "#e8eef3",
            text: "#263847",
            muted: "#567083",
            accent: "#537a9b",
            accentSoft: "#c7d8e5",
            border: "#d6e1ea",
            codeBg: "#edf3f7",
            quoteBg: "#eef4f8",
            tableHeadBg: "#dfe8ef",
            tableStripeBg: "#fafcff",
        }),
    },
    {
        id: "maple-editorial",
        name: "Maple Editorial",
        description: "A red-maple editorial look with stronger contrast and magazine warmth.",
        css: createThemeCss({
            paper: "#fff9f7",
            panel: "#fbe7df",
            text: "#402624",
            muted: "#734b47",
            accent: "#b64e41",
            accentSoft: "#efb7af",
            border: "#efd3cf",
            codeBg: "#fdf0ec",
            quoteBg: "#fff1ee",
            tableHeadBg: "#f8ddd6",
            tableStripeBg: "#fffaf8",
        }),
    },
    {
        id: "jade-manuscript",
        name: "Jade Manuscript",
        description: "A clear jade-tinted theme with a balanced, graceful reading rhythm.",
        css: createThemeCss({
            paper: "#f7fcfb",
            panel: "#e4f3f0",
            text: "#1f3836",
            muted: "#486764",
            accent: "#2a8c7d",
            accentSoft: "#b7e1d9",
            border: "#cae4df",
            codeBg: "#ebf7f4",
            quoteBg: "#edf8f5",
            tableHeadBg: "#d9efea",
            tableStripeBg: "#f8fcfb",
        }),
    },
    {
        id: "steel-column",
        name: "Steel Column",
        description: "A steel-blue theme tuned for technical articles and data-heavy notes.",
        css: createThemeCss({
            paper: "#f7f9fc",
            panel: "#e3e9f3",
            text: "#202f45",
            muted: "#50627d",
            accent: "#476a9f",
            accentSoft: "#bfcee7",
            border: "#d1dced",
            codeBg: "#ebf0f8",
            quoteBg: "#edf2fa",
            tableHeadBg: "#dbe4f3",
            tableStripeBg: "#f8fafe",
        }),
    },
    {
        id: "peach-study",
        name: "Peach Study",
        description: "A soft peach classroom tone suited to tutorials and gentle explainers.",
        css: createThemeCss({
            paper: "#fffaf7",
            panel: "#feece2",
            text: "#433029",
            muted: "#74564d",
            accent: "#d67c5c",
            accentSoft: "#f0c3af",
            border: "#f2d8cb",
            codeBg: "#fff2eb",
            quoteBg: "#fff4ee",
            tableHeadBg: "#fde3d7",
            tableStripeBg: "#fffaf8",
        }),
    },
    {
        id: "starlight-ledger",
        name: "Starlight Ledger",
        description: "A navy-ledger theme with cool highlights and a crisp night-sky accent.",
        css: createThemeCss({
            paper: "#f7f8fc",
            panel: "#e7e9f7",
            text: "#242846",
            muted: "#545c82",
            accent: "#5b67c8",
            accentSoft: "#c7cdf2",
            border: "#d8ddf2",
            codeBg: "#eceffa",
            quoteBg: "#eef0fb",
            tableHeadBg: "#dee3f7",
            tableStripeBg: "#f8f9fd",
        }),
    },
];

export function listProjectThemes(): ProjectTheme[] {
    return projectThemes;
}

export function getProjectThemeById(themeId: string): ProjectTheme | undefined {
    return projectThemes.find((theme) => theme.id === themeId);
}
