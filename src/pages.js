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
let selectedCalendarMonth = new Date();
let selectedCalendarEventSlug = "";

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

function slugify(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
  const meta = eventDateTimeLabel(event);
  target.innerHTML = `
    <article class="calendar-detail-card" id="event-${escapeHtml(eventSlug(event, index))}">
      <div class="calendar-detail-body">
        <h3>${escapeHtml(eventTitle(event))}</h3>
        ${meta ? `<time datetime="${escapeHtml(event.date || "")}">${escapeHtml(meta)}</time>` : ""}
        ${event.location ? `<p class="calendar-detail-location">${escapeHtml(event.location)}</p>` : ""}
        ${event.description ? `<p>${escapeHtml(event.description)}</p>` : ""}
        ${eventLink(event) ? `<a class="calendar-detail-link" href="${escapeHtml(eventLink(event))}" target="_blank" rel="noopener">Open Link</a>` : ""}
      </div>
      ${
        poster
          ? `<img class="calendar-detail-poster" src="${escapeHtml(poster)}" alt="${escapeHtml(eventPosterAlt(event))}">`
          : ""
      }
    </article>
  `;
}

function renderCalendar(content) {
  const grid = document.querySelector("[data-calendar-grid]");
  if (!grid) return;

  const title = document.querySelector("[data-calendar-title]");
  const hijri = document.querySelector("[data-calendar-hijri]");
  const monthStart = new Date(selectedCalendarMonth.getFullYear(), selectedCalendarMonth.getMonth(), 1);
  const firstGridDate = new Date(monthStart);
  firstGridDate.setDate(firstGridDate.getDate() - firstGridDate.getDay());
  const monthEvents = content.events.filter((event) => {
    const eventDate = getEventDate(event);
    return eventDate && eventDate.getFullYear() === monthStart.getFullYear() && eventDate.getMonth() === monthStart.getMonth();
  });

  if (title) title.textContent = formatMonthTitle(monthStart);
  if (hijri) hijri.textContent = formatHijriMonth(selectedCalendarMonth);

  if (!selectedCalendarEventSlug && monthEvents[0]) {
    selectedCalendarEventSlug = eventSlug(monthEvents[0], content.events.indexOf(monthEvents[0]));
  }

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const todayDate = prayerDateFor(new Date());
  const cells = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstGridDate);
    date.setDate(firstGridDate.getDate() + index);
    const dateEvents = content.events.filter((event) => eventMatchesDate(event, date));
    const visibleEvents = dateEvents.slice(0, 2);
    const hiddenEvents = dateEvents.slice(2);
    const isOutside = date.getMonth() !== monthStart.getMonth();
    const isToday =
      todayDate.getFullYear() === date.getFullYear() &&
      todayDate.getMonth() === date.getMonth() &&
      todayDate.getDate() === date.getDate();

    return `
      <div class="calendar-day${isOutside ? " is-muted" : ""}${isToday ? " is-today" : ""}${dateEvents.length ? " has-events" : ""}" data-date-label="${escapeHtml(formatShortDate(date.toISOString().slice(0, 10)))}">
        <span class="calendar-day-number">${date.getDate()}</span>
        <div class="calendar-event-stack">
          ${visibleEvents
            .map(
              (event) => {
                const eventIndex = content.events.indexOf(event);
                return `
                <button class="calendar-event-chip" type="button" data-event-slug="${escapeHtml(eventSlug(event, eventIndex))}" title="${escapeHtml(eventTitle(event))}">
                  <img src="./public/icons/generated/calendar.png" alt="" aria-hidden="true">
                  <span>${escapeHtml(eventTitle(event))}</span>
                </button>
              `;
              },
            )
            .join("")}
          ${
            hiddenEvents.length
              ? `<button class="calendar-event-more" type="button" data-event-slug="${escapeHtml(eventSlug(hiddenEvents[0], content.events.indexOf(hiddenEvents[0])))}" title="${escapeHtml(hiddenEvents.map((event) => eventTitle(event)).join(" - "))}">+${hiddenEvents.length} more</button>`
              : ""
          }
        </div>
      </div>
    `;
  }).join("");

  grid.innerHTML = weekdays.map((day) => `<div class="calendar-weekday">${day}</div>`).join("") + cells;

  const selectedIndex = content.events.findIndex((event, index) => eventSlug(event, index) === selectedCalendarEventSlug);
  const selectedEvent = selectedIndex >= 0 ? content.events[selectedIndex] : monthEvents[0] || content.events[0];
  setCalendarDetail(selectedEvent, selectedIndex >= 0 ? selectedIndex : content.events.indexOf(selectedEvent));

  grid.querySelectorAll("[data-event-slug]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedCalendarEventSlug = button.dataset.eventSlug;
      const eventIndex = content.events.findIndex((item, index) => eventSlug(item, index) === selectedCalendarEventSlug);
      const event = eventIndex >= 0 ? content.events[eventIndex] : null;
      setCalendarDetail(event, eventIndex);
      document.querySelector("[data-calendar-detail]")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  });
}

function initCalendar(content) {
  const grid = document.querySelector("[data-calendar-grid]");
  if (!grid) return;

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-calendar-nav]");
    if (!button) return;

    if (button.dataset.calendarNav === "today") {
      selectedCalendarMonth = new Date();
    } else {
      selectedCalendarMonth = new Date(selectedCalendarMonth);
      selectedCalendarMonth.setMonth(selectedCalendarMonth.getMonth() + (button.dataset.calendarNav === "next" ? 1 : -1));
    }
    selectedCalendarEventSlug = "";
    renderCalendar(content);
  });

  renderCalendar(content);
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
        <article class="news-feature" id="news-${escapeHtml(slugify(item.title))}">
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
  initCalendar(content);
  renderNews(content);
}

boot();
