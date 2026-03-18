import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderToString, tags } from "../ztools.ssr.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const docsDir = path.join(root, "docs");
const buildDir = path.join(root, "build");
const examplesDir = path.join(buildDir, "examples");
const demoPagesDir = path.join(buildDir, "demo");
const demoDir = path.join(root, "demo");
const runtimeFiles = ["ztools.js", "ztools.client.js", "ztools.ssr.js"];
const sourceOrder = [".js", ".mjs", ".html", ".css"];

const {
  html,
  head,
  body,
  meta,
  title,
  style,
  h1,
  h2,
  h3,
  p,
  a,
  ul,
  li,
  div,
  pre,
  code,
  iframe,
} = tags;

function shellPage(pageTitle, content, extraStyles = "") {
  return html(
    { lang: "en" },
    head(
      meta({ charset: "UTF-8" }),
      meta({ name: "viewport", content: "width=device-width, initial-scale=1.0" }),
      title(pageTitle),
      style(
        `
          body {
            font-family: Inter, system-ui, Arial, sans-serif;
            max-width: 1100px;
            margin: 40px auto;
            padding: 0 16px 48px;
            line-height: 1.6;
            color: #111827;
          }
          a { color: #0b57d0; text-decoration: none; }
          a:hover { text-decoration: underline; }
          code, pre { background: #f6f8fa; border-radius: 8px; }
          code { padding: 2px 6px; }
          pre {
            padding: 16px;
            overflow-x: auto;
            border: 1px solid #e5e7eb;
          }
          ${extraStyles}
        `,
      ),
    ),
    body(content),
  );
}

function renderDocument(page) {
  return `<!doctype html>\n${renderToString(page)}\n`;
}

async function listExampleNames() {
  const entries = await readdir(demoDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

async function collectFiles(dir, relativeBase = "") {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const absPath = path.join(dir, entry.name);
    const relPath = path.join(relativeBase, entry.name);

    if (entry.isDirectory()) {
      files.push(...await collectFiles(absPath, relPath));
      continue;
    }

    files.push(relPath);
  }

  return files;
}

function sourcePriority(relPath) {
  const baseName = path.basename(relPath).toLowerCase();
  const ext = path.extname(relPath).toLowerCase();

  const extIndex = sourceOrder.indexOf(ext);
  if (extIndex !== -1) return [extIndex + 1, relPath];

  return [sourceOrder.length + 1, relPath];
}

async function getExampleMetadata(name) {
  const sourceDir = path.join(demoDir, name);
  const files = await collectFiles(sourceDir);
  const orderedFiles = files.sort((left, right) => {
    const [leftPriority, leftName] = sourcePriority(left);
    const [rightPriority, rightName] = sourcePriority(right);

    if (leftPriority !== rightPriority) return leftPriority - rightPriority;
    return leftName.localeCompare(rightName);
  });

  const sourceFiles = await Promise.all(
    orderedFiles.map(async (relPath) => ({
      path: relPath,
      content: await readFile(path.join(sourceDir, relPath), "utf8"),
    })),
  );

  return {
    name,
    liveHref: `../../examples/${name}/`,
    wrapperHref: `./${name}/`,
    sourceFiles,
  };
}

async function writePage(filePath, page) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, renderDocument(page), "utf8");
}

function renderWrapperPage(example) {
  return shellPage(
    `${example.name} demo`,
    [
      p(a({ href: "../index.html" }, "← Back to demos")),
      h1(example.name),
      p(
        "This page wraps the live example and shows the source files used to build it. ",
        a({ href: example.liveHref }, "Open the raw live demo"),
      ),
      div(
        { className: "preview-card" },
        h2("Preview"),
        iframe({
          src: example.liveHref,
          title: `${example.name} live demo`,
          loading: "lazy",
          style: {
            width: "100%",
            minHeight: "520px",
            border: "1px solid #d1d5db",
            borderRadius: "12px",
            background: "#fff",
          },
        }),
      ),
      div(
        { className: "source-list" },
        h2("Source"),
        ...example.sourceFiles.map((file) =>
          div(
            { className: "source-card" },
            h3(file.path),
            pre(code(file.content)),
          ),
        ),
      ),
    ],
    `
      .preview-card,
      .source-card {
        margin-top: 24px;
      }
      .source-list {
        margin-top: 32px;
      }
      h3 {
        margin-bottom: 10px;
        font-size: 16px;
      }
      iframe {
        margin-top: 8px;
      }
    `,
  );
}

function renderIndexPage({
  pageTitle,
  heading,
  backHref,
  backLabel,
  intro,
  examples,
  hrefFor,
}) {
  return shellPage(
    pageTitle,
    [
      p(a({ href: backHref }, backLabel)),
      h1(heading),
      p(intro),
      ul(...examples.map((example) => li(a({ href: hrefFor(example.name) }, example.name)))),
    ],
  );
}

await rm(buildDir, { recursive: true, force: true });
await cp(docsDir, buildDir, { recursive: true });
await rm(examplesDir, { recursive: true, force: true });
await rm(demoPagesDir, { recursive: true, force: true });
await mkdir(examplesDir, { recursive: true });
await mkdir(demoPagesDir, { recursive: true });

for (const file of runtimeFiles) {
  await cp(path.join(root, file), path.join(buildDir, file));
}

await rm(path.join(buildDir, "src"), { recursive: true, force: true });
await cp(path.join(root, "src"), path.join(buildDir, "src"), {
  recursive: true,
});

await cp(demoDir, examplesDir, { recursive: true });

const demoNames = await listExampleNames();
const examples = await Promise.all(demoNames.map((name) => getExampleMetadata(name)));

await writePage(
  path.join(demoPagesDir, "index.html"),
  renderIndexPage({
    pageTitle: "ztools demos",
    heading: "ztools demos",
    backHref: "../index.html",
    backLabel: "← Back to docs",
    intro: "Interactive wrappers for the published examples, with source files included below each preview.",
    examples,
    hrefFor: (name) => `./${name}/`,
  }),
);

await writePage(
  path.join(examplesDir, "index.html"),
  renderIndexPage({
    pageTitle: "ztools examples",
    heading: "ztools examples",
    backHref: "../index.html",
    backLabel: "← Back to docs",
    intro: "Live example routes are still available here, but the primary example entry points now live under /demo/.",
    examples,
    hrefFor: (name) => `../demo/${name}/`,
  }),
);

for (const example of examples) {
  await writePage(
    path.join(demoPagesDir, example.name, "index.html"),
    renderWrapperPage(example),
  );
}

console.log(
  `Built pages content in ./build with demos: ${demoNames.join(", ")}`,
);
