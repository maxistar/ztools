import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import MarkdownIt from "markdown-it";
import { codeToHtml } from "shiki";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const docsMdDir = path.join(root, "docs-md");
const docsDir = path.join(root, "docs");

const pages = [
  { slug: "index", mdFile: "index.md", title: "ztools docs", navLabel: "Docs Home" },
  { slug: "philosophy", mdFile: "philosophy.md", title: "ztools philosophy", navLabel: "Philosophy" },
  { slug: "getting-started", mdFile: "getting-started.md", title: "ztools getting started", navLabel: "Getting Started" },
  { slug: "api", mdFile: "api.md", title: "ztools api", navLabel: "API" },

  // API subpages (file-name based)
  { slug: "core.js", mdFile: "core.js.md", title: "ztools core.js", navLabel: "core.js" },
  { slug: "dom.js", mdFile: "dom.js.md", title: "ztools dom.js", navLabel: "dom.js" },
  { slug: "enhance.js", mdFile: "enhance.js.md", title: "ztools enhance.js", navLabel: "enhance.js" },
  { slug: "ssr.js", mdFile: "ssr.js.md", title: "ztools ssr.js", navLabel: "ssr.js" },
  { slug: "wc.js", mdFile: "wc.js.md", title: "ztools wc.js", navLabel: "wc.js" },
  { slug: "css.js", mdFile: "css.js.md", title: "ztools css.js", navLabel: "css.js" },
  { slug: "ztools.js", mdFile: "ztools.js.md", title: "ztools ztools.js", navLabel: "ztools.js" },
  { slug: "ztools.client.js", mdFile: "ztools.client.js.md", title: "ztools ztools.client.js", navLabel: "ztools.client.js" },
  { slug: "ztools.ssr.js", mdFile: "ztools.ssr.js.md", title: "ztools ztools.ssr.js", navLabel: "ztools.ssr.js" },
];

const md = new MarkdownIt({ html: false, linkify: true, typographer: true });

const apiSourceBySlug = {
  "core.js": "src/core.js",
  "dom.js": "src/dom.js",
  "enhance.js": "src/enhance.js",
  "ssr.js": "src/ssr.js",
  "wc.js": "src/wc.js",
  "css.js": "src/css.js",
  "ztools.js": "ztools.js",
  "ztools.client.js": "ztools.client.js",
  "ztools.ssr.js": "ztools.ssr.js",
};

function navLink(currentSlug, slug, label) {
  const href = slug === "index" ? "./index.html" : `./${slug}.html`;
  if (slug === currentSlug) return `<a href="${href}"><strong>${label}</strong></a>`;
  return `<a href="${href}">${label}</a>`;
}

function wrapPage({ title, currentSlug, contentHtml }) {
  const nav = [
    navLink(currentSlug, "index", "Docs Home"),
    navLink(currentSlug, "philosophy", "Philosophy"),
    navLink(currentSlug, "getting-started", "Getting Started"),
    navLink(currentSlug, "api", "API"),
    '<a href="./demo/">Examples</a>',
  ].join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <link rel="stylesheet" href="./styles/docs.css" />
</head>
<body>
  <nav class="nav">${nav}</nav>
  ${contentHtml}
</body>
</html>
`;
}

function isPublicExportName(name) {
  return !!name && !name.startsWith("_");
}

function collectExports(source) {
  const names = new Set();
  const signatures = new Map();
  const reExportAll = [];

  for (const m of source.matchAll(/export\s+function\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)/g)) {
    const name = m[1];
    if (!isPublicExportName(name)) continue;
    names.add(name);
    signatures.set(name, `${name}(${m[2].trim()})`);
  }

  for (const m of source.matchAll(/export\s+class\s+([A-Za-z_$][\w$]*)\b/g)) {
    const name = m[1];
    if (!isPublicExportName(name)) continue;
    names.add(name);
    signatures.set(name, `${name} (class)`);
  }

  for (const m of source.matchAll(/export\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*\(([^)]*)\)\s*=>/g)) {
    const name = m[1];
    if (!isPublicExportName(name)) continue;
    names.add(name);
    signatures.set(name, `${name}(${m[2].trim()})`);
  }

  for (const m of source.matchAll(/export\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)\b/g)) {
    const name = m[1];
    if (!isPublicExportName(name)) continue;
    names.add(name);
    if (!signatures.has(name)) signatures.set(name, name);
  }

  for (const m of source.matchAll(/export\s*\{([^}]+)\}/g)) {
    const parts = m[1].split(",").map((s) => s.trim()).filter(Boolean);
    for (const p of parts) {
      const asMatch = p.match(/^([A-Za-z_$][\w$]*)\s+as\s+([A-Za-z_$][\w$]*)$/);
      const exported = asMatch ? asMatch[2] : p;
      if (!isPublicExportName(exported)) continue;
      names.add(exported);
      if (!signatures.has(exported)) signatures.set(exported, exported);
    }
  }

  for (const m of source.matchAll(/export\s+\*\s+from\s+["']([^"']+)["']/g)) {
    reExportAll.push(m[1]);
  }

  const ordered = [...names].sort((a, b) => a.localeCompare(b));

  return {
    names: ordered,
    signatures: ordered.map((name) => signatures.get(name) || name),
    reExportAll,
  };
}

async function prependAutoExportsSection(page, markdownText) {
  const relSource = apiSourceBySlug[page.slug];
  if (!relSource) return markdownText;

  const sourcePath = path.join(root, relSource);
  let source;

  try {
    source = await readFile(sourcePath, "utf8");
  } catch {
    return markdownText;
  }

  const { signatures, reExportAll } = collectExports(source);
  const lines = [];
  lines.push("## Exports (auto)");
  lines.push("");

  if (signatures.length === 0 && reExportAll.length === 0) {
    lines.push("- No named exports detected");
  } else {
    for (const sig of signatures) lines.push(`- \`${sig}\``);
    for (const mod of reExportAll) lines.push(`- Re-export all from \`${mod}\``);
  }

  lines.push("");

  return markdownText.replace(/^#\s+.*\n/, (m) => `${m}\n${lines.join("\n")}\n`);
}

async function renderMarkdownWithShiki(markdownText) {
  const codeBlocks = [];
  const tokenized = markdownText.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const id = codeBlocks.length;
    codeBlocks.push({ lang: lang || "text", code });
    return `@@CODEBLOCK_${id}@@`;
  });

  let html = md.render(tokenized);

  for (let i = 0; i < codeBlocks.length; i++) {
    const token = `@@CODEBLOCK_${i}@@`;
    const { lang, code } = codeBlocks[i];
    const highlighted = await codeToHtml(code, { lang, theme: "github-dark" });

    html = html.replace(`<p>${token}</p>`, highlighted);
    html = html.replace(token, highlighted);
  }

  return html;
}

await mkdir(docsDir, { recursive: true });

for (const page of pages) {
  const mdPath = path.join(docsMdDir, page.mdFile);
  const markdownText = await readFile(mdPath, "utf8");
  const enrichedMarkdown = await prependAutoExportsSection(page, markdownText);
  const contentHtml = await renderMarkdownWithShiki(enrichedMarkdown);
  const fullHtml = wrapPage({ title: page.title, currentSlug: page.slug, contentHtml });

  const outFile = page.slug === "index" ? "index.html" : `${page.slug}.html`;
  await writeFile(path.join(docsDir, outFile), fullHtml, "utf8");
}

console.log("Generated docs/*.html from docs-md/*.md with Shiki highlighting.");
