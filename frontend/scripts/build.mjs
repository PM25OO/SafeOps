import { build } from "esbuild";
import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(process.cwd());
const distDir = resolve(root, "dist");

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });

await build({
  entryPoints: [resolve(root, "src", "service-worker.ts")],
  bundle: true,
  format: "esm",
  platform: "browser",
  target: ["chrome114"],
  outfile: resolve(distDir, "service-worker.js"),
  sourcemap: false,
  logLevel: "info",
});

await build({
  entryPoints: [resolve(root, "src", "content-script.ts")],
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["chrome114"],
  outfile: resolve(distDir, "content-script.js"),
  sourcemap: false,
  logLevel: "info",
});

await cp(resolve(root, "src", "manifest.json"), resolve(distDir, "manifest.json"));

console.log("[build] extension bundle generated at dist/");
