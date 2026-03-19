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
  { slug: "api", mdFile: "api.md", title: "ztools api reference", navLabel: "API" },
];

const md = new MarkdownIt({ html: false, linkify: true, typographer: true });

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
  const contentHtml = await renderMarkdownWithShiki(markdownText);
  const fullHtml = wrapPage({ title: page.title, currentSlug: page.slug, contentHtml });

  const outFile = page.slug === "index" ? "index.html" : `${page.slug}.html`;
  await writeFile(path.join(docsDir, outFile), fullHtml, "utf8");
}

console.log("Generated docs/*.html from docs-md/*.md with Shiki highlighting.");
