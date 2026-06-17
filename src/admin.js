import { defaultContent } from "./default-content.js";

let state = structuredClone(defaultContent);

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function setStatus(message, tone = "neutral") {
  const status = document.querySelector("[data-status]");
  if (!status) return;
  status.textContent = message;
  status.dataset.tone = tone;
}

function setByPath(path, value) {
  const parts = path.split(".");
  let target = state;
  while (parts.length > 1) {
    const part = parts.shift();
    target = target[part];
  }
  target[parts[0]] = value;
}

function field(path, value, label, type = "text") {
  return `
    <label class="cms-field">
      <span>${escapeHtml(label)}</span>
      <input type="${type}" value="${escapeHtml(value)}" data-path="${escapeHtml(path)}">
    </label>
  `;
}

function textarea(path, value, label) {
  return `
    <label class="cms-field cms-field-wide">
      <span>${escapeHtml(label)}</span>
      <textarea data-path="${escapeHtml(path)}">${escapeHtml(value)}</textarea>
    </label>
  `;
}

function imageField(path, value, label) {
  return `
    <label class="cms-field cms-field-wide">
      <span>${escapeHtml(label)}</span>
      <input type="text" value="${escapeHtml(value)}" data-path="${escapeHtml(path)}">
    </label>
    <label class="cms-file">
      <span>Upload image</span>
      <input type="file" accept="image/*" data-image-path="${escapeHtml(path)}">
    </label>
  `;
}

function renderHero() {
  return `
    <section class="cms-panel">
      <header>
        <h2>Header Image</h2>
        <p>Controls the image on the right side of the homepage hero.</p>
      </header>
      <div class="cms-grid">
        ${imageField("hero.image", state.hero.image, "Hero image URL or data image")}
        ${field("hero.imageAlt", state.hero.imageAlt, "Image alt text")}
      </div>
      <div class="cms-preview cms-preview-hero">
        <img src="${escapeHtml(state.hero.image)}" alt="">
      </div>
    </section>
  `;
}

function renderJummah() {
  const rows = state.jummah.shifts
    .map(
      (shift, index) => `
        <article class="cms-item">
          <div class="cms-item-title">
            <strong>Shift ${escapeHtml(shift.shift || index + 1)}</strong>
            <button type="button" data-action="remove-jummah" data-index="${index}">Remove</button>
          </div>
          <div class="cms-grid">
            ${field(`jummah.shifts.${index}.shift`, shift.shift, "Shift")}
            ${field(`jummah.shifts.${index}.time`, shift.time, "Time")}
            ${field(`jummah.shifts.${index}.speaker`, shift.speaker, "Speaker")}
            ${field(`jummah.shifts.${index}.topic`, shift.topic, "Topic")}
          </div>
        </article>
      `,
    )
    .join("");

  return `
    <section class="cms-panel">
      <header>
        <h2>Jumu'ah</h2>
        <button type="button" data-action="add-jummah">Add Shift</button>
      </header>
      <div class="cms-grid">
        ${field("jummah.dateLabel", state.jummah.dateLabel, "Display date label")}
      </div>
      <div class="cms-list">${rows}</div>
    </section>
  `;
}

function renderEvents() {
  const rows = state.events
    .map(
      (event, index) => `
        <article class="cms-item">
          <div class="cms-item-title">
            <strong>${escapeHtml(event.title || `Event ${index + 1}`)}</strong>
            <button type="button" data-action="remove-event" data-index="${index}">Remove</button>
          </div>
          <div class="cms-grid">
            ${field(`events.${index}.title`, event.title, "Title")}
            ${field(`events.${index}.date`, event.date, "Date", "date")}
            ${field(`events.${index}.time`, event.time, "Time")}
            ${field(`events.${index}.location`, event.location, "Location")}
            ${textarea(`events.${index}.description`, event.description, "Description")}
            ${field(`events.${index}.link`, event.link || "", "Link URL")}
            ${imageField(`events.${index}.poster`, event.poster || "", "Poster URL or data image")}
            ${field(`events.${index}.posterAlt`, event.posterAlt || event.title, "Poster alt text")}
          </div>
          ${event.poster ? `<div class="cms-preview"><img src="${escapeHtml(event.poster)}" alt=""></div>` : ""}
        </article>
      `,
    )
    .join("");

  return `
    <section class="cms-panel">
      <header>
        <h2>Upcoming Events</h2>
        <button type="button" data-action="add-event">Add Event</button>
      </header>
      <div class="cms-list">${rows}</div>
    </section>
  `;
}

function renderNews() {
  const rows = state.news
    .map(
      (item, index) => `
        <article class="cms-item">
          <div class="cms-item-title">
            <strong>${escapeHtml(item.title || `News ${index + 1}`)}</strong>
            <button type="button" data-action="remove-news" data-index="${index}">Remove</button>
          </div>
          <div class="cms-grid">
            ${field(`news.${index}.title`, item.title, "Title")}
            ${field(`news.${index}.date`, item.date, "Date", "date")}
            ${textarea(`news.${index}.summary`, item.summary, "Summary")}
            ${imageField(`news.${index}.image`, item.image, "Image URL or data image")}
            ${field(`news.${index}.imageAlt`, item.imageAlt, "Image alt text")}
          </div>
          <div class="cms-preview"><img src="${escapeHtml(item.image)}" alt=""></div>
        </article>
      `,
    )
    .join("");

  return `
    <section class="cms-panel">
      <header>
        <h2>News & Announcements</h2>
        <button type="button" data-action="add-news">Add News</button>
      </header>
      <div class="cms-list">${rows}</div>
    </section>
  `;
}

function render() {
  const app = document.querySelector("[data-cms-app]");
  app.innerHTML = renderHero() + renderJummah() + renderEvents() + renderNews();
}

async function load() {
  try {
    const response = await fetch("/api/cms", { cache: "no-store" });
    if (!response.ok) throw new Error("CMS API unavailable");
    state = await response.json();
    localStorage.setItem("icm-cms-content", JSON.stringify(state));
    setStatus("Loaded saved CMS content.", "success");
  } catch {
    const local = localStorage.getItem("icm-cms-content");
    state = local ? JSON.parse(local) : structuredClone(defaultContent);
    setStatus("Using local/default content until the CMS server is available.", "warn");
  }
  render();
}

async function save() {
  localStorage.setItem("icm-cms-content", JSON.stringify(state));
  try {
    const response = await fetch("/api/cms", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(state),
    });
    if (!response.ok) throw new Error("Save failed");
    setStatus("Saved. Refresh the homepage to see changes.", "success");
  } catch {
    setStatus("Saved in this browser only. Start the local server to persist to disk.", "warn");
  }
}

function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

document.addEventListener("input", (event) => {
  const path = event.target.dataset.path;
  if (!path) return;
  setByPath(path, event.target.value);
});

document.addEventListener("change", async (event) => {
  const path = event.target.dataset.imagePath;
  const file = event.target.files?.[0];
  if (!path || !file) return;
  setByPath(path, await readImage(file));
  setStatus("Image loaded. Save when you are ready.", "warn");
  render();
});

document.addEventListener("click", async (event) => {
  const action = event.target.dataset.action;
  if (!action) return;

  const index = Number(event.target.dataset.index);
  if (action === "save") await save();
  if (action === "reset") {
    state = structuredClone(defaultContent);
    setStatus("Reset to default content. Save to keep this reset.", "warn");
    render();
  }
  if (action === "add-jummah") {
    state.jummah.shifts.push({ shift: String(state.jummah.shifts.length + 1), time: "1:00 PM", speaker: "Speaker", topic: "Khutbah topic" });
    render();
  }
  if (action === "remove-jummah") {
    state.jummah.shifts.splice(index, 1);
    render();
  }
  if (action === "add-event") {
    state.events.push({ title: "", date: "2026-07-01", time: "", location: "", description: "", link: "", poster: "", posterAlt: "" });
    render();
  }
  if (action === "remove-event") {
    state.events.splice(index, 1);
    render();
  }
  if (action === "add-news") {
    state.news.push({ title: "New Announcement", date: "2026-07-01", summary: "Announcement details.", image: "./public/news/ramadan.png", imageAlt: "Announcement image" });
    render();
  }
  if (action === "remove-news") {
    state.news.splice(index, 1);
    render();
  }
});

load();
