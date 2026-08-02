import { readFile } from "node:fs/promises";

const cmsFile = new URL("../data/cms.json", import.meta.url);

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const content = JSON.parse(await readFile(cmsFile, "utf8"));
    response.setHeader("Cache-Control", "no-store");
    response.status(200).json(content);
  } catch {
    response.status(500).json({ error: "CMS content is unavailable" });
  }
}
