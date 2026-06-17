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
  const amountInput = form.querySelector("input[name='donation-amount']");
  const amountOptions = form.querySelectorAll("input[name='amount']");
  const paymentOptions = form.querySelectorAll("input[name='payment-method']");
  const paymentPanels = form.querySelectorAll("[data-payment-panel]");
  const frequencyLabels = {
    "one-time": "One-Time",
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    yearly: "Yearly"
  };
  const formatAmount = (value) => {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue <= 0) return "Custom";
    return `$${numericValue.toLocaleString(void 0, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };
  const setAmountFitClass = (element, rawValue) => {
    if (!element) return;
    const length = String(rawValue || "").replace(/[^0-9]/g, "").length;
    element.classList.toggle("amount-compact", length > 7 && length <= 10);
    element.classList.toggle("amount-condensed", length > 10 && length <= 15);
    element.classList.toggle("amount-tight", length > 15);
  };
  const syncSelectedAmount = () => {
    if (!amountInput) return;
    const enteredValue = Number(amountInput.value);
    amountOptions.forEach((option) => {
      option.checked = Number(option.value) === enteredValue;
    });
  };
  const updateSummary = () => {
    const selectedFrequency = form.querySelector("input[name='frequency']:checked");
    if (amountSummary && amountInput) {
      amountSummary.textContent = formatAmount(amountInput.value);
      setAmountFitClass(amountSummary, amountSummary.textContent);
      setAmountFitClass(amountInput, amountInput.value);
    }
    if (frequencySummary && selectedFrequency) {
      frequencySummary.textContent = frequencyLabels[selectedFrequency.value] || selectedFrequency.value;
    }
  };
  const updatePaymentPanels = () => {
    const selectedPayment = form.querySelector("input[name='payment-method']:checked");
    if (!selectedPayment) return;
    paymentPanels.forEach((panel) => {
      panel.hidden = panel.dataset.paymentPanel !== selectedPayment.value;
    });
  };
  amountOptions.forEach((option) => {
    const setPresetAmount = () => {
      if (!amountInput) return;
      option.checked = true;
      amountInput.value = Number(option.value).toFixed(2);
      updateSummary();
    };
    option.addEventListener("change", () => {
      if (option.checked) setPresetAmount();
    });
    option.closest("label")?.addEventListener("click", setPresetAmount);
  });
  amountInput?.addEventListener("input", () => {
    syncSelectedAmount();
    updateSummary();
  });
  paymentOptions.forEach((option) => {
    const setPaymentMethod = () => {
      option.checked = true;
      updatePaymentPanels();
    };
    option.addEventListener("change", updatePaymentPanels);
    option.closest("label")?.addEventListener("click", setPaymentMethod);
  });
  form.addEventListener("input", updateSummary);
  form.addEventListener("change", updateSummary);
  updateSummary();
  updatePaymentPanels();
}
initMobileNav();
initDonationForm();
