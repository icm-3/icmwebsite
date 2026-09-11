import { initMobileNav } from "./nav.js";
import { esc as escapeHtml, watchContent, renderWebsitePrayers, contentLinks } from "./shared.js";
const TIME_ZONE="America/New_York";
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
  const items = content.news;
  target.innerHTML = items
    .map(
      (item) => `
        <article class="news-feature" id="${escapeHtml(item.id)}">
          <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.imageAlt || item.title)}">
          <div>
            <time datetime="${escapeHtml(item.date)}">${escapeHtml(formatShortDate(item.date))}</time>
            <h2>${escapeHtml(item.title)}</h2>
            <p>${escapeHtml(item.summary)}</p><p style="white-space:pre-wrap">${escapeHtml(item.body)}</p>${item.url ? `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener">Read original</a>` : ""}
          </div>
        </article>
      `,
    )
    .join("");
}

function boot() {
 initMobileNav();watchContent(content=>{renderEvents(content);renderJummah(content);renderNews(content);contentLinks(content);});
 renderWebsitePrayers();setInterval(renderWebsitePrayers,60000);
}

boot();
