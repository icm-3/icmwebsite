export function initMobileNav() {
  const nav = document.querySelector(".top-nav");
  const button = document.querySelector(".menu-button");
  if (!nav || !button) return;

  const panel = document.createElement("div");
  panel.className = "menu-panel";
  panel.id = "site-menu-panel";
  panel.hidden = true;
  panel.innerHTML = `
    <section class="menu-panel-section menu-panel-primary is-expanded" data-menu-section>
      <button class="menu-panel-section-toggle" type="button" aria-expanded="true" aria-controls="menu-main-pages">Main Pages</button>
      <div class="menu-panel-section-content" id="menu-main-pages">
        <div class="menu-panel-section-content-inner">
          <a href="./donate.html">Donate</a>
          <a href="./prayer-times.html">Monthly Prayer Schedule</a>
          <a href="./calendar.html">Event Calendar</a>
          <a href="./programs.html">Programs</a>
          <a href="./news.html">News</a>
          <a href="./about.html">About</a>
        </div>
      </div>
    </section>
    <section class="menu-panel-section" data-menu-section>
      <button class="menu-panel-section-toggle" type="button" aria-expanded="false" aria-controls="menu-programs-services">Programs & Services</button>
      <div class="menu-panel-section-content" id="menu-programs-services" hidden>
        <div class="menu-panel-section-content-inner">
          <a href="./programs.html#services">Services Overview</a>
          <a href="./volunteer.html">Volunteer</a>
          <a href="./food-pantry.html">Food Pantry</a>
          <a href="./financial-aid.html">Financial Aid</a>
        </div>
      </div>
    </section>
    <section class="menu-panel-section" data-menu-section>
      <button class="menu-panel-section-toggle" type="button" aria-expanded="false" aria-controls="menu-education">Education</button>
      <div class="menu-panel-section-content" id="menu-education" hidden>
        <div class="menu-panel-section-content-inner">
          <a href="./al-mizaan-academy.html">Al Mizaan Academy</a>
          <a href="./nibraas-institute.html">Nibraas Institute</a>
          <a href="./al-falah-quran-school.html">Al-Falah Quran School</a>
        </div>
      </div>
    </section>
    <section class="menu-panel-section" data-menu-section>
      <button class="menu-panel-section-toggle" type="button" aria-expanded="false" aria-controls="menu-community">Community</button>
      <div class="menu-panel-section-content" id="menu-community" hidden>
        <div class="menu-panel-section-content-inner">
          <a href="./about.html#imam">Our Imam</a>
          <a href="./about.html#contact">Contact Us</a>
        </div>
      </div>
    </section>
  `;
  button.after(panel);

  let closeTimer = null;
  let menuOpen = false;
  const disclosureTimers = new WeakMap();
  const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const finishDisclosure = (section, expanded) => {
    if ((section.dataset.expanded === "true") !== expanded) return;
    const content = section.querySelector(".menu-panel-section-content");
    if (!content) return;
    content.style.height = expanded ? "auto" : "0px";
    if (!expanded) content.hidden = true;
    disclosureTimers.delete(section);
  };

  const setDisclosureExpanded = (section, expanded, { animate = true } = {}) => {
    const toggle = section.querySelector(".menu-panel-section-toggle");
    const content = section.querySelector(".menu-panel-section-content");
    if (!toggle || !content) return;

    window.clearTimeout(disclosureTimers.get(section));
    section.dataset.expanded = String(expanded);
    toggle.setAttribute("aria-expanded", String(expanded));

    if (!animate || prefersReducedMotion()) {
      section.setAttribute("data-instant-motion", "");
      section.classList.toggle("is-expanded", expanded);
      content.hidden = !expanded;
      content.style.height = expanded ? "auto" : "0px";
      requestAnimationFrame(() => section.removeAttribute("data-instant-motion"));
      return;
    }

    content.hidden = false;
    const currentHeight = content.getBoundingClientRect().height;
    content.style.height = `${currentHeight}px`;
    void content.offsetHeight;
    section.classList.toggle("is-expanded", expanded);
    content.style.height = expanded ? `${content.scrollHeight}px` : "0px";

    disclosureTimers.set(
      section,
      window.setTimeout(() => finishDisclosure(section, expanded), 220),
    );
  };

  panel.querySelectorAll("[data-menu-section]").forEach((section) => {
    const expanded = section.classList.contains("is-expanded");
    const content = section.querySelector(".menu-panel-section-content");
    section.dataset.expanded = String(expanded);
    if (content) {
      content.hidden = !expanded;
      content.style.height = expanded ? "auto" : "0px";
      content.addEventListener("transitionend", (event) => {
        if (event.target !== content || event.propertyName !== "height") return;
        finishDisclosure(section, section.dataset.expanded === "true");
      });
    }
    section
      .querySelector(".menu-panel-section-toggle")
      ?.addEventListener("click", () => {
        const nextExpanded = section.dataset.expanded !== "true";
        setDisclosureExpanded(section, nextExpanded);
      });
  });

  const finishClose = () => {
    if (menuOpen) return;
    nav.classList.remove("menu-open");
    nav.classList.remove("menu-closing");
    panel.classList.remove("is-closing");
    panel.hidden = true;
  };

  panel.addEventListener("transitionend", (event) => {
    if (event.target === panel && event.propertyName === "opacity") finishClose();
  });

  const closeMenu = ({ animate = true } = {}) => {
    if (!menuOpen && panel.hidden) return;
    menuOpen = false;
    window.clearTimeout(closeTimer);
    if (!animate || prefersReducedMotion()) nav.setAttribute("data-instant-motion", "");
    nav.classList.add("menu-closing");
    panel.classList.remove("is-open");
    panel.classList.add("is-closing");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", "Open menu");
    if (!animate || prefersReducedMotion()) {
      finishClose();
      requestAnimationFrame(() => nav.removeAttribute("data-instant-motion"));
      return;
    }
    closeTimer = window.setTimeout(finishClose, 260);
  };

  const setMenuOpen = (isOpen, { animate = true } = {}) => {
    window.clearTimeout(closeTimer);
    if (!isOpen) {
      closeMenu({ animate });
      return;
    }

    menuOpen = true;
    if (!animate || prefersReducedMotion()) nav.setAttribute("data-instant-motion", "");
    panel.hidden = false;
    nav.classList.remove("menu-closing");
    panel.classList.remove("is-closing");
    nav.classList.add("menu-open");
    if (!animate || prefersReducedMotion()) {
      panel.classList.add("is-open");
      requestAnimationFrame(() => nav.removeAttribute("data-instant-motion"));
    } else {
      requestAnimationFrame(() => {
        if (menuOpen) panel.classList.add("is-open");
      });
    }
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
    link.addEventListener("click", () => closeMenu());
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
