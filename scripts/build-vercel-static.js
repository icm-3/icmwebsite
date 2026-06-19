import { cp, mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

const entries = await readdir(root, { withFileTypes: true });
for (const entry of entries) {
  if (!entry.isFile()) continue;
  if (entry.name.endsWith(".html") || entry.name === "styles.css") {
    await cp(path.join(root, entry.name), path.join(dist, entry.name));
  }
}

await cp(path.join(root, "public"), path.join(dist, "public"), { recursive: true });
