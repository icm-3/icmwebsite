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
