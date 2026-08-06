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
      <a class="desktop-menu-only" href="./donate.html">Donate</a>
      <a href="./prayer-times.html">Monthly Prayer Schedule</a>
      <a href="./calendar.html">Event Calendar</a>
      <a href="./programs.html">Programs</a>
      <a href="./news.html">News</a>
      <a href="./about.html">About</a>
    </details>
    <details class="menu-panel-section">
      <summary>Programs & Services</summary>
      <a href="./programs.html#services">Services Overview</a>
      <a href="./volunteer.html">Volunteer</a>
      <a href="./food-pantry.html">Food Pantry</a>
      <a href="./financial-aid.html">Financial Aid</a>
    </details>
    <details class="menu-panel-section">
      <summary>Education</summary>
      <a href="./al-mizaan-academy.html">Al Mizaan Academy</a>
      <a href="./nibraas-institute.html">Nibraas Institute</a>
      <a href="./al-falah-quran-school.html">Al-Falah Quran School</a>
    </details>
    <details class="menu-panel-section">
      <summary>Community</summary>
      <a href="./about.html#imam">Our Imam</a>
      <a href="./about.html#contact">Contact Us</a>
    </details>
  `;
  button.after(panel);

  let closeTimer = null;
  let menuOpen = false;

  const finishClose = () => {
    if (menuOpen) return;
    nav.classList.remove("menu-open");
    panel.classList.remove("is-closing");
    panel.hidden = true;
  };

  panel.addEventListener("transitionend", (event) => {
    if (event.target === panel && event.propertyName === "opacity") finishClose();
  });

  const closeMenu = () => {
    if (!menuOpen && panel.hidden) return;
    menuOpen = false;
    window.clearTimeout(closeTimer);
    panel.classList.remove("is-open");
    panel.classList.add("is-closing");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", "Open menu");
    closeTimer = window.setTimeout(finishClose, 210);
  };

  const setMenuOpen = (isOpen) => {
    window.clearTimeout(closeTimer);
    if (!isOpen) {
      closeMenu();
      return;
    }

    menuOpen = true;
    panel.hidden = false;
    panel.classList.remove("is-closing");
    nav.classList.add("menu-open");
    requestAnimationFrame(() => {
      if (menuOpen) panel.classList.add("is-open");
    });
    button.setAttribute("aria-expanded", "true");
    button.setAttribute("aria-label", "Close menu");
  };

  button.setAttribute("aria-controls", panel.id);
  button.setAttribute("aria-expanded", "false");

  button.addEventListener("click", (event) => {
    event.stopPropagation();
    setMenuOpen(!menuOpen);
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("click", (event) => {
    if (!menuOpen || nav.contains(event.target)) return;
    closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !menuOpen) return;
    closeMenu();
    button.focus({ preventScroll: true });
  });
}
