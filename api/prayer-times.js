import { fetchIcmMonthlyPrayerHtml } from "../src/icm-prayer-client.js";

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify(payload));
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("allow", "GET");
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  try {
    const requestUrl = new URL(req.url, `https://${req.headers.host || "localhost"}`);
    const html = await fetchIcmMonthlyPrayerHtml(requestUrl.searchParams.get("month"));
    res.statusCode = 200;
    res.setHeader("content-type", "text/html; charset=utf-8");
    res.setHeader("cache-control", "s-maxage=3600, stale-while-revalidate=86400");
    res.end(html);
  } catch (error) {
    const message = error.message || "Could not load prayer schedule.";
    const status = message.includes("Month must") ? 400 : 502;
    sendJson(res, status, { error: message });
  }
}
