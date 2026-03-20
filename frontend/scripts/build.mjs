import { build } from "esbuild";
import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(process.cwd());
const distDir = resolve(root, "dist");

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });

const entryBundles = [
  { input: "service-worker.ts", output: "service-worker.js", format: "esm" },
  { input: "content-script.ts", output: "content-script.js", format: "iife" },
  { input: "popup.ts", output: "popup.js", format: "iife" },
  { input: "options.ts", output: "options.js", format: "iife" },
  { input: "sidepanel.ts", output: "sidepanel.js", format: "iife" },
  { input: "audit.ts", output: "audit.js", format: "iife" },
];

for (const bundle of entryBundles) {
  await build({
    entryPoints: [resolve(root, "src", bundle.input)],
    bundle: true,
    format: bundle.format,
    platform: "browser",
    target: ["chrome114"],
    outfile: resolve(distDir, bundle.output),
    sourcemap: false,
    logLevel: "info",
  });
}

const staticFiles = ["manifest.json", "popup.html", "options.html", "sidepanel.html", "audit.html", "ui.css"];

for (const file of staticFiles) {
  await cp(resolve(root, "src", file), resolve(distDir, file));
}

console.log("[build] extension bundle generated at dist/");
