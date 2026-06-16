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
const prayerOrder = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];
const prayerLabels = {
  fajr: "Fajr",
  sunrise: "Sunrise",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
};
let selectedPrayerDate = new Date();

const fallbackNews = [
  {
    title: "Community Programs Continue Through Summer",
    date: "2026-06-10",
    summary: "ICM continues to host learning, service, and family programs for the Morrisville community.",
    image: "./public/news/ramadan.png",
    imageAlt: "Mosque at sunset",
  },
  {
    title: "Volunteer Opportunities Available",
    date: "2026-06-05",
    summary: "Community members can support events, education programs, and social services through volunteer work.",
    image: "./public/news/camp.png",
    imageAlt: "Youth program activity",
  },
  {
    title: "Friday Prayer Updates",
    date: "2026-05-29",
    summary: "Please review Jumu'ah shift times and arrive early to help keep parking and entry smooth.",
    image: "./public/news/eid.png",
    imageAlt: "Masjid evening scene",
  },
];

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
    return defaultContent;
  }
}

function getIcmPrayerTimes(date) {
  const params = CalculationMethod.Karachi();
  params.madhab = Madhab.Hanafi;
  params.rounding = Rounding.Up;
  params.adjustments.sunrise = -1;
  params.adjustments.dhuhr = -2;
  return new PrayerTimes(ICM_COORDS, date, params);
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

function prayerDateFor(date) {
  const parts = zonedDateParts(date);
  return new Date(parts.year, parts.month - 1, parts.day);
}

function formatNavigatorDate(date) {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
  });
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
  return {
    month: new Intl.DateTimeFormat("en-US", { month: "short", timeZone: TIME_ZONE }).format(date),
    day: new Intl.DateTimeFormat("en-US", { day: "2-digit", timeZone: TIME_ZONE }).format(date),
  };
}

function renderPrayerTable() {
  const target = document.querySelector("[data-page-prayers]");
  if (!target) return;
  const times = getIcmPrayerTimes(prayerDateFor(selectedPrayerDate));
  target.innerHTML = prayerOrder
    .map(
      (key) => `
        <div class="schedule-row">
          <span>${prayerLabels[key]}</span>
          <strong>${formatTime(times[key])}</strong>
        </div>
      `,
    )
    .join("");
}

function renderDateNavigator() {
  const label = document.querySelector("[data-page-date-navigator] [data-date-label]");
  if (label) label.textContent = formatNavigatorDate(selectedPrayerDate);
}

function initDateNavigator() {
  const navigator = document.querySelector("[data-page-date-navigator]");
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
    renderPrayerTable();
  });

  renderDateNavigator();
}

function renderEvents(content) {
  const target = document.querySelector("[data-page-events]");
  if (!target) return;
  target.innerHTML = content.events
    .map((event) => {
      const badge = getDateBadgeParts(event.date);
      return `
        <article class="listing-item">
          <div class="date-badge"><span>${escapeHtml(badge.month)}</span><strong>${escapeHtml(badge.day)}</strong></div>
          <div>
            <h3>${escapeHtml(event.title)}</h3>
            <p>${escapeHtml(formatLongDate(event.date))} &bull; ${escapeHtml(event.time)}</p>
            <p>${escapeHtml(event.location)}</p>
            <p>${escapeHtml(event.description)}</p>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderJummah(content) {
  const target = document.querySelector("[data-page-jummah]");
  if (!target) return;
  target.innerHTML = content.jummah.shifts
    .map(
      (shift) => `
        <div class="schedule-row">
          <span>${escapeHtml(shift.time)} - ${escapeHtml(shift.speaker)}</span>
          <strong>${escapeHtml(shift.topic)}</strong>
        </div>
      `,
    )
    .join("");
}

function renderNews(content) {
  const target = document.querySelector("[data-page-news]");
  if (!target) return;
  const items = [...content.news, ...fallbackNews].slice(0, Math.max(6, content.news.length));
  target.innerHTML = items
    .map(
      (item) => `
        <article class="news-feature">
          <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.imageAlt || item.title)}">
          <div>
            <time datetime="${escapeHtml(item.date)}">${escapeHtml(formatShortDate(item.date))}</time>
            <h2>${escapeHtml(item.title)}</h2>
            <p>${escapeHtml(item.summary)}</p>
          </div>
        </article>
      `,
    )
    .join("");
}

async function boot() {
  initMobileNav();
  const content = await loadCmsContent();
  initDateNavigator();
  renderPrayerTable();
  renderEvents(content);
  renderJummah(content);
  renderNews(content);
}

boot();
