import { cp, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = resolve(process.cwd());
const mappings = [
  [resolve(root, "src", "manifest.json"), resolve(root, "dist", "manifest.json")],
];

for (const [from, to] of mappings) {
  await mkdir(dirname(to), { recursive: true });
  await cp(from, to);
}

console.log("[build] extension static assets copied to dist");
