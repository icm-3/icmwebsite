export function initMobileNav() {
  const nav = document.querySelector(".top-nav");
  const button = document.querySelector(".menu-button");
  if (!nav || !button) return;

  const panel = document.createElement("div");
  panel.className = "menu-panel";
  panel.id = "site-menu-panel";
  panel.hidden = true;
  panel.innerHTML = `
    <div class="menu-panel-section menu-panel-primary">
      <p>Main Pages</p>
      <a href="./calendar.html">Calendar</a>
      <a href="./prayer-times.html">Full Prayer Schedule</a>
      <a href="./programs.html">Programs</a>
      <a href="./news.html">News</a>
      <a href="./about.html">About</a>
    </div>
    <div class="menu-panel-section">
      <p>Education</p>
      <a href="./al-mizaan-academy.html">Al Mizaan Academy</a>
      <a href="./nibraas-institute.html">Nibraas Institute</a>
      <a href="./al-falah-quran-school.html">Al-Falah Quran School</a>
    </div>
    <div class="menu-panel-section">
      <p>Programs & Services</p>
      <a href="./programs.html#services">Services Overview</a>
      <a href="./financial-aid.html">Financial Aid</a>
      <a href="./food-pantry.html">Food Pantry</a>
      <a href="./volunteer.html">Volunteer</a>
    </div>
    <div class="menu-panel-section">
      <p>Community</p>
      <a href="./about.html#imam">Our Imam</a>
      <a href="./about.html#contact">Contact Us</a>
    </div>
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
