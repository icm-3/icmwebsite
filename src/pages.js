import {
  Coordinates,
  CalculationMethod,
  Madhab,
  PrayerTimes,
  Rounding,
} from "adhan";
import { defaultContent } from "./default-content.js";
import { calendarDesktopEdgeFixture, calendarPositionFixtures } from "./calendar-test-fixtures.js";
import {
  newsCategory,
  normalizeNewsItems,
  sortNewsEntries,
} from "./content-utils.js";
import { getResponsiveMedia } from "./media.js";
import { initMobileNav } from "./nav.js";

const ICM_COORDS = new Coordinates(35.8111, -78.8231);
const TIME_ZONE = "America/New_York";
const prayerOrder = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];
const calendarSearchParams = new URLSearchParams(window.location.search);
const calendarFixtureName = calendarSearchParams.get("calendarTest") || calendarSearchParams.get("calendarFixture") || "";
const calendarFixture =
  calendarPositionFixtures[calendarFixtureName] ||
  (calendarFixtureName === "desktop-edges" ? calendarDesktopEdgeFixture : null);
const requestedCalendarToday = calendarSearchParams.get("calendarToday") || "";
let calendarTodayOverride = /^\d{4}-\d{2}-\d{2}$/.test(requestedCalendarToday)
  ? requestedCalendarToday
  : calendarFixture?.today || "";
const prayerLabels = {
  fajr: "Fajr",
  sunrise: "Sunrise",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
};
let selectedPrayerDate = new Date();
let selectedCalendarMonth = calendarDateFromKey(calendarFixture?.month) || getCalendarOverrideDate() || new Date();
let selectedCalendarEventSlug = "";
let expandedCalendarDateKey = "";
const stateEntryAnimations = new WeakMap();
const motionEaseOut = "cubic-bezier(0.23, 1, 0.32, 1)";

function motionSafeBehavior(behavior = "smooth") {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : behavior;
}

function animateStateEntry(element, { opacity = 0.7, translateX = 0, translateY = 0 } = {}) {
  if (!element) return;
  stateEntryAnimations.get(element)?.cancel();
  if (document.hidden || typeof element.animate !== "function") return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const animation = element.animate(
    reducedMotion
      ? [{ opacity: Math.max(opacity, 0.72) }, { opacity: 1 }]
      : [
          { opacity, transform: `translate(${translateX}px, ${translateY}px)` },
          { opacity: 1, transform: "translate(0, 0)" },
        ],
    {
      duration: reducedMotion ? 160 : 180,
      easing: motionEaseOut,
    },
  );

  stateEntryAnimations.set(element, animation);
  const forgetAnimation = () => {
    if (stateEntryAnimations.get(element) === animation) stateEntryAnimations.delete(element);
  };
  animation.addEventListener("finish", forgetAnimation, { once: true });
  animation.addEventListener("cancel", forgetAnimation, { once: true });
}

function revealLoadedRegion(element) {
  if (!element) return;
  element.removeAttribute("aria-busy");
  element.classList.remove("is-skeleton", "skeleton-region");

  if (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
    || document.hidden
    || typeof element.animate !== "function"
  ) return;

  animateStateEntry(element, { opacity: 0.74 });
}

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

function responsiveImageMarkup(source, alt, { className = "", sizes = "100vw" } = {}) {
  const media = getResponsiveMedia(source);
  const classAttribute = className ? ` class="${escapeHtml(className)}"` : "";
  const srcsetAttribute = media.srcset ? ` srcset="${escapeHtml(media.srcset)}" sizes="${escapeHtml(sizes)}"` : "";
  const dimensionAttributes = media.width && media.height ? ` width="${media.width}" height="${media.height}"` : "";
  return `<img${classAttribute} src="${escapeHtml(media.src)}"${srcsetAttribute}${dimensionAttributes} alt="${escapeHtml(alt)}" loading="lazy" decoding="async" data-load-reveal data-load-state="pending">`;
}

function prepareDeferredImages(root) {
  root.querySelectorAll("img[data-load-reveal]").forEach((image) => {
    const revealImage = (state = "loaded") => {
      image.dataset.loadState = state;
    };
    if (image.complete) queueMicrotask(() => revealImage(image.naturalWidth ? "loaded" : "error"));
    else {
      image.addEventListener("load", revealImage, { once: true });
      image.addEventListener("error", () => revealImage("error"), { once: true });
    }
  });
}

function mergeContent(content) {
  const merged = {
    ...defaultContent,
    ...content,
    calendar: { ...defaultContent.calendar, ...(content?.calendar || {}) },
    jummah: { ...defaultContent.jummah, ...(content?.jummah || {}) },
    events: Array.isArray(content?.events) ? content.events : defaultContent.events,
    news: normalizeNewsItems(content?.news, defaultContent.news),
  };

  return calendarFixture
    ? { ...merged, events: calendarFixture.events }
    : merged;
}

async function loadCmsContent() {
  try {
    const response = await fetch("/api/cms", { cache: "no-store" });
    if (!response.ok) throw new Error("CMS API unavailable");
    return mergeContent(await response.json());
  } catch {
    return mergeContent(defaultContent);
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

function formatMonthTitle(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: TIME_ZONE,
  }).format(date);
}

function formatHijriMonth(date) {
  const parts = new Intl.DateTimeFormat("en-US-u-ca-islamic", {
    month: "long",
    year: "numeric",
    timeZone: TIME_ZONE,
  }).formatToParts(date);
  const month = parts.find((part) => part.type === "month")?.value;
  const year = parts.find((part) => part.type === "year")?.value;
  return month && year ? `${month}, ${year} Hijri` : "";
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

function dateValue(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function getDateBadgeParts(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) return { month: "---", day: "--" };
  return {
    month: new Intl.DateTimeFormat("en-US", { month: "short", timeZone: TIME_ZONE }).format(date),
    day: new Intl.DateTimeFormat("en-US", { day: "2-digit", timeZone: TIME_ZONE }).format(date),
  };
}

function getEventDate(event) {
  const date = new Date(`${event.date}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
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

function eventLink(event) {
  return event.link || event.url || event.registrationUrl || "";
}

function eventDateTimeLabel(event) {
  return [formatLongDate(event.date), event.time].filter(Boolean).join(" • ");
}

function eventDateLabel(event) {
  return formatLongDate(event.date);
}

function eventTimeLabel(event) {
  return event.time || "";
}

function eventSlugFromHash() {
  const rawHash = window.location.hash.replace(/^#/, "");
  return rawHash.startsWith("event-") ? rawHash.slice(6) : "";
}

function newsTitle(item, index = 0) {
  return String(item.title || item.imageAlt || `Announcement ${index + 1}`);
}

function newsSlug(item, index = 0) {
  if (item.id) return slugify(item.id);
  return slugify([newsTitle(item, index), item.date, index].filter(Boolean).join("-")) || `announcement-${index}`;
}

function slugify(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function renderDeferredSkeletons() {
  const newsTarget = document.querySelector("[data-page-news]");
  if (newsTarget) {
    newsTarget.classList.add("is-skeleton", "skeleton-region");
    newsTarget.setAttribute("aria-busy", "true");
    newsTarget.setAttribute("aria-label", "News and announcements");

    if (window.location.hash.startsWith("#news-")) {
      newsTarget.innerHTML = `
        <article class="news-detail news-detail-skeleton" aria-hidden="true">
          <span class="skeleton-block skeleton-back"></span>
          <div class="news-detail-body">
            <span class="skeleton-block skeleton-chip"></span>
            <span class="skeleton-block skeleton-date"></span>
            <span class="skeleton-block skeleton-line skeleton-line-title"></span>
            <span class="skeleton-block skeleton-line skeleton-line-title-short"></span>
            <span class="skeleton-block skeleton-line"></span>
            <span class="skeleton-block skeleton-line skeleton-line-medium"></span>
          </div>
          <div class="skeleton-block news-detail-skeleton-poster"></div>
        </article>
      `;
    } else {
      newsTarget.innerHTML = Array.from({ length: 4 }, () => `
        <article class="news-feature news-feature-skeleton" aria-hidden="true">
          <div class="skeleton-block news-feature-skeleton-media"></div>
          <span class="skeleton-block skeleton-chip"></span>
          <div>
            <span class="skeleton-block skeleton-date"></span>
            <span class="skeleton-block skeleton-line skeleton-line-title"></span>
            <span class="skeleton-block skeleton-line skeleton-line-medium"></span>
            <span class="skeleton-block skeleton-line"></span>
          </div>
        </article>
      `).join("");
    }
  }

  const calendarGrid = document.querySelector("[data-calendar-grid]");
  if (!calendarGrid) return;

  const monthStart = new Date(selectedCalendarMonth.getFullYear(), selectedCalendarMonth.getMonth(), 1);
  const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
  const visibleDayCount = Math.ceil((monthStart.getDay() + daysInMonth) / 7) * 7;
  const title = document.querySelector("[data-calendar-title]");
  const hijri = document.querySelector("[data-calendar-hijri]");
  if (title) title.textContent = formatMonthTitle(monthStart);
  if (hijri) hijri.textContent = formatHijriMonth(monthStart);

  calendarGrid.classList.add("is-skeleton", "skeleton-region");
  calendarGrid.setAttribute("aria-busy", "true");
  calendarGrid.setAttribute("aria-label", "Event calendar");
  calendarGrid.innerHTML = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    .map((day) => `<div class="calendar-weekday" aria-hidden="true">${day}</div>`)
    .join("")
    + Array.from({ length: visibleDayCount }, (_, index) => `
      <div class="calendar-day calendar-day-skeleton" aria-hidden="true">
        <span class="skeleton-block calendar-skeleton-date"></span>
        <div class="calendar-skeleton-copy">
          <span class="skeleton-block skeleton-line skeleton-line-medium"></span>
          <span class="skeleton-block skeleton-line"></span>
        </div>
      </div>
    `).join("");
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
    .map((event, index) => {
      const badge = getDateBadgeParts(event.date);
      const meta = eventDateTimeLabel(event);
      return `
        <article class="listing-item" id="event-${escapeHtml(eventSlug(event, index))}">
          <div class="date-badge"><span>${escapeHtml(badge.month)}</span><strong>${escapeHtml(badge.day)}</strong></div>
          <div>
            <h3>${escapeHtml(eventTitle(event))}</h3>
            ${meta ? `<p>${escapeHtml(meta)}</p>` : ""}
            ${event.location ? `<p>${escapeHtml(event.location)}</p>` : ""}
            ${event.description ? `<p>${escapeHtml(event.description)}</p>` : ""}
            ${eventLink(event) ? `<a class="calendar-detail-link" href="${escapeHtml(eventLink(event))}" target="_blank" rel="noopener">Open Link</a>` : ""}
          </div>
        </article>
      `;
    })
    .join("");
}

function eventMatchesDate(event, date) {
  const eventDate = getEventDate(event);
  return (
    eventDate &&
    eventDate.getFullYear() === date.getFullYear() &&
    eventDate.getMonth() === date.getMonth() &&
    eventDate.getDate() === date.getDate()
  );
}

function calendarDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function calendarDateFromKey(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getCalendarOverrideDate() {
  return calendarDateFromKey(calendarTodayOverride);
}

function getCalendarTodayDate() {
  return getCalendarOverrideDate() || prayerDateFor(new Date());
}

function scrollToCalendarDetail(behavior = "smooth") {
  requestAnimationFrame(() => {
    const detail = document.querySelector("[data-calendar-detail]");
    if (!detail) return;
    const headerOffset = document.querySelector(".site-header")?.offsetHeight || 0;
    const top = Math.max(0, detail.getBoundingClientRect().top + window.scrollY - headerOffset - 18);
    window.scrollTo({ top, behavior: motionSafeBehavior(behavior) });
  });
}

function setCalendarDetail(event, index = 0) {
  const target = document.querySelector("[data-calendar-detail]");
  if (!target) return;

  if (!event) {
    target.innerHTML = `
      <div class="calendar-detail-empty">
        <h3>Select an event</h3>
        <p>Choose an event from the calendar to view details.</p>
      </div>
    `;
    return;
  }

  const poster = eventPoster(event);
  const eventDate = formatLongDate(event.date);
  target.innerHTML = `
    <article class="calendar-detail-card" id="event-${escapeHtml(eventSlug(event, index))}" data-calendar-detail-card>
      <div class="calendar-detail-body">
        <span class="calendar-detail-eyebrow">Event Details</span>
        <h3>${escapeHtml(eventTitle(event))}</h3>
        ${
          eventDate || event.time || event.location
            ? `<div class="calendar-detail-meta">
                ${eventDate ? `<time datetime="${escapeHtml(event.date || "")}"><b>Date</b><span>${escapeHtml(eventDate)}</span></time>` : ""}
                ${event.time ? `<span class="calendar-detail-time"><b>Time</b><span>${escapeHtml(event.time)}</span></span>` : ""}
                ${event.location ? `<span class="calendar-detail-location"><b>Location</b><span>${escapeHtml(event.location)}</span></span>` : ""}
              </div>`
            : ""
        }
        ${event.description ? `<p class="calendar-detail-description">${escapeHtml(event.description)}</p>` : ""}
        ${eventLink(event) ? `<a class="calendar-detail-link" href="${escapeHtml(eventLink(event))}" target="_blank" rel="noopener">Register</a>` : ""}
      </div>
      ${
        poster
          ? `<figure class="calendar-detail-poster">${responsiveImageMarkup(poster, eventPosterAlt(event), { sizes: "(max-width: 768px) calc(100vw - 48px), 960px" })}</figure>`
          : ""
      }
    </article>
  `;
  prepareDeferredImages(target);
}

function renderCalendar(content, { monthDirection = 0 } = {}) {
  const grid = document.querySelector("[data-calendar-grid]");
  if (!grid) return;
  const wasSkeleton = grid.classList.contains("is-skeleton");

  const title = document.querySelector("[data-calendar-title]");
  const hijri = document.querySelector("[data-calendar-hijri]");
  const monthStart = new Date(selectedCalendarMonth.getFullYear(), selectedCalendarMonth.getMonth(), 1);
  const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
  const visibleDayCount = Math.ceil((monthStart.getDay() + daysInMonth) / 7) * 7;
  const firstGridDate = new Date(monthStart);
  firstGridDate.setDate(firstGridDate.getDate() - firstGridDate.getDay());
  const monthEvents = content.events.filter((event) => {
    const eventDate = getEventDate(event);
    return eventDate && eventDate.getFullYear() === monthStart.getFullYear() && eventDate.getMonth() === monthStart.getMonth();
  });

  if (title) title.textContent = formatMonthTitle(monthStart);
  if (hijri) hijri.textContent = formatHijriMonth(selectedCalendarMonth);

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const todayDate = getCalendarTodayDate();
  const cells = Array.from({ length: visibleDayCount }, (_, index) => {
    const date = new Date(firstGridDate);
    date.setDate(firstGridDate.getDate() + index);
    const dateKey = calendarDateKey(date);
    const dateEvents = content.events.filter((event) => eventMatchesDate(event, date));
    const isExpandedDate = expandedCalendarDateKey === dateKey;
    const visibleEvents = isExpandedDate ? dateEvents : dateEvents.slice(0, 2);
    const hiddenEvents = isExpandedDate ? [] : dateEvents.slice(2);
    const hasSelectedEvent = dateEvents.some(
      (event) => eventSlug(event, content.events.indexOf(event)) === selectedCalendarEventSlug,
    );
    const isOutside = date.getMonth() !== monthStart.getMonth();
    const isToday =
      todayDate.getFullYear() === date.getFullYear() &&
      todayDate.getMonth() === date.getMonth() &&
      todayDate.getDate() === date.getDate();
    const badge = getDateBadgeParts(dateKey);
    return `
      <div class="calendar-day${isOutside ? " is-muted" : ""}${isToday ? " is-today" : ""}${dateEvents.length ? " has-events" : ""}${hasSelectedEvent ? " is-selected" : ""}${isExpandedDate ? " is-expanded" : ""}" data-date-key="${escapeHtml(dateKey)}" data-date-label="${escapeHtml(formatShortDate(dateKey))}">
        <span class="calendar-day-number"><span>${escapeHtml(badge.month)}</span><strong>${date.getDate()}</strong></span>
        <div class="calendar-event-stack">
          ${visibleEvents
            .map(
              (event) => {
                const eventIndex = content.events.indexOf(event);
                const slug = eventSlug(event, eventIndex);
                return `
                <button class="calendar-event-chip${slug === selectedCalendarEventSlug ? " is-selected" : ""}" type="button" data-event-slug="${escapeHtml(slug)}" title="${escapeHtml(eventTitle(event))}">
                  <img src="./public/icons/generated/calendar.png" alt="" aria-hidden="true">
                  <span>${escapeHtml(eventTitle(event))}</span>
                </button>
              `;
              },
            )
            .join("")}
          ${
            isExpandedDate
              ? `<button class="calendar-event-more is-collapse" type="button" data-collapse-date="${escapeHtml(dateKey)}">Show less</button>`
              : hiddenEvents.length
                ? `<button class="calendar-event-more" type="button" data-expand-date="${escapeHtml(dateKey)}" title="${escapeHtml(hiddenEvents.map((event) => eventTitle(event)).join(" - "))}">+${hiddenEvents.length} more</button>`
                : ""
          }
        </div>
      </div>
    `;
  }).join("");

  grid.innerHTML = weekdays.map((day) => `<div class="calendar-weekday">${day}</div>`).join("") + cells;
  if (wasSkeleton) revealLoadedRegion(grid);

  const selectedIndex = content.events.findIndex((event, index) => eventSlug(event, index) === selectedCalendarEventSlug);
  const selectedEvent = selectedIndex >= 0 ? content.events[selectedIndex] : null;
  setCalendarDetail(selectedEvent, selectedIndex);

  grid.querySelectorAll("[data-event-slug]").forEach((button) => {
    button.addEventListener("click", (event) => {
      selectedCalendarEventSlug = button.dataset.eventSlug;
      const selectedEvent = content.events.find((event, index) => eventSlug(event, index) === selectedCalendarEventSlug);
      const selectedEventDate = selectedEvent ? getEventDate(selectedEvent) : null;
      const selectedEventDateKey = selectedEventDate ? calendarDateKey(selectedEventDate) : "";
      if (expandedCalendarDateKey !== selectedEventDateKey) expandedCalendarDateKey = "";
      window.history.replaceState(null, "", `#event-${selectedCalendarEventSlug}`);
      renderCalendar(content);
      scrollToCalendarDetail(event.detail > 0 ? "smooth" : "auto");
    });
  });

  grid.querySelectorAll("[data-expand-date]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedCalendarEventSlug = "";
      expandedCalendarDateKey = button.dataset.expandDate;
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
      renderCalendar(content);
    });
  });

  grid.querySelectorAll("[data-collapse-date]").forEach((button) => {
    button.addEventListener("click", () => {
      if (expandedCalendarDateKey === button.dataset.collapseDate) expandedCalendarDateKey = "";
      renderCalendar(content);
    });
  });

  if (monthDirection) {
    animateStateEntry(title?.parentElement, { opacity: 0.78, translateX: monthDirection * 6 });
    animateStateEntry(grid, { opacity: 0.72, translateX: monthDirection * 8 });
  }
}

function initCalendar(content) {
  const grid = document.querySelector("[data-calendar-grid]");
  if (!grid) return;

  if (!calendarTodayOverride && /^\d{4}-\d{2}-\d{2}$/.test(content.calendar?.today || "")) {
    calendarTodayOverride = content.calendar.today;
    selectedCalendarMonth = getCalendarOverrideDate();
  }

  const hashSlug = eventSlugFromHash();
  if (hashSlug) {
    const eventIndex = content.events.findIndex((event, index) => eventSlug(event, index) === hashSlug);
    const event = eventIndex >= 0 ? content.events[eventIndex] : null;
    const eventDate = event ? getEventDate(event) : null;
    if (eventDate) selectedCalendarMonth = eventDate;
    if (event) selectedCalendarEventSlug = hashSlug;
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-calendar-nav]");
    if (!button) return;

    const previousMonthIndex = selectedCalendarMonth.getFullYear() * 12 + selectedCalendarMonth.getMonth();

    if (button.dataset.calendarNav === "today") {
      selectedCalendarMonth = getCalendarTodayDate();
    } else {
      selectedCalendarMonth = new Date(selectedCalendarMonth);
      selectedCalendarMonth.setMonth(selectedCalendarMonth.getMonth() + (button.dataset.calendarNav === "next" ? 1 : -1));
    }
    selectedCalendarEventSlug = "";
    expandedCalendarDateKey = "";
    const nextMonthIndex = selectedCalendarMonth.getFullYear() * 12 + selectedCalendarMonth.getMonth();
    renderCalendar(content, {
      monthDirection: event.detail > 0 ? Math.sign(nextMonthIndex - previousMonthIndex) : 0,
    });
  });

  renderCalendar(content);

  if (hashSlug) {
    scrollToCalendarDetail("auto");
  }
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
  const wasSkeleton = target.classList.contains("is-skeleton");
  let animateNextHashChange = false;
  const newsSource = normalizeNewsItems(content.news, fallbackNews);
  const items = sortNewsEntries(
    newsSource.map((item, originalIndex) => ({ item, originalIndex })),
    dateValue,
  );
  const markNewsImageShape = () => {
    target.querySelectorAll(".news-feature img").forEach((image) => {
      const applyShape = () => {
        const card = image.closest(".news-feature");
        if (!card || !image.naturalWidth || !image.naturalHeight) return;
        card.classList.toggle("news-feature--portrait", image.naturalHeight / image.naturalWidth > 1.08);
        card.classList.toggle("news-feature--wide", image.naturalHeight / image.naturalWidth <= 1.08);
      };
      if (image.complete) applyShape();
      else image.addEventListener("load", applyShape, { once: true });
    });
  };
  const renderList = ({ animate = false } = {}) => {
    document.body.classList.remove("is-news-detail-page");
    target.innerHTML = items
      .map(({ item, originalIndex }) => {
        const newsId = `news-${newsSlug(item, originalIndex)}`;
        const shortTitleClass = newsTitle(item, originalIndex).length <= 42 ? " news-feature--compact" : "";
        return `
          <a class="news-feature${shortTitleClass}" id="${escapeHtml(newsId)}" href="./news.html#${escapeHtml(newsId)}">
            ${responsiveImageMarkup(item.image, item.imageAlt || newsTitle(item, originalIndex), { sizes: "(max-width: 768px) calc(100vw - 48px), 210px" })}
            <span class="news-feature-category">${escapeHtml(newsCategory(item))}</span>
            <div>
              ${item.date ? `<time datetime="${escapeHtml(item.date)}">${escapeHtml(formatShortDate(item.date))}</time>` : ""}
              ${item.title ? `<h2>${escapeHtml(item.title)}</h2>` : ""}
              ${item.summary ? `<p>${escapeHtml(item.summary)}</p>` : ""}
            </div>
          </a>
        `;
      })
      .join("");
    prepareDeferredImages(target);
    markNewsImageShape();
    if (!window.location.hash) requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
      if (animate) animateStateEntry(target, { opacity: 0.7, translateY: 6 });
    });
  };

  const renderDetail = (item, originalIndex, { animate = false } = {}) => {
    const newsId = `news-${newsSlug(item, originalIndex)}`;
    document.body.classList.add("is-news-detail-page");
    target.innerHTML = `
      <article class="news-detail" data-news-detail data-news-id="${escapeHtml(newsId)}">
        <a class="news-detail-back" href="./news.html">Back to news</a>
        <div class="news-detail-body">
          <span class="news-feature-category">${escapeHtml(newsCategory(item))}</span>
          ${item.date ? `<time datetime="${escapeHtml(item.date)}">${escapeHtml(formatShortDate(item.date))}</time>` : ""}
          ${item.title ? `<h2>${escapeHtml(item.title)}</h2>` : ""}
          ${item.summary ? `<div class="news-detail-summary"><p>${escapeHtml(item.summary)}</p></div>` : ""}
        </div>
        <figure class="news-detail-poster">
          ${responsiveImageMarkup(item.image, item.imageAlt || newsTitle(item, originalIndex), { sizes: "(max-width: 768px) calc(100vw - 48px), 960px" })}
        </figure>
      </article>
    `;
    prepareDeferredImages(target);
    requestAnimationFrame(() => {
      const detail = document.querySelector("[data-news-detail]");
      const headerOffset = document.querySelector(".site-header")?.offsetHeight || 0;
      const top = Math.max(0, detail.getBoundingClientRect().top + window.scrollY - headerOffset - 24);
      window.scrollTo({ top, behavior: "auto" });
      if (animate) animateStateEntry(target, { opacity: 0.7, translateY: 6 });
    });
  };

  const renderCurrent = ({ animate = false } = {}) => {
    const hash = decodeURIComponent(window.location.hash.replace(/^#/, ""));
    const selectedIndex = hash ? items.findIndex(({ item, originalIndex }) => `news-${newsSlug(item, originalIndex)}` === hash || `news-${slugify(item.title)}` === hash) : -1;
    if (selectedIndex >= 0) {
      renderDetail(items[selectedIndex].item, items[selectedIndex].originalIndex, { animate });
      return;
    }
    renderList({ animate });
  };

  target.addEventListener("click", (event) => {
    const backLink = event.target.closest(".news-detail-back");
    if (backLink) {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
      renderCurrent({ animate: event.detail > 0 });
      return;
    }

    if (event.target.closest(".news-feature")) animateNextHashChange = event.detail > 0;
  });

  renderCurrent();
  if (wasSkeleton) revealLoadedRegion(target);
  window.addEventListener("hashchange", () => {
    renderCurrent({ animate: animateNextHashChange });
    animateNextHashChange = false;
  });
}

async function boot() {
  initMobileNav();
  initDateNavigator();
  renderPrayerTable();
  renderDeferredSkeletons();
  const content = await loadCmsContent();
  renderEvents(content);
  renderJummah(content);
  initCalendar(content);
  renderNews(content);
}

boot();
