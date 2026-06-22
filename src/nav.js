export function initMobileNav() {
  const nav = document.querySelector(".top-nav");
  const button = document.querySelector(".menu-button");
  if (!nav || !button) return;

  const panel = document.createElement("div");
  panel.className = "menu-panel";
  panel.id = "site-menu-panel";
  panel.hidden = true;
  panel.innerHTML = `
    <details class="menu-panel-section menu-panel-primary" open>
      <summary>Main Pages</summary>
      <a href="./calendar.html">Event Calendar</a>
      <a href="./prayer-times.html">Monthly Prayer Schedule</a>
      <a href="./programs.html">Programs</a>
      <a href="./news.html">News</a>
      <a href="./about.html">About</a>
    </details>
    <details class="menu-panel-section">
      <summary>Education Programs</summary>
      <a href="./programs.html#education">Education Overview</a>
      <a href="./al-mizaan-academy.html">Al Mizaan Academy</a>
      <a href="./nibraas-institute.html">Nibraas Institute</a>
      <a href="./al-falah-quran-school.html">Al-Falah Quran School</a>
    </details>
    <details class="menu-panel-section">
      <summary>Programs & Services</summary>
      <a href="./programs.html#services">Services Overview</a>
      <a href="./financial-aid.html">Financial Aid</a>
      <a href="./food-pantry.html">Food Pantry</a>
      <a href="./volunteer.html">Volunteer</a>
    </details>
    <details class="menu-panel-section">
      <summary>Community</summary>
      <a href="./about.html#imam">Our Imam</a>
      <a href="./about.html#contact">Contact Us</a>
    </details>
  `;
  button.after(panel);

  const closeMenu = () => {
    nav.classList.remove("menu-open");
    panel.hidden = true;
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", "Open menu");
  };

  const setMenuOpen = (isOpen) => {
    nav.classList.toggle("menu-open", isOpen);
    panel.hidden = !isOpen;
    button.setAttribute("aria-expanded", String(isOpen));
    button.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  };

  button.setAttribute("aria-controls", panel.id);
  button.setAttribute("aria-expanded", "false");

  button.addEventListener("click", (event) => {
    event.stopPropagation();
    setMenuOpen(!nav.classList.contains("menu-open"));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("click", (event) => {
    if (!nav.classList.contains("menu-open") || nav.contains(event.target)) return;
    closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
}
