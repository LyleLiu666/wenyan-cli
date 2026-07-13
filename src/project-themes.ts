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

interface StructuredThemeOptions {
    paper: string;
    panel: string;
    text: string;
    muted: string;
    accent: string;
    border: string;
    codeBg: string;
    quoteBg: string;
}

function createBriefThemeCss(options: StructuredThemeOptions): string {
    return `
#wenyan {
    color: ${options.text};
    background: ${options.paper};
    max-width: 820px;
    margin: 0 auto;
    padding: 28px 34px;
    font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
    line-height: 1.72;
}

#wenyan h1 {
    margin: 0 0 2em;
    padding: 0 0 0.7em;
    border-top: 5px solid ${options.accent};
    border-bottom: 1px solid ${options.border};
    color: ${options.text};
    font-size: 2em;
    letter-spacing: 0.04em;
}

#wenyan h2 {
    margin: 1.8em 0 0.8em;
    padding: 0.35em 0.7em;
    border-left: 5px solid ${options.accent};
    background: ${options.panel};
    color: ${options.text};
    font-size: 1.25em;
}

#wenyan h2::before {
    content: "§";
    margin-right: 0.55em;
    color: ${options.accent};
    font-weight: 700;
}

#wenyan h3 {
    margin: 1.3em 0 0.55em;
    color: ${options.accent};
    font-size: 1.05em;
}

#wenyan blockquote {
    margin: 1.2em 0;
    padding: 0.8em 1em;
    border-left: 4px solid ${options.accent};
    background: ${options.quoteBg};
    color: ${options.muted};
}

#wenyan table {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid ${options.border};
    font-size: 0.94em;
}

#wenyan th,
#wenyan td {
    padding: 0.58em 0.7em;
    border: 1px solid ${options.border};
    text-align: left;
}

#wenyan th {
    background: ${options.panel};
    color: ${options.text};
}

#wenyan pre {
    margin: 1.2em 0;
    padding: 1em;
    overflow-x: auto;
    border: 1px solid ${options.border};
    border-radius: 4px;
    background: ${options.codeBg};
}

#wenyan a {
    color: ${options.accent};
    text-decoration: none;
    border-bottom: 1px solid ${options.accent};
}
`.trim();
}

function createTechnicalThemeCss(options: StructuredThemeOptions): string {
    return `
#wenyan {
    color: ${options.text};
    background: ${options.paper};
    padding: 30px;
    font-family: "SFMono-Regular", "Roboto Mono", "Menlo", monospace;
    line-height: 1.75;
}

#wenyan h1 {
    margin: 0 0 2em;
    padding: 0.8em 1em;
    border: 1px solid ${options.border};
    border-radius: 6px;
    background: ${options.panel};
    color: ${options.accent};
    font-size: 1.65em;
}

#wenyan h1::before {
    content: ">_";
    margin-right: 0.65em;
    color: ${options.accent};
}

#wenyan h2 {
    margin: 1.8em 0 0.8em;
    padding-left: 0.8em;
    border-left: 3px solid ${options.accent};
    color: ${options.text};
    font-size: 1.2em;
}

#wenyan h2::before {
    content: "//";
    margin-right: 0.55em;
    color: ${options.accent};
}

#wenyan h3 {
    color: ${options.accent};
    font-size: 1em;
}

#wenyan blockquote {
    margin: 1.2em 0;
    padding: 0.9em 1em;
    border: 1px dashed ${options.accent};
    background: ${options.quoteBg};
    color: ${options.muted};
}

#wenyan pre {
    margin: 1.2em 0;
    padding: 1.1em;
    overflow-x: auto;
    border: 1px solid ${options.border};
    border-radius: 6px;
    background: ${options.codeBg};
    box-shadow: inset 4px 0 0 ${options.accent};
}

#wenyan pre::before {
    content: "code";
    display: block;
    margin: -0.55em 0 0.65em;
    color: ${options.muted};
    font-size: 0.75em;
}

#wenyan table {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid ${options.border};
}

#wenyan th,
#wenyan td {
    padding: 0.55em 0.7em;
    border: 1px solid ${options.border};
}

#wenyan th {
    background: ${options.panel};
    color: ${options.accent};
}

#wenyan code {
    color: ${options.accent};
}
`.trim();
}

function createEditorialThemeCss(options: StructuredThemeOptions): string {
    return `
#wenyan {
    color: ${options.text};
    background: ${options.paper};
    max-width: 760px;
    margin: 0 auto;
    padding: 22px 36px;
    font-family: Georgia, "Noto Serif SC", "Songti SC", serif;
    line-height: 2;
    letter-spacing: 0.025em;
}

#wenyan h1 {
    margin: 0 0 2.2em;
    padding: 0.5em 0;
    border-top: 1px solid ${options.accent};
    border-bottom: 1px solid ${options.accent};
    color: ${options.text};
    text-align: center;
    font-size: 2em;
    letter-spacing: 0.12em;
}

#wenyan h2 {
    margin: 2em 0 0.9em;
    color: ${options.accent};
    text-align: center;
    font-size: 1.35em;
    letter-spacing: 0.08em;
}

#wenyan h2::before,
#wenyan h2::after {
    content: "—";
    margin: 0 0.65em;
    color: ${options.border};
}

#wenyan h3 {
    margin: 1.5em 0 0.6em;
    color: ${options.accent};
    font-size: 1.08em;
}

#wenyan blockquote {
    margin: 1.5em 0;
    padding: 1em 1.4em;
    border-top: 1px solid ${options.border};
    border-bottom: 1px solid ${options.border};
    background: ${options.quoteBg};
    color: ${options.muted};
    text-align: center;
}

#wenyan blockquote::before {
    content: "“";
    display: block;
    color: ${options.accent};
    font-size: 2em;
    line-height: 0.6;
}

#wenyan img {
    border-radius: 0;
    box-shadow: 0 8px 18px rgba(60, 40, 25, 0.12);
}

#wenyan table {
    width: 100%;
    border-collapse: collapse;
    border-top: 2px solid ${options.accent};
    border-bottom: 2px solid ${options.accent};
}

#wenyan th,
#wenyan td {
    padding: 0.65em 0.75em;
    border-bottom: 1px solid ${options.border};
}

#wenyan th {
    color: ${options.accent};
    font-weight: 700;
}

#wenyan pre {
    padding: 1em;
    border: 1px solid ${options.border};
    background: ${options.codeBg};
    font-family: "SFMono-Regular", "Roboto Mono", monospace;
    text-align: left;
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
    {
        id: "executive-brief",
        name: "Executive Brief",
        description: "A compact decision-brief layout for status updates, proposals, and executive summaries.",
        css: createBriefThemeCss({
            paper: "#ffffff",
            panel: "#eef4fb",
            text: "#203247",
            muted: "#52677d",
            accent: "#1769aa",
            border: "#c8d8e8",
            codeBg: "#f3f7fb",
            quoteBg: "#f0f6fc",
        }),
    },
    {
        id: "metrics-brief",
        name: "Metrics Brief",
        description: "A dense, high-signal layout for metrics, operating reviews, and data-heavy notes.",
        css: createBriefThemeCss({
            paper: "#fbfcfe",
            panel: "#f5efe2",
            text: "#2d3440",
            muted: "#6d6f73",
            accent: "#b45f06",
            border: "#dfd1b7",
            codeBg: "#f3f1ec",
            quoteBg: "#fff8ea",
        }),
    },
    {
        id: "terminal-brief",
        name: "Terminal Brief",
        description: "A dark terminal-inspired layout for release notes, runbooks, and engineering updates.",
        css: createTechnicalThemeCss({
            paper: "#0b1220",
            panel: "#111c2e",
            text: "#d9e4f2",
            muted: "#8da3bc",
            accent: "#61dafb",
            border: "#28415e",
            codeBg: "#07101c",
            quoteBg: "#101d30",
        }),
    },
    {
        id: "research-notebook",
        name: "Research Notebook",
        description: "A structured technical notebook for experiments, architecture notes, and long-form analysis.",
        css: createTechnicalThemeCss({
            paper: "#f5f7f9",
            panel: "#e8edf2",
            text: "#253746",
            muted: "#607383",
            accent: "#2f718d",
            border: "#c9d6df",
            codeBg: "#eaf1f5",
            quoteBg: "#edf5f7",
        }),
    },
    {
        id: "literary-margin",
        name: "Literary Margin",
        description: "A spacious serif layout for essays, cultural writing, and reflective long-form pieces.",
        css: createEditorialThemeCss({
            paper: "#fffdf9",
            panel: "#f7f0e5",
            text: "#3d3029",
            muted: "#756458",
            accent: "#9a4f36",
            border: "#dfcdbd",
            codeBg: "#f6efe6",
            quoteBg: "#fbf5ed",
        }),
    },
    {
        id: "newspaper-column",
        name: "Newspaper Column",
        description: "A restrained editorial layout with column-like rules for commentary and weekly notes.",
        css: createEditorialThemeCss({
            paper: "#fdfdfb",
            panel: "#f0f0eb",
            text: "#262626",
            muted: "#5e5e5a",
            accent: "#303030",
            border: "#bdbdb6",
            codeBg: "#f1f1ed",
            quoteBg: "#f7f7f2",
        }),
    },
];

export function listProjectThemes(): ProjectTheme[] {
    return projectThemes;
}

export function getProjectThemeById(themeId: string): ProjectTheme | undefined {
    return projectThemes.find((theme) => theme.id === themeId);
}
