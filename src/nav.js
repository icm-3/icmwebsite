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
  const menuSections = panel.querySelectorAll(".menu-panel-section");

  const clearSectionAnimation = (section) => {
    section.style.height = "";
    section.style.overflow = "";
    section.classList.remove("is-animating");
  };

  const setSectionOpen = (section, shouldOpen) => {
    if (section.open === shouldOpen || section.classList.contains("is-animating")) return;

    const startHeight = section.offsetHeight;
    let endHeight;
    if (shouldOpen) {
      section.open = true;
      endHeight = section.offsetHeight;
    } else {
      section.open = false;
      endHeight = section.offsetHeight;
      section.open = true;
    }
    section.classList.add("is-animating");
    section.style.overflow = "hidden";
    section.style.height = `${startHeight}px`;

    requestAnimationFrame(() => {
      section.style.height = `${endHeight}px`;
    });

    const finish = () => {
      if (!shouldOpen) section.open = false;
      clearSectionAnimation(section);
      section.removeEventListener("transitionend", finish);
    };
    section.addEventListener("transitionend", finish);
    window.setTimeout(finish, 260);
  };

  menuSections.forEach((section) => {
    section.addEventListener("click", (event) => {
      const summary = event.target.closest("summary");
      if (!summary || !section.contains(summary)) return;
      event.preventDefault();
      setSectionOpen(section, !section.open);
    });
  });

  const closeMenu = () => {
    if (!nav.classList.contains("menu-open")) return;
    window.clearTimeout(closeTimer);
    panel.classList.remove("is-open");
    panel.classList.add("is-closing");
    nav.classList.add("menu-closing");
    nav.classList.remove("menu-exit");
    nav.classList.remove("menu-visible");
    void nav.offsetHeight;
    requestAnimationFrame(() => {
      nav.classList.add("menu-exit");
    });
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", "Open menu");
    closeTimer = window.setTimeout(() => {
      nav.classList.remove("menu-open");
      nav.classList.remove("menu-closing");
      nav.classList.remove("menu-exit");
      panel.classList.remove("is-closing");
      panel.hidden = true;
    }, 220);
  };

  const setMenuOpen = (isOpen) => {
    window.clearTimeout(closeTimer);
    if (!isOpen) {
      closeMenu();
      return;
    }

    panel.hidden = false;
    panel.classList.remove("is-closing");
    nav.classList.add("menu-open");
    nav.classList.remove("menu-closing");
    nav.classList.remove("menu-exit");
    nav.classList.remove("menu-visible");
    void nav.offsetHeight;
    void panel.offsetHeight;
    requestAnimationFrame(() => {
      nav.classList.add("menu-visible");
      panel.classList.add("is-open");
    });
    button.setAttribute("aria-expanded", "true");
    button.setAttribute("aria-label", "Close menu");
  };

  button.setAttribute("aria-controls", panel.id);
  button.setAttribute("aria-expanded", "false");

  button.addEventListener("click", (event) => {
    event.stopPropagation();
    setMenuOpen(!panel.classList.contains("is-open"));
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
