import path from "node:path";

// 先配置运行时命名空间，再加载 core，避免画廊生成过程写入上游 wenyan-md 配置目录。
await import("../src/index.js");
const { generateThemeGallery } = await import("../src/theme-gallery.js");

const outputDir = path.resolve(process.argv[2] || "output/theme-gallery");
const result = await generateThemeGallery(outputDir);
console.log(JSON.stringify({ ok: true, ...result }));
