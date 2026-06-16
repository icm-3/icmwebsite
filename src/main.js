import {
  Coordinates,
  CalculationMethod,
  Madhab,
  PrayerTimes,
  Rounding,
} from "adhan";
import { defaultContent } from "./default-content.js";
import { initMobileNav } from "./nav.js";

const ICM_COORDS = new Coordinates(35.8111, -78.8231);
const TIME_ZONE = "America/New_York";
const prayerLabels = {
  fajr: "Fajr",
  sunrise: "Sunrise",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
};
const prayerOrder = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];
const nextPrayerOrder = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

let countdownTimer = null;

export function getIcmPrayerTimes(date) {
  const params = CalculationMethod.Karachi();
  params.madhab = Madhab.Hanafi;
  params.rounding = Rounding.Up;
  params.adjustments.sunrise = -1;
  params.adjustments.dhuhr = -2;

  return new PrayerTimes(ICM_COORDS, date, params);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function mergeContent(content) {
  return {
    ...defaultContent,
    ...content,
    hero: { ...defaultContent.hero, ...(content?.hero || {}) },
    jummah: { ...defaultContent.jummah, ...(content?.jummah || {}) },
    events: Array.isArray(content?.events) ? content.events : defaultContent.events,
    news: Array.isArray(content?.news) ? content.news : defaultContent.news,
  };
}

async function loadCmsContent() {
  try {
    const response = await fetch("/api/cms", { cache: "no-store" });
    if (!response.ok) throw new Error("CMS API unavailable");
    return mergeContent(await response.json());
  } catch {
    const local = localStorage.getItem("icm-cms-content");
    if (local) {
      try {
        return mergeContent(JSON.parse(local));
      } catch {
        return defaultContent;
      }
    }
    return defaultContent;
  }
}

function zonedDateParts(date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  };
}

function prayerDateFor(date, dayOffset = 0) {
  const parts = zonedDateParts(date);
  return new Date(parts.year, parts.month - 1, parts.day + dayOffset);
}

function formatTime(date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: TIME_ZONE,
  }).format(date);
}

function formatLongDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: TIME_ZONE,
  }).format(date);
}

function formatShortDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: TIME_ZONE,
  }).format(date);
}

function getDateBadgeParts(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) return { month: "---", day: "--" };
  const month = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: TIME_ZONE }).format(date);
  const day = new Intl.DateTimeFormat("en-US", { day: "2-digit", timeZone: TIME_ZONE }).format(date);
  return { month, day };
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}

function renderHero(content) {
  const image = document.querySelector("[data-hero-image]");
  if (!image) return;
  image.src = content.hero.image || defaultContent.hero.image;
  image.alt = content.hero.imageAlt || "";
}

function renderPrayerTimes() {
  const now = new Date();
  const todayPrayerDate = prayerDateFor(now);
  const tomorrowPrayerDate = prayerDateFor(now, 1);
  const todayTimes = getIcmPrayerTimes(todayPrayerDate);
  const tomorrowTimes = getIcmPrayerTimes(tomorrowPrayerDate);

  for (const key of prayerOrder) {
    setText(`[data-prayer-time="${key}"]`, formatTime(todayTimes[key]));
  }

  let next = nextPrayerOrder
    .map((key) => ({ key, time: todayTimes[key] }))
    .find((item) => item.time.getTime() > now.getTime());

  if (!next) {
    next = { key: "fajr", time: tomorrowTimes.fajr };
  }

  const label = prayerLabels[next.key];
  setText("[data-next-name]", label);
  setText("[data-next-time]", formatTime(next.time));

  const countdown = document.querySelector("[data-countdown]");
  if (countdown) countdown.setAttribute("aria-label", `Time remaining until ${label}`);

  document.querySelectorAll("[data-prayer-tile]").forEach((tile) => {
    tile.classList.toggle("active", tile.dataset.prayerTile === next.key);
  });

  if (countdownTimer) window.clearInterval(countdownTimer);
  const tick = () => {
    const remaining = Math.max(0, Math.ceil((next.time.getTime() - Date.now()) / 1000));
    setText("[data-countdown-hours]", String(Math.floor(remaining / 3600)).padStart(2, "0"));
    setText("[data-countdown-minutes]", String(Math.floor((remaining % 3600) / 60)).padStart(2, "0"));
    setText("[data-countdown-seconds]", String(remaining % 60).padStart(2, "0"));
    if (remaining <= 0) renderPrayerTimes();
  };

  tick();
  countdownTimer = window.setInterval(tick, 1000);
}

function renderJummah(content) {
  const label = content.jummah.dateLabel || defaultContent.jummah.dateLabel;
  setText("[data-jummah-date]", `- ${label.toUpperCase()}`);

  const tbody = document.querySelector("[data-jummah-body]");
  if (!tbody) return;
  const shifts = content.jummah.shifts?.length ? content.jummah.shifts : defaultContent.jummah.shifts;
  tbody.innerHTML = shifts
    .map(
      (shift) => `
        <tr>
          <td><span class="shift">${escapeHtml(shift.shift)}</span></td>
          <td class="time">${escapeHtml(shift.time)}</td>
          <td>${escapeHtml(shift.speaker)}</td>
          <td>${escapeHtml(shift.topic)}</td>
        </tr>
      `,
    )
    .join("");
}

function renderEvents(content) {
  const list = document.querySelector("[data-events-list]");
  if (!list) return;
  const events = content.events?.length ? content.events : defaultContent.events;
  list.innerHTML = events
    .map((event) => {
      const badge = getDateBadgeParts(event.date);
      const dateLabel = formatLongDate(event.date);
      return `
        <div class="event-item">
          <div class="date-badge"><span>${escapeHtml(badge.month)}</span><strong>${escapeHtml(badge.day)}</strong></div>
          <div>
            <h3>${escapeHtml(event.title)}</h3>
            <p>${escapeHtml(dateLabel)} &bull; ${escapeHtml(event.time)}<br>${escapeHtml(event.location)}</p>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderNews(content) {
  const list = document.querySelector("[data-news-list]");
  if (!list) return;
  const news = content.news?.length ? content.news : defaultContent.news;
  list.innerHTML = news
    .map(
      (item) => `
        <article class="news-item">
          <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.imageAlt || item.title)}">
          <div>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.summary)}</p>
          </div>
          <time datetime="${escapeHtml(item.date)}">${escapeHtml(formatShortDate(item.date))}</time>
        </article>
      `,
    )
    .join("");
}

async function boot() {
  initMobileNav();
  const content = await loadCmsContent();
  renderHero(content);
  renderPrayerTimes();
  renderJummah(content);
  renderEvents(content);
  renderNews(content);
}

boot();
