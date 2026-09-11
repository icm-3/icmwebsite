import { initMobileNav } from "./nav.js";
import { esc as escapeHtml, emptyContent as defaultContent, watchContent, renderWebsitePrayers, articleLink, contentLinks } from "./shared.js";
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

function renderJummah(content) {
  const label = content.jummah.dateLabel || defaultContent.jummah.dateLabel;
  setText("[data-jummah-date]", `- ${label.toUpperCase()}`);

  const tbody = document.querySelector("[data-jummah-body]");
  if (!tbody) return;
  const shifts = content.jummah.shifts;
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
  const events = content.events.filter(e => e.date >= new Date().toLocaleDateString("en-CA", {timeZone:TIME_ZONE}));
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
  const news = content.news;
  list.innerHTML = news
    .map(
      (item) => `
        <article class="news-item">
          <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.imageAlt || item.title)}">
          <div>
            <h3><a href="${articleLink(item)}" style="color:inherit;text-decoration:none">${escapeHtml(item.title)}</a></h3>
            <p>${escapeHtml(item.summary)}</p>
          </div>
          <time datetime="${escapeHtml(item.date)}">${escapeHtml(formatShortDate(item.date))}</time>
        </article>
      `,
    )
    .join("");
}

function boot() {
  initMobileNav();
  watchContent(content=>{renderHero(content);renderJummah(content);renderEvents(content);renderNews(content);contentLinks(content);});
  renderWebsitePrayers();setInterval(renderWebsitePrayers,60000);
}

boot();
