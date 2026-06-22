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
  const customAmountOption = form.querySelector("input[name='amount'][value='custom']");
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
    let matchedPreset = false;
    amountOptions.forEach((option) => {
      if (option.value === "custom") return;
      const isMatch = Number(option.value) === enteredValue;
      option.checked = isMatch;
      matchedPreset || (matchedPreset = isMatch);
    });
    if (customAmountOption) customAmountOption.checked = !matchedPreset;
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
      const isActive = panel.dataset.paymentPanel === selectedPayment.value;
      panel.hidden = !isActive;
      panel.querySelectorAll("input, select, textarea").forEach((input) => {
        input.disabled = !isActive;
      });
    });
  };
  amountOptions.forEach((option) => {
    const setPresetAmount = () => {
      if (!amountInput) return;
      option.checked = true;
      if (option.value === "custom") {
        amountInput.focus();
        updateSummary();
        return;
      }
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
function initPrayerTimesPage() {
  const title = document.querySelector("[data-prayer-month-title]");
  const status = document.querySelector("[data-prayer-status]");
  const target = document.querySelector("[data-prayer-table]");
  const monthSelect = document.querySelector("[data-prayer-month]");
  const daySelect = document.querySelector("[data-prayer-day]");
  const todayButton = document.querySelector("[data-prayer-month-today]");
  if (!target) return;
  const monthNames = {
    1: "January",
    2: "February",
    3: "March",
    4: "April",
    5: "May",
    6: "June",
    7: "July",
    8: "August",
    9: "September",
    10: "October",
    11: "November",
    12: "December",
    13: "Ramadan"
  };
  const sourceColumnCount = 13;
  const scheduleColumns = [
    { label: "Fajr", adhan: 2, iqamah: 3, colClass: "prayer-col" },
    { label: "Sunrise", single: 4, colClass: "sunrise-col" },
    { label: "Dhuhr", adhan: 5, iqamah: 6, colClass: "prayer-col" },
    { label: "Asr", adhan: 7, iqamah: 8, colClass: "prayer-col" },
    { label: "Maghrib", adhan: 9, iqamah: 10, colClass: "prayer-col" },
    { label: "Isha", adhan: 11, iqamah: 12, colClass: "prayer-col" }
  ];
  const cleanCellText = (cell) => cell.textContent.replace(/\s+/g, " ").trim();
  let selectedScheduleDate = /* @__PURE__ */ new Date();
  let loadedMonth = null;
  const longDateFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
  const datePartsFormatter = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
  const todayLabel = () => longDateFormatter.format(/* @__PURE__ */ new Date());
  const todayParts = () => datePartsFormatter.format(/* @__PURE__ */ new Date());
  const selectedParts = () => datePartsFormatter.format(selectedScheduleDate);
  const dayOptionFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
  const ramadanDayOptionFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
  const inputDateValue = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const scheduleDayValue = (date, scheduleMonth = loadedMonth || date.getMonth() + 1) => `${scheduleMonth}:${inputDateValue(date)}`;
  const updateDateControl = (scheduleMonth = loadedMonth || selectedScheduleDate.getMonth() + 1) => {
    if (daySelect) daySelect.value = scheduleDayValue(selectedScheduleDate, scheduleMonth);
  };
  const clearSelectedDay = () => {
    document.querySelectorAll(".prayer-times-table tr.is-selected-day").forEach((row) => row.classList.remove("is-selected-day"));
    if (daySelect) daySelect.value = "";
  };
  const splitDateText = (value) => {
    const match = value.match(/^(.*?, \w+ \d{1,2}, \d{4})\s+(.+)$/);
    return match ? { gregorian: match[1], hijri: match[2] } : { gregorian: value, hijri: "" };
  };
  const parseGregorianDate = (value) => {
    const date = /* @__PURE__ */ new Date(`${value} 00:00`);
    return Number.isNaN(date.getTime()) ? null : new Date(date.getFullYear(), date.getMonth(), date.getDate());
  };
  const ramadanLabel = (dateParts) => {
    const match = dateParts.hijri.match(/(\d{1,2})\s+Ramadan\s+\d{4}/);
    return match ? ` / ${match[1]} Ramadan` : "";
  };
  const scheduleTitle = (month, rowModels) => {
    if (month !== 13) return `${monthNames[month]} 2026`;
    const hijriTitle = rowModels[0]?.dateParts.hijri.match(/Ramadan\s+\d{4}/)?.[0];
    return hijriTitle || "Ramadan";
  };
  const populateDaySelect = (rowModels, month) => {
    if (!daySelect) return;
    const options = rowModels.map(({ dateParts }) => {
      const date = parseGregorianDate(dateParts.gregorian);
      if (!date) return "";
      const label = month === 13 ? `${ramadanDayOptionFormatter.format(date)}${ramadanLabel(dateParts)}` : dayOptionFormatter.format(date);
      return `<option value="${scheduleDayValue(date, month)}">${label}</option>`;
    }).filter(Boolean).join("");
    daySelect.innerHTML = `<option value="">Select day</option>${options}`;
    const selectedValue = scheduleDayValue(selectedScheduleDate, month);
    daySelect.value = [...daySelect.options].some((option) => option.value === selectedValue) ? selectedValue : "";
  };
  const findDateRow = (dateText) => [...document.querySelectorAll(".date-cell span")].find((cell) => cell.textContent.includes(dateText))?.closest("tr");
  const markSelectedDay = () => {
    document.querySelectorAll(".prayer-times-table tr.is-selected-day").forEach((row) => row.classList.remove("is-selected-day"));
    findDateRow(selectedParts())?.classList.add("is-selected-day");
  };
  const scrollToSelectedDay = () => {
    markSelectedDay();
    findDateRow(selectedParts())?.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  const renderTable = (html, month) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const rows = [...doc.querySelectorAll("table tr")].map((row) => [...row.querySelectorAll("td")].map(cleanCellText)).filter((cells) => cells.length >= sourceColumnCount);
    if (!rows.length) throw new Error("No prayer rows were returned.");
    const rowModels = rows.map((cells) => ({
      cells,
      dateParts: splitDateText(cells[0])
    }));
    if (title) title.textContent = scheduleTitle(month, rowModels);
    target.innerHTML = `
      <table class="prayer-times-table">
        <colgroup>
          <col class="date-col">
          ${scheduleColumns.map((column) => `<col class="${column.colClass}">`).join("")}
        </colgroup>
        <thead>
          <tr>
            <th>Date</th>
            ${scheduleColumns.map((column) => `<th>${column.label}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${rowModels.map(
      ({ cells, dateParts }) => {
        const isToday = dateParts.gregorian === todayLabel() || dateParts.gregorian.includes(todayParts());
        const isSelected = dateParts.gregorian.includes(selectedParts());
        const isFriday = cells[1] === "Friday";
        return `
                <tr class="${isToday ? "is-today" : ""}${isFriday ? " is-friday" : ""}${isSelected ? " is-selected-day" : ""}"${isToday ? " data-today-row" : ""}>
                  <td class="date-cell" data-label="Date"><span>${dateParts.gregorian}</span>${dateParts.hijri ? `<em>${dateParts.hijri}</em>` : ""}</td>
                  ${scheduleColumns.map((column) => {
          if (column.single) {
            return `<td class="prayer-time-cell single-time" data-label="${column.label}"><strong>${cells[column.single]}</strong></td>`;
          }
          return `
                        <td class="prayer-time-cell" data-label="${column.label}">
                          <span><b>Adhan</b><strong>${cells[column.adhan]}</strong></span>
                          <span class="iqamah-line"><b>Iqamah</b><strong>${cells[column.iqamah]}</strong></span>
                        </td>
                      `;
        }).join("")}
                </tr>
              `;
      }
    ).join("")}
        </tbody>
      </table>
    `;
    loadedMonth = month;
    populateDaySelect(rowModels, month);
  };
  const loadMonth = async (month) => {
    if (status) {
      status.hidden = false;
      status.textContent = "Loading prayer times...";
    }
    target.innerHTML = "";
    try {
      const response = await fetch(`/api/prayer-times?month=${month}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load the selected month.");
      renderTable(await response.text(), month);
      if (status) status.hidden = true;
    } catch (error) {
      if (status) status.textContent = error.message || "Could not load prayer times.";
    }
  };
  const setScheduleMonth = async (month) => {
    if (!month || month < 1 || month > 13) return;
    await loadMonth(month);
    if (monthSelect) monthSelect.value = String(month);
    clearSelectedDay();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const setScheduleDate = async (date, { scroll = true, scheduleMonth = date.getMonth() + 1 } = {}) => {
    selectedScheduleDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    updateDateControl(scheduleMonth);
    if (loadedMonth !== scheduleMonth) {
      await loadMonth(scheduleMonth);
    } else {
      markSelectedDay();
    }
    if (scroll) scrollToSelectedDay();
  };
  monthSelect?.addEventListener("change", () => {
    setScheduleMonth(Number(monthSelect.value));
  });
  daySelect?.addEventListener("change", () => {
    if (!daySelect.value) {
      clearSelectedDay();
      return;
    }
    const [scheduleMonthValue, dateValue] = daySelect.value.split(":");
    const [year, month, day] = dateValue.split("-").map(Number);
    const scheduleMonth = Number(scheduleMonthValue);
    if (!year || !month || !day || !scheduleMonth) return;
    setScheduleDate(new Date(year, month - 1, day), { scheduleMonth });
  });
  todayButton?.addEventListener("click", async () => {
    selectedScheduleDate = /* @__PURE__ */ new Date();
    const currentMonth = selectedScheduleDate.getMonth() + 1;
    updateDateControl(currentMonth);
    await loadMonth(currentMonth);
    if (monthSelect) monthSelect.value = String(currentMonth);
    const todayRow = document.querySelector("[data-today-row]") || [...document.querySelectorAll(".date-cell span")].find((cell) => cell.textContent.includes(todayParts()))?.closest("tr");
    markSelectedDay();
    todayRow?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  updateDateControl();
  loadMonth(selectedScheduleDate.getMonth() + 1).then(() => {
    if (monthSelect) monthSelect.value = "";
    clearSelectedDay();
  });
}
function initStaticFormValidation() {
  const formatPhone = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  };
  const formatMoney = (value) => {
    const cleanedValue = value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
    const [dollars = "", cents] = cleanedValue.split(".");
    const normalizedDollars = dollars.replace(/^0+(?=\d)/, "");
    if (typeof cents === "undefined") return normalizedDollars;
    return `${normalizedDollars}.${cents.slice(0, 2)}`;
  };
  const luhnValid = (value) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length < 13 || digits.length > 19) return false;
    let sum = 0;
    let doubleDigit = false;
    for (let index = digits.length - 1; index >= 0; index -= 1) {
      let digit = Number(digits[index]);
      if (doubleDigit) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      doubleDigit = !doubleDigit;
    }
    return sum % 10 === 0;
  };
  const expirationValid = (value) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length !== 4) return false;
    const month = Number(digits.slice(0, 2));
    const year = 2e3 + Number(digits.slice(2));
    if (month < 1 || month > 12) return false;
    const now = /* @__PURE__ */ new Date();
    const expiresAt = new Date(year, month, 1);
    return expiresAt > new Date(now.getFullYear(), now.getMonth(), 1);
  };
  const addFieldNotes = () => {
    document.querySelectorAll(".local-registration-form label, .form-field, .file-field").forEach((label) => {
      if (label.querySelector(".field-note")) return;
      const field = label.querySelector("input, select, textarea");
      const labelText = label.querySelector("span");
      if (!field || !labelText || field.required) return;
      const note = document.createElement("em");
      note.className = "field-note";
      note.textContent = "Optional";
      labelText.append(document.createTextNode(" "));
      labelText.append(note);
    });
    document.querySelectorAll(".service-choice-row, .option-grid").forEach((group) => {
      const labelText = group.querySelector(":scope > span");
      if (labelText?.querySelector(".field-note")) return;
      const fields = [...group.querySelectorAll("input, select, textarea")];
      if (!labelText || !fields.length) return;
      const isRequired = fields.some((field) => field.required);
      if (isRequired) return;
      const note = document.createElement("em");
      note.className = "field-note";
      note.textContent = "Optional";
      labelText.append(document.createTextNode(" "));
      labelText.append(note);
    });
  };
  const validateBoundedFields = (scope = document) => {
    scope.querySelectorAll("[data-validate='zip']").forEach((input) => {
      input.setCustomValidity(/^\d{5}$/.test(input.value) ? "" : "Enter a valid 5-digit ZIP code.");
    });
    scope.querySelectorAll("[data-validate='age']").forEach((input) => {
      if (!input.value) {
        input.setCustomValidity("");
        return;
      }
      const age = Number(input.value);
      input.setCustomValidity(Number.isInteger(age) && age >= 1 && age <= 120 ? "" : "Enter an age between 1 and 120.");
    });
    scope.querySelectorAll("[data-validate='grade']").forEach((input) => {
      const grade = Number(input.value);
      input.setCustomValidity(Number.isInteger(grade) && grade >= 1 && grade <= 12 ? "" : "Enter a grade from 1 to 12.");
    });
  };
  addFieldNotes();
  document.querySelectorAll("[data-format='phone']").forEach((input) => {
    input.addEventListener("input", () => {
      const phoneValue = formatPhone(input.value);
      if (input.value !== phoneValue) input.value = phoneValue;
    });
  });
  document.querySelectorAll("[data-format='card-number']").forEach((input) => {
    input.addEventListener("input", () => {
      const digits = input.value.replace(/\D/g, "").slice(0, 19);
      const cardValue = digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
      if (input.value !== cardValue) input.value = cardValue;
      input.setCustomValidity(luhnValid(input.value) ? "" : "Enter a valid card number.");
    });
  });
  document.querySelectorAll("[data-format='card-expiration']").forEach((input) => {
    input.addEventListener("input", () => {
      const digits = input.value.replace(/\D/g, "").slice(0, 4);
      const expirationValue = digits.length > 2 ? `${digits.slice(0, 2)} / ${digits.slice(2)}` : digits;
      if (input.value !== expirationValue) input.value = expirationValue;
      input.setCustomValidity(expirationValid(input.value) ? "" : "Enter a valid future expiration date.");
    });
  });
  document.querySelectorAll("[data-format='card-cvc']").forEach((input) => {
    input.addEventListener("input", () => {
      const cvcValue = input.value.replace(/\D/g, "").slice(0, 4);
      if (input.value !== cvcValue) input.value = cvcValue;
      input.setCustomValidity(/^\d{3,4}$/.test(input.value) ? "" : "Enter a valid security code.");
    });
  });
  document.querySelectorAll("input[inputmode='numeric']:not([data-format]), input[data-numeric-only]").forEach((input) => {
    input.addEventListener("input", () => {
      const maxLength = Number(input.getAttribute("maxlength")) || Infinity;
      const numericValue = input.value.replace(/\D/g, "").slice(0, maxLength);
      if (input.value !== numericValue) input.value = numericValue;
      validateBoundedFields(input.closest("form") || document);
    });
  });
  document.querySelectorAll("[data-format='money']").forEach((input) => {
    input.addEventListener("input", () => {
      const moneyValue = formatMoney(input.value);
      if (input.value !== moneyValue) input.value = moneyValue;
    });
  });
  document.querySelectorAll("input[type='number']").forEach((input) => {
    input.addEventListener("keydown", (event) => {
      if (["e", "E", "+", "-"].includes(event.key)) event.preventDefault();
    });
    input.addEventListener("input", () => {
      const numericValue = input.value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
      if (input.value !== numericValue) input.value = numericValue;
    });
  });
  document.querySelectorAll("form").forEach((form) => {
    const validateCustomFields = () => {
      validateBoundedFields(form);
      form.querySelectorAll("[data-format='card-number']").forEach((input) => {
        input.setCustomValidity(luhnValid(input.value) ? "" : "Enter a valid card number.");
      });
      form.querySelectorAll("[data-format='card-expiration']").forEach((input) => {
        input.setCustomValidity(expirationValid(input.value) ? "" : "Enter a valid future expiration date.");
      });
      form.querySelectorAll("[data-format='card-cvc']").forEach((input) => {
        input.setCustomValidity(/^\d{3,4}$/.test(input.value) ? "" : "Enter a valid security code.");
      });
    };
    const showFormStatus = (isError = false) => {
      let status = form.querySelector(".form-status");
      if (!status) {
        status = document.createElement("p");
        status.className = "form-status";
        status.setAttribute("role", "status");
        form.append(status);
      }
      status.classList.toggle("is-error", isError);
      status.textContent = isError ? "Please complete all required fields before submitting." : "Form validation passed. This form is ready to connect to the website submission backend.";
    };
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      validateCustomFields();
      showFormStatus(!form.reportValidity());
      if (form.reportValidity()) showFormStatus();
    });
    form.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => {
        if (button.type === "submit") return;
        validateCustomFields();
        showFormStatus(!form.reportValidity());
        if (form.reportValidity()) showFormStatus();
      });
    });
  });
}
initMobileNav();
initDonationForm();
initPrayerTimesPage();
initStaticFormValidation();
