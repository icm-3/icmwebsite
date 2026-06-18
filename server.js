import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 4173);
const DATA_DIR = path.join(__dirname, "data");
const CMS_FILE = path.join(DATA_DIR, "cms.json");
const MAX_BODY_BYTES = 2_500_000;
const ICM_PRAYER_ENDPOINT = "https://www.icmnc.org/wp-admin/admin-ajax.php";

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
  [".ico", "image/x-icon"],
]);

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(body);
}

function sendHtml(res, status, body) {
  res.writeHead(status, {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(body);
}

function safeStaticPath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const relative = decoded === "/" ? "index.html" : decoded.replace(/^[/\\]+/, "");
  const normalized = path.normalize(relative).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(__dirname, normalized);
  return filePath.startsWith(__dirname) ? filePath : null;
}

async function readRequestBody(req) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > MAX_BODY_BYTES) {
      throw new Error("Request body is too large.");
    }
  }
  return body;
}

async function handleApi(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (req.url === "/api/cms" && req.method === "GET") {
    try {
      const content = await readFile(CMS_FILE, "utf8");
      res.writeHead(200, {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      });
      res.end(content);
    } catch {
      sendJson(res, 404, { error: "CMS content has not been created yet." });
    }
    return true;
  }

  if (req.url === "/api/cms" && req.method === "PUT") {
    try {
      const raw = await readRequestBody(req);
      const parsed = JSON.parse(raw);
      await mkdir(DATA_DIR, { recursive: true });
      await writeFile(CMS_FILE, JSON.stringify(parsed, null, 2) + "\n", "utf8");
      sendJson(res, 200, { ok: true });
    } catch (error) {
      sendJson(res, 400, { error: error.message || "Could not save CMS content." });
    }
    return true;
  }

  if (requestUrl.pathname === "/api/prayer-times" && req.method === "GET") {
    try {
      const month = Number(requestUrl.searchParams.get("month") || new Date().getMonth() + 1);
      if (!Number.isInteger(month) || month < 1 || month > 13) {
        sendJson(res, 400, { error: "Month must be between 1 and 13." });
        return true;
      }

      const body = new URLSearchParams({
        action: "get_monthly_timetable",
        month: String(month),
      });
      const response = await fetch(ICM_PRAYER_ENDPOINT, {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
        body,
      });
      if (!response.ok) throw new Error(`ICM schedule request failed with ${response.status}`);
      sendHtml(res, 200, await response.text());
    } catch (error) {
      sendJson(res, 502, { error: error.message || "Could not load prayer schedule." });
    }
    return true;
  }

  return false;
}

async function serveStatic(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  let filePath = safeStaticPath(requestUrl.pathname);

  if (!filePath) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  if (requestUrl.pathname === "/admin") {
    filePath = path.join(__dirname, "admin.html");
  }

  const ext = path.extname(filePath).toLowerCase();
  const type = mimeTypes.get(ext) || "application/octet-stream";

  try {
    const body = await readFile(filePath);
    res.writeHead(200, {
      "content-type": type,
      "cache-control": [".html", ".css", ".js", ".json"].includes(ext) ? "no-store" : "public, max-age=60",
    });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}

const server = createServer(async (req, res) => {
  if (req.url?.startsWith("/api/") && (await handleApi(req, res))) {
    return;
  }
  await serveStatic(req, res);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`ICM site running at http://127.0.0.1:${PORT}/`);
  console.log(`CMS editor running at http://127.0.0.1:${PORT}/admin.html`);
});
