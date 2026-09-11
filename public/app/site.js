// src/nav.js
function initMobileNav() {
  const nav = document.querySelector(".top-nav");
  const button = document.querySelector(".menu-button");
  if (!nav || !button) return;
  button.setAttribute("aria-expanded", "false");
  button.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("menu-open");
    button.setAttribute("aria-expanded", String(isOpen));
  });
  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("menu-open");
      button.setAttribute("aria-expanded", "false");
    });
  });
}

// src/shared.js
var esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var emptyContent = { hero: { image: "/public/images/masjid-hero.png", imageAlt: "" }, jummah: { dateLabel: "", shifts: [] }, news: [], events: [], programs: [], settings: {} };
async function request(url, options = {}) {
  const res = await fetch(url, { cache: "no-store", ...options });
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(data.error || "Request failed"), { status: res.status });
  return data;
}
function readCache(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}
function saveCache(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
  }
}
async function loadContent() {
  try {
    const value = await request("/api/content");
    saveCache("icm-connected-published", value);
    return value.content;
  } catch {
    return readCache("icm-connected-published")?.content || structuredClone(emptyContent);
  }
}
function watchContent(render) {
  let previous = "", busy = false;
  async function update() {
    if (busy) return;
    busy = true;
    try {
      const content = await loadContent(), serialized = JSON.stringify(content);
      if (serialized !== previous) {
        previous = serialized;
        render(content);
      }
    } finally {
      busy = false;
    }
  }
  update();
  const timer = setInterval(() => {
    if (!document.hidden) update();
  }, 15e3);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) update();
  });
  window.addEventListener("online", update);
  return () => clearInterval(timer);
}
function contentLinks(content) {
  const s = content.settings;
  document.querySelectorAll("[data-newsletter-link]").forEach((link) => link.href = s.newsletterUrl);
  document.querySelectorAll('a[href="https://www.icmnc.org/donate/"]').forEach((link) => link.setAttribute("data-donation-link", ""));
  for (const link of document.querySelectorAll('a[href="https://www.icmnc.org/donate/"]')) link.href = s.donationUrl || "https://www.icmnc.org/donate/";
  document.querySelectorAll("[data-donation-link]").forEach((link) => link.href = s.donationUrl);
  for (const link of document.querySelectorAll(".socials a")) {
    const name = link.getAttribute("aria-label")?.toLowerCase();
    if (name in s) {
      if (s[name]) link.href = s[name];
      else link.removeAttribute("href");
    }
  }
}

// src/site.js
initMobileNav();
watchContent((content) => {
  contentLinks(content);
  const grids = document.querySelectorAll(".program-grid");
  if (grids.length) {
    const categories = ["Education", "Community Programs"];
    grids.forEach((grid, i) => {
      const programs = content.programs.filter((p) => i === 0 ? p.category === "Education" : p.category !== "Education");
      grid.innerHTML = programs.length ? programs.map((p) => `<article class="program-card"><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p><span>${esc(p.schedule)}</span>${p.url ? `<a href="${esc(p.url)}" target="_blank" rel="noopener">Learn more</a>` : ""}</article>`).join("") : '<p class="content-empty">No programs have been published in this section yet.</p>';
    });
  }
  const contact = document.querySelectorAll("#contact .feature-card p");
  if (contact.length >= 2) {
    contact[0].textContent = content.settings.address;
    contact[1].textContent = content.settings.contactEmail;
  }
});
