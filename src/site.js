import { initMobileNav } from "./nav.js";

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
    yearly: "Yearly",
  };

  const formatAmount = (value) => {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue <= 0) return "Custom";

    return `$${numericValue.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
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
    option.addEventListener("change", updatePaymentPanels);
  });

  form.addEventListener("input", updateSummary);
  form.addEventListener("change", updateSummary);
  updateSummary();
  updatePaymentPanels();
}

initMobileNav();
initDonationForm();
