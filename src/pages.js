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
const calendarTodayOverride = "";
const prayerLabels = {
  fajr: "Fajr",
  sunrise: "Sunrise",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
};
let selectedPrayerDate = new Date();
let selectedCalendarMonth = getCalendarOverrideDate() || new Date();
let selectedCalendarEventSlug = "";
let expandedCalendarDateKey = "";

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
  return slugify([newsTitle(item, index), item.date, index].filter(Boolean).join("-")) || `announcement-${index}`;
}

function newsCategory(item) {
  if (item.category) return item.category;

  const text = `${item.title || ""} ${item.summary || ""}`.toLowerCase();
  if (text.includes("ramadan") || text.includes("taraweeh")) return "Program";
  if (text.includes("youth") || text.includes("camp")) return "Youth";
  if (text.includes("eid")) return "Announcement";
  if (text.includes("program") || text.includes("workshop") || text.includes("class")) return "Program";
  if (text.includes("parking") || text.includes("arrival")) return "Notice";
  return "Announcement";
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

function getCalendarOverrideDate() {
  if (!calendarTodayOverride) return null;
  const [year, month, day] = calendarTodayOverride.split("-").map(Number);
  return new Date(year, month - 1, day);
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
    window.scrollTo({ top, behavior });
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
          ? `<figure class="calendar-detail-poster"><img src="${escapeHtml(poster)}" alt="${escapeHtml(eventPosterAlt(event))}"></figure>`
          : ""
      }
    </article>
  `;
}

function syncCalendarTodayEdge(grid) {
  grid.classList.remove("has-today-left-edge", "has-today-right-edge");
  grid.style.removeProperty("--calendar-today-top");
  grid.style.removeProperty("--calendar-today-height");

  const todayCell = grid.querySelector(".calendar-day.is-today:not(.is-selected):not(.is-expanded)");
  if (!todayCell) return;

  const cellIndex = [...grid.children].indexOf(todayCell);
  const columnIndex = cellIndex % 7;
  if (columnIndex !== 0 && columnIndex !== 6) return;

  grid.style.setProperty("--calendar-today-top", `${todayCell.offsetTop}px`);
  grid.style.setProperty("--calendar-today-height", `${todayCell.offsetHeight}px`);
  grid.classList.add(columnIndex === 0 ? "has-today-left-edge" : "has-today-right-edge");
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

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const todayDate = getCalendarTodayDate();
  const cells = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstGridDate);
    date.setDate(firstGridDate.getDate() + index);
    const dateKey = date.toISOString().slice(0, 10);
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
      <div class="calendar-day${isOutside ? " is-muted" : ""}${isToday ? " is-today" : ""}${dateEvents.length ? " has-events" : ""}${hasSelectedEvent ? " is-selected" : ""}${isExpandedDate ? " is-expanded" : ""}" data-date-label="${escapeHtml(formatShortDate(dateKey))}">
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
  syncCalendarTodayEdge(grid);

  const selectedIndex = content.events.findIndex((event, index) => eventSlug(event, index) === selectedCalendarEventSlug);
  const selectedEvent = selectedIndex >= 0 ? content.events[selectedIndex] : null;
  setCalendarDetail(selectedEvent, selectedIndex);

  grid.querySelectorAll("[data-event-slug]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedCalendarEventSlug = button.dataset.eventSlug;
      window.history.replaceState(null, "", `#event-${selectedCalendarEventSlug}`);
      renderCalendar(content);
      scrollToCalendarDetail("smooth");
    });
  });

  grid.querySelectorAll("[data-expand-date]").forEach((button) => {
    button.addEventListener("click", () => {
      expandedCalendarDateKey = button.dataset.expandDate;
      renderCalendar(content);
    });
  });

  grid.querySelectorAll("[data-collapse-date]").forEach((button) => {
    button.addEventListener("click", () => {
      if (expandedCalendarDateKey === button.dataset.collapseDate) expandedCalendarDateKey = "";
      renderCalendar(content);
    });
  });
}

function initCalendar(content) {
  const grid = document.querySelector("[data-calendar-grid]");
  if (!grid) return;

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

    if (button.dataset.calendarNav === "today") {
      selectedCalendarMonth = getCalendarTodayDate();
    } else {
      selectedCalendarMonth = new Date(selectedCalendarMonth);
      selectedCalendarMonth.setMonth(selectedCalendarMonth.getMonth() + (button.dataset.calendarNav === "next" ? 1 : -1));
    }
    selectedCalendarEventSlug = "";
    expandedCalendarDateKey = "";
    renderCalendar(content);
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
  const newsSource = content.news?.length ? content.news : fallbackNews;
  const items = newsSource.map((item, originalIndex) => ({ item, originalIndex })).sort(
    (first, second) => dateValue(second.item.date) - dateValue(first.item.date),
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
  const renderList = () => {
    document.body.classList.remove("is-news-detail-page");
    target.innerHTML = items
      .map(({ item, originalIndex }) => {
        const newsId = `news-${newsSlug(item, originalIndex)}`;
        const shortTitleClass = newsTitle(item, originalIndex).length <= 42 ? " news-feature--compact" : "";
        return `
          <a class="news-feature${shortTitleClass}" id="${escapeHtml(newsId)}" href="./news.html#${escapeHtml(newsId)}">
            <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.imageAlt || newsTitle(item, originalIndex))}">
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
    markNewsImageShape();
    if (!window.location.hash) {
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" }));
    }
  };

  const renderDetail = (item, originalIndex) => {
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
          <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.imageAlt || newsTitle(item, originalIndex))}">
        </figure>
      </article>
    `;
    requestAnimationFrame(() => {
      const detail = document.querySelector("[data-news-detail]");
      const headerOffset = document.querySelector(".site-header")?.offsetHeight || 0;
      const top = Math.max(0, detail.getBoundingClientRect().top + window.scrollY - headerOffset - 24);
      window.scrollTo({ top, behavior: "auto" });
    });
  };

  const renderCurrent = () => {
    const hash = decodeURIComponent(window.location.hash.replace(/^#/, ""));
    const selectedIndex = hash ? items.findIndex(({ item, originalIndex }) => `news-${newsSlug(item, originalIndex)}` === hash || `news-${slugify(item.title)}` === hash) : -1;
    if (selectedIndex >= 0) {
      renderDetail(items[selectedIndex].item, items[selectedIndex].originalIndex);
      return;
    }
    renderList();
  };

  renderCurrent();
  window.addEventListener("hashchange", renderCurrent);
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
