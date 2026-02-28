import { cp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const docsDir = path.join(root, "docs");
const buildDir = path.join(root, "build");
const examplesDir = path.join(buildDir, "examples");
const demoDir = path.join(root, "demo");

await rm(buildDir, { recursive: true, force: true });
await cp(docsDir, buildDir, { recursive: true });
await rm(examplesDir, { recursive: true, force: true });
await mkdir(examplesDir, { recursive: true });

// Keep runtime available for copied examples.
await cp(path.join(root, "ztools.js"), path.join(buildDir, "ztools.js"));
await cp(path.join(root, "ztools.client.js"), path.join(buildDir, "ztools.client.js"));
await cp(path.join(root, "ztools.ssr.js"), path.join(buildDir, "ztools.ssr.js"));
await rm(path.join(buildDir, "src"), { recursive: true, force: true });
await cp(path.join(root, "src"), path.join(buildDir, "src"), { recursive: true });

// Copy all demos into docs/examples
await cp(demoDir, examplesDir, { recursive: true });

const entries = await readdir(demoDir, { withFileTypes: true });
const demos = entries
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .sort();

const links = demos
  .map((name) => `<li><a href="./${name}/index.html">${name}</a></li>`)
  .join("\n");

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ztools examples</title>
  <style>
    body { font-family: Inter, system-ui, Arial, sans-serif; max-width: 900px; margin: 40px auto; padding: 0 16px; }
    a { color: #0b57d0; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>ztools examples</h1>
  <p><a href="../index.html">← Back to docs</a></p>
  <ul>
    ${links}
  </ul>
</body>
</html>`;

await writeFile(path.join(examplesDir, "index.html"), html, "utf8");
console.log(`Built pages content in ./build with examples: ${demos.join(", ")}`);
