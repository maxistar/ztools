import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderToString, tags, rawHtml } from "../ztools.ssr.js";

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
  script,
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

function escapeJson(data) {
  // Safe embed: escape </script> sequences inside JSON
  return JSON.stringify(data).replace(/<\/script>/gi, "<\\/script>");
}

function renderWrapperPage(example) {
  const filesJson = escapeJson(
    example.sourceFiles.map((f) => ({ path: f.path, content: f.content })),
  );

  // Inline module script: mounts an interactive file-tabs viewer using ztools
  const inlineScript = `
import { signal, tags, mount, For } from "../../ztools.js";
const { div, button, pre, code, span } = tags;

const files = JSON.parse(document.getElementById("zt-source-data").textContent);

function FileTabs() {
  const active = signal(files[0]?.path ?? "");

  return div({ className: "zt-filetabs" },
    div({ className: "zt-filetabs__bar" },
      For(
        () => files,
        (f) => button(
          {
            className: () =>
              "zt-filetabs__tab" + (active() === f.path ? " active" : ""),
            onClick: () => active.set(f.path),
          },
          f.path,
        ),
        (f) => f.path,
      ),
    ),
    div({ className: "zt-filetabs__panel" },
      pre(
        code(() => {
          const f = files.find((x) => x.path === active());
          return f ? f.content : "";
        }),
      ),
    ),
  );
}

mount(FileTabs, document.getElementById("zt-source-mount"));
`.trim();

  return shellPage(
    `${example.name} demo`,
    [
      p(a({ href: "../index.html" }, "← Back to demos")),
      h1(example.name),
      p(
        "Live preview with source files. ",
        a({ href: example.liveHref }, "Open raw demo ↗"),
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
      h2({ style: { marginTop: "40px" } }, "Source"),
      div({ id: "zt-source-mount" }),
      // data island
      script({ type: "application/json", id: "zt-source-data" }, rawHtml(filesJson)),
      // interactive tabs via ztools
      script({ type: "module" }, rawHtml(inlineScript)),
    ],
    `
      .preview-card { margin-top: 24px; }
      h2 { margin-bottom: 12px; }
      iframe { margin-top: 8px; }

      /* ── file tabs ─────────────────────────────── */
      .zt-filetabs {
        border: 1px solid #d1d5db;
        border-radius: 10px;
        overflow: hidden;
        background: #1e1e1e;
      }
      .zt-filetabs__bar {
        display: flex;
        background: #2d2d2d;
        border-bottom: 1px solid #3c3c3c;
        overflow-x: auto;
        scrollbar-width: none;
      }
      .zt-filetabs__bar::-webkit-scrollbar { display: none; }
      .zt-filetabs__tab {
        padding: 8px 18px;
        font-size: 13px;
        font-family: inherit;
        color: #aaa;
        background: none;
        border: none;
        border-bottom: 2px solid transparent;
        cursor: pointer;
        white-space: nowrap;
        transition: color .15s, border-color .15s, background .15s;
      }
      .zt-filetabs__tab:hover { color: #ddd; background: #3a3a3a; }
      .zt-filetabs__tab.active {
        color: #fff;
        border-bottom-color: #4d9aff;
        background: #1e1e1e;
      }
      .zt-filetabs__panel {
        overflow-x: auto;
      }
      .zt-filetabs__panel pre {
        margin: 0;
        padding: 20px;
        background: #1e1e1e;
        border-radius: 0;
        border: none;
        min-height: 200px;
      }
      .zt-filetabs__panel code {
        font-family: "JetBrains Mono", "Fira Code", Consolas, monospace;
        font-size: 13px;
        line-height: 1.6;
        color: #d4d4d4;
        background: none;
        white-space: pre;
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
