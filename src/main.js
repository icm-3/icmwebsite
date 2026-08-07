import {
  Coordinates,
  CalculationMethod,
  Madhab,
  PrayerTimes,
  Rounding,
} from "adhan";
import { defaultContent } from "./default-content.js";
import {
  newsCategory,
  normalizeNewsItems,
  sortNewsEntries,
} from "./content-utils.js";
import { getResponsiveMedia } from "./media.js";
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
const nextPrayerOrder = prayerOrder;
const HOME_EVENT_LIMIT = 6;
const HOME_NEWS_LIMIT = 4;
const topicIconRules = [
  { icon: "leaf", words: ["gratitude", "shukr", "blessing", "thanks", "worship", "ibadah", "prayer", "salah", "daily", "green", "environment", "deen", "stewardship", "earth", "creation", "sustainability", "nature", "cleanliness", "purity"] },
  { icon: "heart", words: ["love", "mercy", "rahma", "compassion", "kindness", "service", "sincerity", "ikhlas", "charity", "giving", "donation", "zakat", "sadaqah", "muhasaba", "self reflection", "forgiveness", "healing", "care"] },
  { icon: "community", words: ["justice", "responsibility", "accountability", "community", "trust", "amanah", "unity", "neighbors", "ummah", "family", "parents", "children", "marriage", "brotherhood", "sisterhood", "society", "rights", "service"] },
  { icon: "feather", words: ["patience", "sabr", "change", "hardship", "steadfast", "resilience", "forgiveness", "healing", "trials", "tests", "hope", "courage", "character", "akhlaq", "manners", "humility"] },
  { icon: "moon", words: ["ramadan", "taraweeh", "quran", "taqwa", "faith", "iman", "spiritual", "eid", "dhul hijjah", "hajj", "umrah", "ghaflah", "heedlessness", "night", "dua", "dhikr", "akhirah", "jannah", "repentance", "tawbah"] },
  { icon: "spark", words: ["reflection", "reminder", "youth", "knowledge", "learning", "ilm", "education", "wisdom", "seerah", "sunnah", "hadith", "ostentation", "riya", "intention", "niyyah", "growth", "leadership"] },
];

let countdownTimer = null;
let selectedPrayerDate = new Date();
let selectedDatePickerMonth = new Date(selectedPrayerDate.getFullYear(), selectedPrayerDate.getMonth(), 1);
let prayerDateTracksToday = true;
const datePickerCloseTimers = new WeakMap();
const prayerActivationAnimations = new WeakMap();
const prayerActivationTimers = new WeakMap();
const reducedMotionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
let prayerClockOffset = null;

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

function responsiveImageMarkup(source, alt, { className = "", sizes = "100vw" } = {}) {
  const media = getResponsiveMedia(source);
  const classAttribute = className ? ` class="${escapeHtml(className)}"` : "";
  const srcsetAttribute = media.srcset ? ` srcset="${escapeHtml(media.srcset)}" sizes="${escapeHtml(sizes)}"` : "";
  const dimensionAttributes = media.width && media.height ? ` width="${media.width}" height="${media.height}"` : "";
  return `<img${classAttribute} src="${escapeHtml(media.src)}"${srcsetAttribute}${dimensionAttributes} alt="${escapeHtml(alt)}" loading="lazy" decoding="async" data-load-reveal data-load-state="pending">`;
}

function mergeContent(content) {
  return {
    ...defaultContent,
    ...content,
    hero: { ...defaultContent.hero, ...(content?.hero || {}) },
    jummah: { ...defaultContent.jummah, ...(content?.jummah || {}) },
    events: Array.isArray(content?.events) ? content.events : defaultContent.events,
    news: normalizeNewsItems(content?.news, defaultContent.news),
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

function currentPrayerPeriodForNow(now) {
  const todayTimes = getIcmPrayerTimes(prayerDateFor(now));
  const current = prayerOrder
    .map((key) => ({ key, time: todayTimes[key] }))
    .filter((item) => item.time.getTime() <= now.getTime())
    .at(-1);

  return current || { key: "isha", time: getIcmPrayerTimes(prayerDateFor(now, -1)).isha };
}

function getPrayerClockOffset() {
  if (prayerClockOffset !== null) return prayerClockOffset;
  prayerClockOffset = 0;

  const params = new URLSearchParams(window.location.search);
  const testTransition = params.get("testTransition")?.toLowerCase();
  const testTime = params.get("testTime");
  const testPrayer = params.get("testPrayer")?.toLowerCase();
  const now = new Date();
  const transitionSeconds = Math.min(Math.max(Number(params.get("transitionSeconds")) || 10, 4), 60);

  if (testTransition === "sunrise-dhuhr") {
    const times = getIcmPrayerTimes(prayerDateFor(now));
    const simulated = new Date(times.dhuhr.getTime() - transitionSeconds * 1000);
    prayerClockOffset = simulated.getTime() - now.getTime();
    return prayerClockOffset;
  }

  if (/^\d{1,2}:\d{2}$/.test(testTime || "")) {
    const [hours, minutes] = testTime.split(":").map(Number);
    const simulated = new Date(now);
    simulated.setHours(hours, minutes, 0, 0);
    prayerClockOffset = simulated.getTime() - now.getTime();
    return prayerClockOffset;
  }

  if (prayerOrder.includes(testPrayer)) {
    const times = getIcmPrayerTimes(prayerDateFor(now));
    const simulated = new Date(times[testPrayer].getTime() + 60 * 1000);
    prayerClockOffset = simulated.getTime() - now.getTime();
  }

  return prayerClockOffset;
}

function getPrayerNow() {
  return new Date(Date.now() + getPrayerClockOffset());
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

function dateValue(dateString, hour = 12, minute = 0) {
  const date = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) return 0;
  date.setHours(hour, minute, 0, 0);
  return date.getTime();
}

function parseTimeParts(timeString) {
  const match = String(timeString || "")
    .trim()
    .match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === "PM" && hour < 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  return { hour, minute };
}

function eventStartValue(event) {
  const time = parseTimeParts(event.time);
  return dateValue(event.date, time?.hour ?? 0, time?.minute ?? 0) || Number.MAX_SAFE_INTEGER;
}

function eventEndValue(event) {
  const endTime = parseTimeParts(event.endTime);
  if (event.endDate || endTime) {
    return dateValue(event.endDate || event.date, endTime?.hour ?? 23, endTime?.minute ?? 59) || Number.MAX_SAFE_INTEGER;
  }

  const time = parseTimeParts(event.time);
  if (time) return dateValue(event.date, time.hour, time.minute) || Number.MAX_SAFE_INTEGER;

  const endOfDay = new Date(`${event.date}T12:00:00`);
  if (Number.isNaN(endOfDay.getTime())) return Number.MAX_SAFE_INTEGER;
  endOfDay.setDate(endOfDay.getDate() + 1);
  endOfDay.setHours(0, 0, 0, 0);
  return endOfDay.getTime();
}

function eventTitle(event) {
  return String(event.title || "Community Event");
}

function eventSlug(event, index = 0) {
  return slugify([eventTitle(event), event.date, event.time, index].filter(Boolean).join("-")) || `event-${index}`;
}

function eventPoster(event) {
  return event.poster || event.image || "";
}

function eventPosterAlt(event) {
  return event.posterAlt || event.imageAlt || `${eventTitle(event)} event poster`;
}

function eventDateTimeLabel(event) {
  return [formatLongDate(event.date), event.time].filter(Boolean).join(" • ");
}

function newsTitle(item, index = 0) {
  return String(item.title || item.imageAlt || `Announcement ${index + 1}`);
}

function newsSlug(item, index = 0) {
  if (item.id) return slugify(item.id);
  return slugify([newsTitle(item, index), item.date, index].filter(Boolean).join("-")) || `announcement-${index}`;
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

function prefersReducedMotion() {
  return reducedMotionPreference.matches;
}

function finishLoadingRegion(target) {
  if (!target) return;
  target.removeAttribute("aria-busy");
  target.classList.remove("skeleton-region");
  target.closest(".info-card")?.classList.remove("is-loading");

  if (prefersReducedMotion() || document.hidden || typeof target.animate !== "function") return;
  target.animate(
    [{ opacity: 0.74 }, { opacity: 1 }],
    { duration: 160, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
  );
}

function setAnimatedText(selector, value) {
  const element = document.querySelector(selector);
  if (!element || element.textContent === value) return;
  element.textContent = value;
  element.classList.remove("is-changing");
  void element.offsetWidth;
  element.classList.add("is-changing");
}

function prayerTransitionDirection(previousKey, nextKey) {
  if (previousKey === "isha" && nextKey === "fajr") return 1;
  if (previousKey === "fajr" && nextKey === "isha") return -1;
  return prayerOrder.indexOf(nextKey) >= prayerOrder.indexOf(previousKey) ? 1 : -1;
}

function animatePrayerActivation(tile, direction) {
  prayerActivationAnimations.get(tile)?.forEach((animation) => animation.cancel());
  window.clearTimeout(prayerActivationTimers.get(tile));
  tile.classList.remove("is-activating");

  if (document.hidden || typeof tile.animate !== "function") return;

  const reducedMotion = prefersReducedMotion();
  const animations = [
    tile.animate(
      reducedMotion
        ? [{ opacity: 0.7 }, { opacity: 1 }]
        : [
            {
              opacity: 0.72,
              transform: `translateX(${direction * 12}px) translateY(1px) scale(0.97)`,
            },
            { opacity: 1, transform: "translateX(0) translateY(-1px) scale(1)" },
          ],
      {
        duration: reducedMotion ? 160 : 250,
        easing: "cubic-bezier(0.23, 1, 0.32, 1)",
      },
    ),
  ];

  const icon = tile.querySelector("img");
  if (!reducedMotion && icon) {
    animations.push(
      icon.animate(
        [
          { opacity: 0.72, transform: `translateX(${direction * 10}px) scale(0.94)` },
          { opacity: 1, transform: "translateX(0) scale(1)" },
        ],
        {
          delay: 30,
          duration: 200,
          easing: "cubic-bezier(0.23, 1, 0.32, 1)",
        },
      ),
    );
  }

  prayerActivationAnimations.set(tile, animations);
  let unfinishedAnimations = animations.length;
  const forgetAnimations = () => {
    unfinishedAnimations -= 1;
    if (unfinishedAnimations === 0 && prayerActivationAnimations.get(tile) === animations) {
      prayerActivationAnimations.delete(tile);
    }
  };
  animations.forEach((animation) => {
    animation.addEventListener("finish", forgetAnimations, { once: true });
    animation.addEventListener("cancel", forgetAnimations, { once: true });
  });

  if (!reducedMotion) {
    requestAnimationFrame(() => {
      if (!tile.classList.contains("active")) return;
      tile.classList.add("is-activating");
      const timer = window.setTimeout(() => {
        tile.classList.remove("is-activating");
        prayerActivationTimers.delete(tile);
      }, 250);
      prayerActivationTimers.set(tile, timer);
    });
  }
}

function revealActivePrayerTile(carousel, tile, { smooth = false } = {}) {
  requestAnimationFrame(() => {
    if (!carousel.isConnected || !tile.isConnected || carousel.scrollWidth <= carousel.clientWidth) return;

    const carouselRect = carousel.getBoundingClientRect();
    const tileRect = tile.getBoundingClientRect();
    const centeredLeft = carousel.scrollLeft
      + tileRect.left
      - carouselRect.left
      - (carouselRect.width - tileRect.width) / 2;
    const maximumLeft = carousel.scrollWidth - carousel.clientWidth;

    carousel.scrollTo({
      left: Math.min(Math.max(centeredLeft, 0), maximumLeft),
      behavior: smooth && !prefersReducedMotion() ? "smooth" : "auto",
    });
  });
}

function formatNavigatorDate(date) {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
  });
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatPickerMonth(date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function ensureDatePicker(navigator) {
  let picker = navigator.querySelector("[data-prayer-date-picker]");
  if (picker) return picker;

  picker = document.createElement("div");
  picker.className = "date-picker-popover";
  picker.id = "prayer-date-picker";
  picker.dataset.prayerDatePicker = "";
  picker.setAttribute("role", "dialog");
  picker.setAttribute("aria-label", "Choose prayer date");
  picker.hidden = true;
  navigator.append(picker);

  const trigger = navigator.querySelector(".date-nav-main");
  trigger?.setAttribute("aria-haspopup", "dialog");
  trigger?.setAttribute("aria-controls", picker.id);
  trigger?.setAttribute("aria-expanded", "false");
  return picker;
}

function setDatePickerExpanded(picker, isExpanded) {
  picker.closest(".date-navigator")
    ?.querySelector(".date-nav-main")
    ?.setAttribute("aria-expanded", String(isExpanded));
}

function showDatePicker(picker) {
  window.clearTimeout(datePickerCloseTimers.get(picker));
  picker.dataset.openIntent = "true";
  picker.hidden = false;
  picker.classList.remove("is-closing");
  setDatePickerExpanded(picker, true);
  requestAnimationFrame(() => {
    if (picker.dataset.openIntent === "true") picker.classList.add("is-open");
  });
}

function hideDatePicker(picker) {
  if (picker.hidden) return;
  window.clearTimeout(datePickerCloseTimers.get(picker));
  picker.dataset.openIntent = "false";
  picker.classList.remove("is-open");
  picker.classList.add("is-closing");
  setDatePickerExpanded(picker, false);
  const timer = window.setTimeout(() => {
    if (picker.dataset.openIntent !== "true") {
      picker.hidden = true;
      picker.classList.remove("is-closing");
    }
  }, 190);
  datePickerCloseTimers.set(picker, timer);
}

function toggleDatePicker(picker) {
  if (picker.dataset.openIntent !== "true") {
    showDatePicker(picker);
  } else {
    hideDatePicker(picker);
  }
}

function renderDatePicker(navigator) {
  const picker = ensureDatePicker(navigator);
  const monthStart = new Date(selectedDatePickerMonth.getFullYear(), selectedDatePickerMonth.getMonth(), 1);
  const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
  const visibleDayCount = Math.ceil((monthStart.getDay() + daysInMonth) / 7) * 7;
  const firstGridDate = new Date(monthStart);
  firstGridDate.setDate(firstGridDate.getDate() - firstGridDate.getDay());
  const todayKey = dateKey(prayerDateFor(new Date()));
  const selectedKey = dateKey(prayerDateFor(selectedPrayerDate));
  const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  picker.innerHTML = `
    <div class="date-picker-toolbar">
      <button type="button" data-date-picker-month="prev" aria-label="Previous month">
        <img src="/public/icons/chevron-left.svg" alt="" aria-hidden="true">
      </button>
      <strong>${escapeHtml(formatPickerMonth(monthStart))}</strong>
      <button type="button" data-date-picker-month="next" aria-label="Next month">
        <img src="/public/icons/chevron-right.svg" alt="" aria-hidden="true">
      </button>
    </div>
    <div class="date-picker-weekdays">${weekdays.map((day) => `<span>${day}</span>`).join("")}</div>
    <div class="date-picker-grid">
      ${Array.from({ length: visibleDayCount }, (_, index) => {
        const date = new Date(firstGridDate);
        date.setDate(firstGridDate.getDate() + index);
        const key = dateKey(date);
        return `
          <button
            type="button"
            class="${date.getMonth() !== monthStart.getMonth() ? "is-muted" : ""}${key === todayKey ? " is-today" : ""}${key === selectedKey ? " is-selected" : ""}"
            data-date-picker-day="${escapeHtml(key)}"
            aria-label="${escapeHtml(formatNavigatorDate(date))}"
            aria-pressed="${key === selectedKey}"
            ${key === todayKey ? 'aria-current="date"' : ""}
          >${date.getDate()}</button>
        `;
      }).join("")}
    </div>
    <div class="date-picker-actions">
      <button type="button" data-date-picker-today>Today</button>
    </div>
  `;
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

  return shifts;
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
  const navigator = document.querySelector(".date-navigator");
  if (navigator) renderDatePicker(navigator);
}

function initDateNavigator() {
  const navigator = document.querySelector(".date-navigator");
  if (!navigator) return;
  const mainButton = navigator.querySelector(".date-nav-main");
  renderDatePicker(navigator);

  let monthPointerHandled = false;
  const handleNavigatorAction = (event) => {
    const monthButton = event.target.closest("[data-date-picker-month]");
    if (monthButton) {
      event.preventDefault();
      event.stopPropagation();
      if (event.type === "click" && monthPointerHandled) {
        monthPointerHandled = false;
        return;
      }
      if (event.type === "pointerdown") monthPointerHandled = true;
      selectedDatePickerMonth = new Date(selectedDatePickerMonth);
      selectedDatePickerMonth.setMonth(selectedDatePickerMonth.getMonth() + (monthButton.dataset.datePickerMonth === "next" ? 1 : -1));
      renderDatePicker(navigator);
      showDatePicker(ensureDatePicker(navigator));
      return;
    }

    const dayButton = event.target.closest("[data-date-picker-day]");
    if (dayButton) {
      event.stopPropagation();
      selectedPrayerDate = prayerDateFor(new Date(`${dayButton.dataset.datePickerDay}T12:00:00`));
      selectedDatePickerMonth = new Date(selectedPrayerDate.getFullYear(), selectedPrayerDate.getMonth(), 1);
      prayerDateTracksToday = isSameDate(selectedPrayerDate, prayerDateFor(new Date()));
      hideDatePicker(ensureDatePicker(navigator));
      mainButton?.focus({ preventScroll: true });
      renderDateNavigator();
      renderPrayerTimes();
      return;
    }

    if (event.target.closest("[data-date-picker-today]")) {
      event.stopPropagation();
      selectedPrayerDate = new Date();
      selectedDatePickerMonth = new Date(selectedPrayerDate.getFullYear(), selectedPrayerDate.getMonth(), 1);
      prayerDateTracksToday = true;
      hideDatePicker(ensureDatePicker(navigator));
      mainButton?.focus({ preventScroll: true });
      renderDateNavigator();
      renderPrayerTimes();
      return;
    }

    if (event.target.closest(".date-nav-main")) {
      const picker = ensureDatePicker(navigator);
      selectedDatePickerMonth = new Date(selectedPrayerDate.getFullYear(), selectedPrayerDate.getMonth(), 1);
      renderDatePicker(navigator);
      toggleDatePicker(picker);
      return;
    }

    const button = event.target.closest("[data-date-nav]");
    if (!button) return;

    if (button.dataset.dateNav === "today") {
      selectedPrayerDate = new Date();
      selectedDatePickerMonth = new Date(selectedPrayerDate.getFullYear(), selectedPrayerDate.getMonth(), 1);
      prayerDateTracksToday = true;
    } else {
      const offset = button.dataset.dateNav === "prev" ? -1 : 1;
      selectedPrayerDate = new Date(selectedPrayerDate);
      selectedPrayerDate.setDate(selectedPrayerDate.getDate() + offset);
      selectedDatePickerMonth = new Date(selectedPrayerDate.getFullYear(), selectedPrayerDate.getMonth(), 1);
      prayerDateTracksToday = false;
    }

    hideDatePicker(ensureDatePicker(navigator));
    renderDateNavigator();
    renderPrayerTimes();
  };

  navigator.addEventListener("pointerdown", (event) => {
    if (!event.target.closest("[data-date-picker-month]")) return;
    handleNavigatorAction(event);
  });

  navigator.addEventListener("click", handleNavigatorAction);

  document.addEventListener("click", (event) => {
    if (navigator.contains(event.target) || mainButton?.contains(event.target)) return;
    hideDatePicker(ensureDatePicker(navigator));
  });

  navigator.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const picker = ensureDatePicker(navigator);
    if (picker.hidden) return;
    event.preventDefault();
    hideDatePicker(picker);
    mainButton?.focus({ preventScroll: true });
  });

  renderDateNavigator();
}

function renderHero(content) {
  const image = document.querySelector("[data-hero-image]");
  if (!image) return;
  const source = document.querySelector("[data-hero-source]");
  const heroImage = content.hero.image || defaultContent.hero.image;
  const usesDefaultHero = /\/masjid-interior-hero-clean\.png(?:[?#].*)?$/.test(heroImage);

  if (source) {
    if (usesDefaultHero) {
      source.srcset = "./public/images/responsive/masjid-interior-hero-20260806-640.webp 640w, ./public/images/responsive/masjid-interior-hero-20260806-960.webp 960w, ./public/images/responsive/masjid-interior-hero-20260806-1536.webp 1536w";
      source.sizes = "(max-width: 820px) 100vw, 62vw";
    } else {
      source.removeAttribute("srcset");
      source.removeAttribute("sizes");
    }
  }

  image.src = heroImage;
  image.alt = content.hero.imageAlt || "";
}

function renderPrayerTimes() {
  const now = getPrayerNow();
  if (prayerDateTracksToday) {
    selectedPrayerDate = now;
    renderDateNavigator();
  }
  const selectedDate = prayerDateFor(selectedPrayerDate);
  const selectedTimes = getIcmPrayerTimes(selectedDate);

  for (const key of prayerOrder) {
    setText(`[data-prayer-time="${key}"]`, formatTime(selectedTimes[key]));
  }

  const current = currentPrayerPeriodForNow(now);
  const next = nextPrayerForNow(now);
  const currentLabel = prayerLabels[current.key];
  const nextLabel = prayerLabels[next.key];
  setText(".next-label span", current.key === "sunrise" ? "Current Period" : "Current Prayer");
  setText("[data-next-name]", currentLabel);
  setText("[data-next-time]", formatTime(current.time));
  setText("[data-countdown-target]", nextLabel);

  const countdown = document.querySelector("[data-countdown]");
  if (countdown) countdown.setAttribute("aria-label", `Time remaining until ${nextLabel}`);

  const prayerCarousel = document.querySelector(".prayer-carousel");
  const previousPrayerKey = prayerCarousel
    ?.querySelector("[data-prayer-tile].active")
    ?.getAttribute("data-prayer-tile");
  let activePrayerTile = null;
  document.querySelectorAll("[data-prayer-tile]").forEach((tile) => {
    const isCurrent = tile.dataset.prayerTile === current.key;
    tile.classList.toggle("active", isCurrent);
    if (isCurrent) {
      activePrayerTile = tile;
      tile.setAttribute("aria-current", "time");
    } else tile.removeAttribute("aria-current");
  });
  if (
    prayerCarousel?.hasAttribute("data-prayer-ready")
    && previousPrayerKey
    && previousPrayerKey !== current.key
    && activePrayerTile
  ) {
    animatePrayerActivation(
      activePrayerTile,
      prayerTransitionDirection(previousPrayerKey, current.key),
    );
    revealActivePrayerTile(prayerCarousel, activePrayerTile, { smooth: true });
  }
  if (prayerCarousel && !prayerCarousel.hasAttribute("data-prayer-ready")) {
    requestAnimationFrame(() => {
      prayerCarousel.setAttribute("data-prayer-ready", "");
      if (activePrayerTile) revealActivePrayerTile(prayerCarousel, activePrayerTile);
    });
  }

  if (countdownTimer) window.clearInterval(countdownTimer);
  const tick = () => {
    const remaining = Math.max(0, Math.ceil((next.time.getTime() - getPrayerNow().getTime()) / 1000));
    setAnimatedText("[data-countdown-hours]", String(Math.floor(remaining / 3600)).padStart(2, "0"));
    setAnimatedText("[data-countdown-minutes]", String(Math.floor((remaining % 3600) / 60)).padStart(2, "0"));
    setAnimatedText("[data-countdown-seconds]", String(remaining % 60).padStart(2, "0"));
    if (remaining <= 0) renderPrayerTimes();
  };

  tick();
  countdownTimer = window.setInterval(tick, 1000);
}

function renderJummah(content) {
  const targetDate = getNextJummahDate();
  const postedDate = parseJummahDateLabel(content.jummah.dateLabel || defaultContent.jummah.dateLabel);
  setText("[data-jummah-date]", formatJummahDate(postedDate || targetDate));

  const tbody = document.querySelector("[data-jummah-body]");
  if (!tbody) return;
  const shifts = getJummahRowsForDate(content, targetDate);
  tbody.innerHTML = shifts
    .map(
      (shift) => {
        const speakerFit = textFitClass(shift.speaker, { small: 28, smaller: 42, tiny: 50 });
        const topicFit = textFitClass(shift.topic, { small: 42, smaller: 68, tiny: 92 });
        const isTbdTopic = shift.topic.trim().toLowerCase() === "tbd";
        const topicIcon = isTbdTopic ? "" : `<span class="topic-icon">${topicIconSvg(shift.topic)}</span>`;
        return `
        <tr>
          <td><span class="shift">${escapeHtml(shift.shift)}</span></td>
          <td class="time">${escapeHtml(shift.time)}</td>
          <td><span class="speaker-name ${speakerFit}">${escapeHtml(shift.speaker)}</span></td>
          <td><span class="topic-chip ${topicFit}${isTbdTopic ? " is-tbd" : ""}">${topicIcon}<span class="topic-text">${escapeHtml(shift.topic)}</span></span></td>
        </tr>
      `;
      },
    )
    .join("");
  finishLoadingRegion(tbody);
}

function renderEvents(content) {
  const list = document.querySelector("[data-events-list]");
  if (!list) return;
  const now = Date.now();
  const sourceEvents = (content.events?.length ? content.events : defaultContent.events).map((event, originalIndex) => ({ event, originalIndex }));
  const upcomingEvents = sourceEvents
    .filter(({ event }) => eventEndValue(event) > now)
    .sort((first, second) => eventStartValue(first.event) - eventStartValue(second.event));
  const pastEvents = sourceEvents
    .filter(({ event }) => eventEndValue(event) <= now)
    .sort((first, second) => eventEndValue(second.event) - eventEndValue(first.event));
  const events = [...upcomingEvents, ...pastEvents].slice(0, HOME_EVENT_LIMIT);
  const firstPastDisplayIndex = events.findIndex(({ event }) => eventEndValue(event) <= now);
  list.classList.toggle("has-past-divider-in-preview", firstPastDisplayIndex >= 0 && firstPastDisplayIndex < 3);
  list.innerHTML = events
    .map(({ event, originalIndex }, displayIndex) => {
      const eventDate = formatLongDate(event.date);
      const isPast = eventEndValue(event) <= now;
      const poster = eventPoster(event);
      const pastDivider = displayIndex === firstPastDisplayIndex
        ? `<div class="event-group-divider" data-group="past">Recently Passed</div>`
        : "";
      return `
        ${pastDivider}
        <a class="event-item${isPast ? " is-past" : ""}${displayIndex > 2 ? " is-scroll-extra" : ""}" href="./calendar.html#event-${escapeHtml(eventSlug(event, originalIndex))}">
          ${poster ? responsiveImageMarkup(poster, eventPosterAlt(event), { className: "event-thumb", sizes: "110px" }) : ""}
          <div class="event-item-body">
            <h3>${escapeHtml(eventTitle(event))}</h3>
            ${eventDate || event.time || event.location ? `<p>${eventDate ? `<span class="event-date-line">${escapeHtml(eventDate)}</span>` : ""}${event.time ? `<span class="event-time-line">${escapeHtml(event.time)}</span>` : ""}${event.location ? `<span class="event-location">${escapeHtml(event.location)}</span>` : ""}</p>` : ""}
          </div>
        </a>
      `;
    })
    .join("");
  finishLoadingRegion(list);
  markCardImageShapes(list, ".event-item", ".event-thumb");
}

function renderNews(content) {
  const list = document.querySelector("[data-news-list]");
  if (!list) return;
  const news = sortNewsEntries(
    normalizeNewsItems(content.news, defaultContent.news)
      .map((item, originalIndex) => ({ item, originalIndex })),
    dateValue,
  ).slice(0, HOME_NEWS_LIMIT);
  list.innerHTML = news
    .map(
      ({ item, originalIndex }) => `
        <a class="news-item${newsTitle(item, originalIndex).length <= 42 ? " news-item--short-title" : ""}" href="./news.html#news-${escapeHtml(newsSlug(item, originalIndex))}">
          ${responsiveImageMarkup(item.image, item.imageAlt || newsTitle(item, originalIndex), { sizes: "120px" })}
          <span class="news-category">${escapeHtml(newsCategory(item))}</span>
          <div class="news-item-body">
            ${item.date ? `<time datetime="${escapeHtml(item.date)}">${escapeHtml(formatShortDate(item.date))}</time>` : ""}
            ${item.title ? `<h3>${escapeHtml(item.title)}</h3>` : ""}
            ${item.summary ? `<p>${escapeHtml(item.summary)}</p>` : ""}
          </div>
        </a>
      `,
    )
    .join("");
  finishLoadingRegion(list);
  markCardImageShapes(list, ".news-item", "img");
}

function markCardImageShapes(root, cardSelector, imageSelector) {
  root.querySelectorAll(imageSelector).forEach((image) => {
    const revealImage = (state = "loaded") => {
      image.dataset.loadState = state;
    };
    const applyShape = () => {
      const card = image.closest(cardSelector);
      if (!card || !image.naturalWidth || !image.naturalHeight) return;
      const isPortrait = image.naturalHeight / image.naturalWidth > 1.08;
      card.classList.toggle("is-portrait-media", isPortrait);
      card.classList.toggle("is-wide-media", !isPortrait);
    };
    const onSettled = () => {
      revealImage();
      applyShape();
    };
    if (image.complete) {
      queueMicrotask(() => {
        if (image.naturalWidth) onSettled();
        else revealImage("error");
      });
    }
    else {
      image.addEventListener("load", onSettled, { once: true });
      image.addEventListener("error", () => revealImage("error"), { once: true });
    }
  });
}

async function boot() {
  initMobileNav();
  initDateNavigator();
  renderPrayerTimes();
  const content = await loadCmsContent();
  renderHero(content);
  renderJummah(content);
  renderEvents(content);
  renderNews(content);
}

boot();
