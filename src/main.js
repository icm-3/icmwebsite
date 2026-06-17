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
const topicIconRules = [
  { icon: "leaf", words: ["gratitude", "shukr", "blessing", "thanks", "worship", "prayer", "salah", "daily"] },
  { icon: "heart", words: ["love", "mercy", "compassion", "kindness", "service", "sincerity", "charity", "giving", "donation"] },
  { icon: "community", words: ["justice", "responsibility", "accountability", "community", "trust", "unity", "neighbors", "ummah"] },
  { icon: "feather", words: ["patience", "sabr", "change", "hardship", "steadfast", "resilience", "forgiveness", "healing"] },
  { icon: "moon", words: ["ramadan", "taraweeh", "quran", "deen", "taqwa", "faith", "spiritual", "eid", "dhul hijjah", "hajj"] },
  { icon: "spark", words: ["reflection", "reminder", "youth", "family", "knowledge", "learning", "parents", "marriage", "children"] },
];

let countdownTimer = null;
let selectedPrayerDate = new Date();

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

function nextPrayerForNow(now) {
  const todayDate = prayerDateFor(now);
  const todayTimes = getIcmPrayerTimes(todayDate);
  const next = nextPrayerOrder
    .map((key) => ({ key, time: todayTimes[key] }))
    .find((item) => item.time.getTime() > now.getTime());

  if (next) return next;

  const tomorrowTimes = getIcmPrayerTimes(prayerDateFor(now, 1));
  return { key: "fajr", time: tomorrowTimes.fajr };
}

function currentPrayerForNow(now) {
  const todayTimes = getIcmPrayerTimes(prayerDateFor(now));
  const current = nextPrayerOrder
    .map((key) => ({ key, time: todayTimes[key] }))
    .filter((item) => item.time.getTime() <= now.getTime())
    .at(-1);

  return current || { key: "isha", time: getIcmPrayerTimes(prayerDateFor(now, -1)).isha };
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

function getNewsCategory(title) {
  const normalized = title.toLowerCase();
  if (normalized.includes("ramadan") || normalized.includes("taraweeh")) return "Programs";
  if (normalized.includes("camp") || normalized.includes("youth")) return "Youth";
  return "Announcement";
}

function getTopicIcon(topic) {
  const normalized = topic.toLowerCase();
  return topicIconRules.find((rule) => rule.words.some((word) => normalized.includes(word)))?.icon || "✦";
}

function topicIconSvg(topic) {
  const icon = getTopicIcon(topic);
  const icons = {
    leaf: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19c6.6 0 11-4.4 11-11V5h-3C6.4 5 3 8.4 3 15v4h2Z"/><path d="M5 19 16 8"/></svg>`,
    heart: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.3 6.7a5 5 0 0 0-7.1 0L12 7.9l-1.2-1.2a5 5 0 1 0-7.1 7.1L12 22l8.3-8.2a5 5 0 0 0 0-7.1Z"/></svg>`,
    community: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M3 20a5 5 0 0 1 10 0"/><path d="M11 20a5 5 0 0 1 10 0"/></svg>`,
    feather: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 4c-7 0-12 5-12 12v4h4c7 0 12-5 12-12V4h-4Z"/><path d="M8 20 20 8"/><path d="M11 17H7"/><path d="M14 14h-4"/></svg>`,
    moon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 15.5A8.5 8.5 0 0 1 8.5 4a8.5 8.5 0 1 0 11.5 11.5Z"/></svg>`,
    spark: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 14.4 9.6 21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4L12 3Z"/></svg>`,
  };
  return icons[icon] || icons.spark;
}

function slugify(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}

function formatNavigatorDate(date) {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
  });
}

function getNextJummahDate(fromDate = new Date()) {
  const current = prayerDateFor(fromDate);
  const day = current.getDay();
  const daysUntilFriday = (5 - day + 7) % 7;
  current.setDate(current.getDate() + daysUntilFriday);

  if (daysUntilFriday === 0) {
    const maghrib = getIcmPrayerTimes(current).maghrib;
    if (fromDate.getTime() >= maghrib.getTime()) {
      current.setDate(current.getDate() + 7);
    }
  }

  return current;
}

function formatJummahDate(date) {
  return date
    .toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
    .toUpperCase();
}

function parseJummahDateLabel(label) {
  if (!label) return null;
  const parsed = new Date(`${label} 12:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return prayerDateFor(parsed);
}

function isSameDate(first, second) {
  return (
    first?.getFullYear() === second?.getFullYear() &&
    first?.getMonth() === second?.getMonth() &&
    first?.getDate() === second?.getDate()
  );
}

function getJummahRowsForDate(content, targetDate) {
  const shifts = content.jummah.shifts?.length ? content.jummah.shifts : defaultContent.jummah.shifts;
  const postedDate = parseJummahDateLabel(content.jummah.dateLabel || defaultContent.jummah.dateLabel);

  if (isSameDate(postedDate, targetDate)) return shifts;

  return shifts.map((shift) => ({
    ...shift,
    speaker: "TBD",
    topic: "TBD",
  }));
}

function textFitClass(value, thresholds) {
  const length = String(value ?? "").trim().length;
  if (length >= thresholds.tiny) return "fit-tiny";
  if (length >= thresholds.smaller) return "fit-smaller";
  if (length >= thresholds.small) return "fit-small";
  return "fit-normal";
}

function renderDateNavigator() {
  setText("[data-date-label]", formatNavigatorDate(selectedPrayerDate));
}

function initDateNavigator() {
  const navigator = document.querySelector(".date-navigator");
  if (!navigator) return;

  navigator.addEventListener("click", (event) => {
    const button = event.target.closest("[data-date-nav]");
    if (!button) return;

    if (button.dataset.dateNav === "today") {
      selectedPrayerDate = new Date();
    } else {
      const offset = button.dataset.dateNav === "prev" ? -1 : 1;
      selectedPrayerDate = new Date(selectedPrayerDate);
      selectedPrayerDate.setDate(selectedPrayerDate.getDate() + offset);
    }

    renderDateNavigator();
    renderPrayerTimes();
  });

  renderDateNavigator();
}

function renderHero(content) {
  const image = document.querySelector("[data-hero-image]");
  if (!image) return;
  image.src = content.hero.image || defaultContent.hero.image;
  image.alt = content.hero.imageAlt || "";
}

function renderPrayerTimes() {
  const now = new Date();
  const selectedDate = prayerDateFor(selectedPrayerDate);
  const selectedTimes = getIcmPrayerTimes(selectedDate);

  for (const key of prayerOrder) {
    setText(`[data-prayer-time="${key}"]`, formatTime(selectedTimes[key]));
  }

  const current = currentPrayerForNow(now);
  const next = nextPrayerForNow(now);
  const currentLabel = prayerLabels[current.key];
  const nextLabel = prayerLabels[next.key];
  setText("[data-next-name]", currentLabel);
  setText("[data-next-time]", formatTime(current.time));
  setText("[data-countdown-target]", nextLabel);

  const countdown = document.querySelector("[data-countdown]");
  if (countdown) countdown.setAttribute("aria-label", `Time remaining until ${nextLabel}`);

  document.querySelectorAll("[data-prayer-tile]").forEach((tile) => {
    tile.classList.toggle("active", tile.dataset.prayerTile === current.key);
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
  const targetDate = getNextJummahDate();
  setText("[data-jummah-date]", `- ${formatJummahDate(targetDate)}`);

  const tbody = document.querySelector("[data-jummah-body]");
  if (!tbody) return;
  const shifts = getJummahRowsForDate(content, targetDate);
  tbody.innerHTML = shifts
    .map(
      (shift) => {
        const speakerFit = textFitClass(shift.speaker, { small: 28, smaller: 42, tiny: 50 });
        const topicFit = textFitClass(shift.topic, { small: 42, smaller: 68, tiny: 92 });
        return `
        <tr>
          <td><span class="shift">${escapeHtml(shift.shift)}</span></td>
          <td class="time">${escapeHtml(shift.time)}</td>
          <td><span class="speaker-name ${speakerFit}">${escapeHtml(shift.speaker)}</span></td>
          <td><span class="topic-chip ${topicFit}"><span class="topic-icon">${topicIconSvg(shift.topic)}</span><span class="topic-text">${escapeHtml(shift.topic)}</span></span></td>
        </tr>
      `;
      },
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
        <a class="event-item" href="./calendar.html#event-${escapeHtml(slugify(event.title))}">
          <div class="date-badge"><span>${escapeHtml(badge.month)}</span><strong>${escapeHtml(badge.day)}</strong></div>
          <div>
            <h3>${escapeHtml(event.title)}</h3>
            <p>${escapeHtml(dateLabel)} &bull; ${escapeHtml(event.time)}<br>${escapeHtml(event.location)}</p>
          </div>
        </a>
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
        <a class="news-item" href="./news.html#news-${escapeHtml(slugify(item.title))}">
          <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.imageAlt || item.title)}">
          <div>
            <span class="news-category">${escapeHtml(getNewsCategory(item.title))}</span>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.summary)}</p>
          </div>
          <time datetime="${escapeHtml(item.date)}">${escapeHtml(formatShortDate(item.date))}</time>
        </a>
      `,
    )
    .join("");
}

async function boot() {
  initMobileNav();
  initDateNavigator();
  const content = await loadCmsContent();
  renderHero(content);
  renderPrayerTimes();
  renderJummah(content);
  renderEvents(content);
  renderNews(content);
}

boot();
