// src/nav.js
function initMobileNav() {
  const nav = document.querySelector(".top-nav");
  const button = document.querySelector(".menu-button");
  if (!nav || !button) return;
  const panel = document.createElement("div");
  panel.className = "menu-panel";
  panel.id = "site-menu-panel";
  panel.hidden = true;
  panel.innerHTML = `
    <div class="menu-panel-section">
      <p>Education</p>
      <a href="./programs.html#al-mizan">Al Mizan Academy</a>
      <a href="./programs.html#nibraas">Nibraas Institute</a>
      <a href="./programs.html#al-falah">Al-Falah Quran School</a>
    </div>
    <div class="menu-panel-section">
      <p>Programs & Services</p>
      <a href="./programs.html#youth">Youth Programs</a>
      <a href="./programs.html#imam-classes">Imam's Classes</a>
      <a href="./programs.html#social-welfare">Social & Welfare Services</a>
      <a href="./programs.html#volunteer">Volunteer</a>
    </div>
    <div class="menu-panel-section">
      <p>Community</p>
      <a href="./calendar.html">Calendar</a>
      <a href="./news.html">Latest News</a>
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

// src/site.js
function initDonationForm() {
  const form = document.querySelector(".donation-form");
  if (!form) return;
  const amountSummary = form.querySelector("[data-summary-amount]");
  const frequencySummary = form.querySelector("[data-summary-frequency]");
  const customAmount = form.querySelector(".custom-amount input[type='number']");
  const updateSummary = () => {
    const selectedAmount = form.querySelector("input[name='amount']:checked");
    const selectedFrequency = form.querySelector("input[name='frequency']:checked");
    if (amountSummary && selectedAmount) {
      const value = selectedAmount.value === "custom" ? customAmount?.value : selectedAmount.value;
      amountSummary.textContent = value ? `$${Number(value).toLocaleString()}` : "Custom";
    }
    if (frequencySummary && selectedFrequency) {
      frequencySummary.textContent = selectedFrequency.value === "monthly" ? "Monthly" : "One-Time";
    }
  };
  form.addEventListener("input", updateSummary);
  form.addEventListener("change", updateSummary);
  updateSummary();
}
initMobileNav();
initDonationForm();
