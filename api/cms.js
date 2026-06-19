import { readFile } from "node:fs/promises";
import path from "node:path";

const CMS_FILE = path.join(process.cwd(), "data", "cms.json");

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const content = await readFile(CMS_FILE, "utf8");
      res.setHeader("cache-control", "no-store");
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.status(200).send(content);
    } catch {
      res.status(404).json({ error: "CMS content has not been created yet." });
    }
    return;
  }

  if (req.method === "PUT") {
    res.status(501).json({
      error: "CMS saving needs a persistent backend before it can be enabled on Vercel.",
    });
    return;
  }

  res.setHeader("allow", "GET, PUT");
  res.status(405).json({ error: "Method not allowed." });
}
