import { initMobileNav } from "./nav.js";

const datePickerWeekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const datePickerMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const datePickerCloseTimers = new WeakMap();

function showDatePicker(picker) {
  window.clearTimeout(datePickerCloseTimers.get(picker));
  picker.hidden = false;
  picker.classList.remove("is-closing");
  requestAnimationFrame(() => {
    picker.classList.add("is-open");
  });
}

function hideDatePicker(picker) {
  if (picker.hidden) return;
  window.clearTimeout(datePickerCloseTimers.get(picker));
  picker.classList.remove("is-open");
  picker.classList.add("is-closing");
  const timer = window.setTimeout(() => {
    if (!picker.classList.contains("is-open")) {
      picker.hidden = true;
      picker.classList.remove("is-closing");
    }
  }, 190);
  datePickerCloseTimers.set(picker, timer);
}

function toggleDatePicker(picker, openPicker) {
  if (picker.hidden || !picker.classList.contains("is-open")) {
    openPicker();
  } else {
    hideDatePicker(picker);
  }
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateInputValue(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatPickerMonth(date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function formatPickerDayLabel(date) {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function renderDatePickerPopover(picker, monthDate, selectedValue = "", options = {}) {
  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
  const visibleDayCount = Math.ceil((monthStart.getDay() + daysInMonth) / 7) * 7;
  const firstGridDate = new Date(monthStart);
  firstGridDate.setDate(firstGridDate.getDate() - firstGridDate.getDay());
  const todayKey = dateKey(new Date());
  const currentYear = new Date().getFullYear();
  const firstBirthYear = currentYear - 120;
  const lastBirthYear = currentYear;
  const monthControl = options.yearSelect
    ? `
      <div class="date-picker-selects">
        <select data-date-picker-month-select aria-label="Birth month">
          ${datePickerMonths.map((month, index) => `<option value="${index}"${index === monthStart.getMonth() ? " selected" : ""}>${month}</option>`).join("")}
        </select>
        <select data-date-picker-year-select aria-label="Birth year">
          ${Array.from({ length: lastBirthYear - firstBirthYear + 1 }, (_, index) => lastBirthYear - index)
            .map((year) => `<option value="${year}"${year === monthStart.getFullYear() ? " selected" : ""}>${year}</option>`)
            .join("")}
        </select>
      </div>
    `
    : `<strong>${formatPickerMonth(monthStart)}</strong>`;

  picker.innerHTML = `
    <div class="date-picker-toolbar">
      <button type="button" data-date-picker-month="prev" aria-label="Previous month">
        <img src="/public/icons/chevron-left.svg" alt="" aria-hidden="true">
      </button>
      ${monthControl}
      <button type="button" data-date-picker-month="next" aria-label="Next month">
        <img src="/public/icons/chevron-right.svg" alt="" aria-hidden="true">
      </button>
    </div>
    <div class="date-picker-weekdays">${datePickerWeekdays.map((day) => `<span>${day}</span>`).join("")}</div>
    <div class="date-picker-grid">
      ${Array.from({ length: visibleDayCount }, (_, index) => {
        const date = new Date(firstGridDate);
        date.setDate(firstGridDate.getDate() + index);
        const key = dateKey(date);
        return `
          <button
            type="button"
            class="${date.getMonth() !== monthStart.getMonth() ? "is-muted" : ""}${key === todayKey ? " is-today" : ""}${key === selectedValue ? " is-selected" : ""}"
            data-date-picker-day="${key}"
            aria-label="${formatPickerDayLabel(date)}"
          >${date.getDate()}</button>
        `;
      }).join("")}
    </div>
    <div class="date-picker-actions">
      <button type="button" data-date-picker-today>Today</button>
    </div>
  `;
}

function initCustomDateInputs() {
  document.querySelectorAll("input[type='date']").forEach((input) => {
    if (input.dataset.customDateReady === "true") return;
    input.dataset.customDateReady = "true";
    const isBirthdate = input.name === "birthdate" || input.autocomplete === "bday";

    const shell = document.createElement("span");
    shell.className = "date-input-shell";
    input.before(shell);
    shell.append(input);

    input.type = "text";
    input.inputMode = "text";
    input.placeholder = "YYYY-MM-DD";
    input.pattern = "\\d{4}-\\d{2}-\\d{2}";
    input.autocomplete = "off";
    input.dataset.format = "date";

    const button = document.createElement("button");
    button.className = "date-input-button";
    button.type = "button";
    button.setAttribute("aria-label", "Open date picker");
    button.innerHTML = `<img src="/public/icons/calendar.svg" alt="" aria-hidden="true">`;
    shell.append(button);

    const picker = document.createElement("div");
    picker.className = `date-picker-popover form-date-picker-popover${isBirthdate ? " birthdate-picker-popover" : ""}`;
    picker.hidden = true;
    shell.append(picker);

    let pickerMonth = parseDateInputValue(input.value) || new Date();
    pickerMonth = new Date(pickerMonth.getFullYear(), pickerMonth.getMonth(), 1);

    const openPicker = () => {
      const selectedDate = parseDateInputValue(input.value);
      const targetDate = selectedDate || new Date();
      pickerMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      renderDatePickerPopover(picker, pickerMonth, input.value, { yearSelect: isBirthdate });
      showDatePicker(picker);
    };

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleDatePicker(picker, openPicker);
    });

    input.addEventListener("focus", openPicker);

    let pickerPointerHandled = false;
    const handlePickerAction = (event) => {
      event.stopPropagation();
      const monthButton = event.target.closest("[data-date-picker-month]");
      if (monthButton) {
        event.preventDefault();
        if (event.type === "click" && pickerPointerHandled) {
          pickerPointerHandled = false;
          return;
        }
        if (event.type === "pointerdown") pickerPointerHandled = true;
        pickerMonth = new Date(pickerMonth);
        pickerMonth.setMonth(pickerMonth.getMonth() + (monthButton.dataset.datePickerMonth === "next" ? 1 : -1));
        renderDatePickerPopover(picker, pickerMonth, input.value, { yearSelect: isBirthdate });
        showDatePicker(picker);
        return;
      }

      const dayButton = event.target.closest("[data-date-picker-day]");
      if (dayButton) {
        input.value = dayButton.dataset.datePickerDay;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
        hideDatePicker(picker);
        return;
      }

      if (event.target.closest("[data-date-picker-today]")) {
        const today = new Date();
        pickerMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        input.value = dateKey(today);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
        hideDatePicker(picker);
        return;
      }

    };

    picker.addEventListener("change", (event) => {
      const monthSelect = event.target.closest("[data-date-picker-month-select]");
      const yearSelect = event.target.closest("[data-date-picker-year-select]");
      if (!monthSelect && !yearSelect) return;
      event.stopPropagation();
      const nextMonth = Number(picker.querySelector("[data-date-picker-month-select]")?.value ?? pickerMonth.getMonth());
      const nextYear = Number(picker.querySelector("[data-date-picker-year-select]")?.value ?? pickerMonth.getFullYear());
      pickerMonth = new Date(
        Number.isNaN(nextYear) ? pickerMonth.getFullYear() : nextYear,
        Number.isNaN(nextMonth) ? pickerMonth.getMonth() : nextMonth,
        1,
      );
      renderDatePickerPopover(picker, pickerMonth, input.value, { yearSelect: isBirthdate });
      showDatePicker(picker);
    });

    picker.addEventListener("pointerdown", (event) => {
      if (!event.target.closest("[data-date-picker-month]")) return;
      handlePickerAction(event);
    });

    picker.addEventListener("click", handlePickerAction);

    document.addEventListener("click", (event) => {
      if (shell.contains(event.target)) return;
      hideDatePicker(picker);
    });
  });
}

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
  if (amountInput) {
    amountInput.type = "text";
    amountInput.inputMode = "decimal";
    amountInput.autocomplete = "off";
  }
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
      matchedPreset ||= isMatch;
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
    13: "Ramadan",
  };
  const sourceColumnCount = 13;
  const scheduleColumns = [
    { label: "Fajr", adhan: 2, iqamah: 3, colClass: "prayer-col" },
    { label: "Sunrise", single: 4, colClass: "sunrise-col" },
    { label: "Dhuhr", adhan: 5, iqamah: 6, colClass: "prayer-col" },
    { label: "Asr", adhan: 7, iqamah: 8, colClass: "prayer-col" },
    { label: "Maghrib", adhan: 9, iqamah: 10, colClass: "prayer-col" },
    { label: "Isha", adhan: 11, iqamah: 12, colClass: "prayer-col" },
  ];

  const cleanCellText = (cell) => cell.textContent.replace(/\s+/g, " ").trim();
  let selectedScheduleDate = new Date();
  let loadedMonth = null;

  const longDateFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const datePartsFormatter = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const todayLabel = () => longDateFormatter.format(new Date());
  const todayParts = () => datePartsFormatter.format(new Date());
  const selectedParts = () => datePartsFormatter.format(selectedScheduleDate);
  const dayOptionFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const ramadanDayOptionFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
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
    const date = new Date(`${value} 00:00`);
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
    const options = rowModels
      .map(({ dateParts }) => {
        const date = parseGregorianDate(dateParts.gregorian);
        if (!date) return "";
        const label = month === 13 ? `${ramadanDayOptionFormatter.format(date)}${ramadanLabel(dateParts)}` : dayOptionFormatter.format(date);
        return `<option value="${scheduleDayValue(date, month)}">${label}</option>`;
      })
      .filter(Boolean)
      .join("");
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
    const rows = [...doc.querySelectorAll("table tr")]
      .map((row) => [...row.querySelectorAll("td")].map(cleanCellText))
      .filter((cells) => cells.length >= sourceColumnCount);

    if (!rows.length) throw new Error("No prayer rows were returned.");
    const rowModels = rows.map((cells) => ({
      cells,
      dateParts: splitDateText(cells[0]),
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
          ${rowModels
            .map(
              ({ cells, dateParts }) => {
                const isToday = dateParts.gregorian === todayLabel() || dateParts.gregorian.includes(todayParts());
                const isSelected = dateParts.gregorian.includes(selectedParts());
                const isFriday = cells[1] === "Friday";
                return `
                <tr class="${isToday ? "is-today" : ""}${isFriday ? " is-friday" : ""}${isSelected ? " is-selected-day" : ""}"${isToday ? " data-today-row" : ""}>
                  <td class="date-cell" data-label="Date"><span>${dateParts.gregorian}</span>${dateParts.hijri ? `<em>${dateParts.hijri}</em>` : ""}</td>
                  ${scheduleColumns
                    .map((column) => {
                      if (column.single) {
                        return `<td class="prayer-time-cell single-time" data-label="${column.label}"><strong>${cells[column.single]}</strong></td>`;
                      }
                      return `
                        <td class="prayer-time-cell" data-label="${column.label}">
                          <span><b>Adhan</b><strong>${cells[column.adhan]}</strong></span>
                          <span class="iqamah-line"><b>Iqamah</b><strong>${cells[column.iqamah]}</strong></span>
                        </td>
                      `;
                    })
                    .join("")}
                </tr>
              `;
              },
            )
            .join("")}
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
    selectedScheduleDate = new Date();
    const currentMonth = selectedScheduleDate.getMonth() + 1;
    updateDateControl(currentMonth);
    await loadMonth(currentMonth);
    if (monthSelect) monthSelect.value = String(currentMonth);
    const todayRow =
      document.querySelector("[data-today-row]") ||
      [...document.querySelectorAll(".date-cell span")].find((cell) => cell.textContent.includes(todayParts()))?.closest("tr");
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
    const cleanedValue = value
      .replace(/[^\d.]/g, "")
      .replace(/(\..*)\./g, "$1");
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
    const year = 2000 + Number(digits.slice(2));
    if (month < 1 || month > 12) return false;
    const now = new Date();
    const expiresAt = new Date(year, month, 1);
    return expiresAt > new Date(now.getFullYear(), now.getMonth(), 1);
  };

  const addFieldNotes = () => {
    document.querySelectorAll(".local-registration-form label, .form-field, .file-field").forEach((label) => {
      if (label.querySelector(".field-note")) return;
      const field = label.querySelector("input, select, textarea");
      const labelText = label.querySelector("span");
      if (labelText?.querySelector("em")) return;
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

  const enableToggleableAgeRange = () => {
    document.querySelectorAll("input[type='radio'][name='age-range']").forEach((input) => {
      const label = input.closest("label");
      const rememberCheckedState = () => {
        input.dataset.wasChecked = input.checked ? "true" : "false";
      };
      label?.addEventListener("pointerdown", rememberCheckedState);
      label?.addEventListener("touchstart", rememberCheckedState, { passive: true });
      label?.addEventListener(
        "click",
        (event) => {
          if (input.dataset.wasChecked !== "true") return;
          event.preventDefault();
          input.checked = false;
          input.dataset.wasChecked = "false";
          input.dispatchEvent(new Event("change", { bubbles: true }));
        },
        true,
      );
    });
  };

  const initStateCityFields = () => {
    document.querySelectorAll("select[name='state']").forEach((stateSelect) => {
      const form = stateSelect.closest("form");
      const citySelect = form?.querySelector("select[name='city']");
      if (!citySelect || citySelect.dataset.stateCityReady === "true") return;
      citySelect.dataset.stateCityReady = "true";
      const cityOptionsByState = {
        Alabama: ["Birmingham", "Montgomery", "Huntsville", "Mobile", "Tuscaloosa", "Other"],
        Alaska: ["Anchorage", "Fairbanks", "Juneau", "Wasilla", "Sitka", "Other"],
        Arizona: ["Phoenix", "Tucson", "Mesa", "Chandler", "Scottsdale", "Other"],
        Arkansas: ["Little Rock", "Fayetteville", "Fort Smith", "Springdale", "Jonesboro", "Other"],
        California: ["Los Angeles", "San Diego", "San Jose", "San Francisco", "Sacramento", "Other"],
        Colorado: ["Denver", "Colorado Springs", "Aurora", "Fort Collins", "Boulder", "Other"],
        Connecticut: ["Bridgeport", "New Haven", "Stamford", "Hartford", "Waterbury", "Other"],
        Delaware: ["Wilmington", "Dover", "Newark", "Middletown", "Smyrna", "Other"],
        "District of Columbia": ["Washington", "Other"],
        Florida: ["Jacksonville", "Miami", "Tampa", "Orlando", "Tallahassee", "Other"],
        Georgia: ["Atlanta", "Augusta", "Columbus", "Savannah", "Athens", "Other"],
        Hawaii: ["Honolulu", "Hilo", "Kailua", "Kapolei", "Kaneohe", "Other"],
        Idaho: ["Boise", "Meridian", "Nampa", "Idaho Falls", "Pocatello", "Other"],
        Illinois: ["Chicago", "Aurora", "Naperville", "Joliet", "Springfield", "Other"],
        Indiana: ["Indianapolis", "Fort Wayne", "Evansville", "South Bend", "Carmel", "Other"],
        Iowa: ["Des Moines", "Cedar Rapids", "Davenport", "Sioux City", "Iowa City", "Other"],
        Kansas: ["Wichita", "Overland Park", "Kansas City", "Topeka", "Olathe", "Other"],
        Kentucky: ["Louisville", "Lexington", "Bowling Green", "Owensboro", "Covington", "Other"],
        Louisiana: ["New Orleans", "Baton Rouge", "Shreveport", "Lafayette", "Lake Charles", "Other"],
        Maine: ["Portland", "Lewiston", "Bangor", "South Portland", "Auburn", "Other"],
        Maryland: ["Baltimore", "Frederick", "Rockville", "Gaithersburg", "Bowie", "Other"],
        Massachusetts: ["Boston", "Worcester", "Springfield", "Cambridge", "Lowell", "Other"],
        Michigan: ["Detroit", "Grand Rapids", "Warren", "Ann Arbor", "Lansing", "Other"],
        Minnesota: ["Minneapolis", "Saint Paul", "Rochester", "Duluth", "Bloomington", "Other"],
        Mississippi: ["Jackson", "Gulfport", "Southaven", "Biloxi", "Hattiesburg", "Other"],
        Missouri: ["Kansas City", "St. Louis", "Springfield", "Columbia", "Independence", "Other"],
        Montana: ["Billings", "Missoula", "Great Falls", "Bozeman", "Helena", "Other"],
        Nebraska: ["Omaha", "Lincoln", "Bellevue", "Grand Island", "Kearney", "Other"],
        Nevada: ["Las Vegas", "Henderson", "Reno", "North Las Vegas", "Sparks", "Other"],
        "New Hampshire": ["Manchester", "Nashua", "Concord", "Dover", "Rochester", "Other"],
        "New Jersey": ["Newark", "Jersey City", "Paterson", "Elizabeth", "Edison", "Other"],
        "New Mexico": ["Albuquerque", "Las Cruces", "Rio Rancho", "Santa Fe", "Roswell", "Other"],
        "New York": ["New York", "Buffalo", "Rochester", "Yonkers", "Syracuse", "Other"],
        "North Carolina": ["Morrisville", "Cary", "Apex", "Raleigh", "Durham", "Wake Forest", "Chapel Hill", "Charlotte", "Greensboro", "Other"],
        "North Dakota": ["Fargo", "Bismarck", "Grand Forks", "Minot", "West Fargo", "Other"],
        Ohio: ["Columbus", "Cleveland", "Cincinnati", "Toledo", "Akron", "Other"],
        Oklahoma: ["Oklahoma City", "Tulsa", "Norman", "Broken Arrow", "Edmond", "Other"],
        Oregon: ["Portland", "Eugene", "Salem", "Gresham", "Hillsboro", "Other"],
        Pennsylvania: ["Philadelphia", "Pittsburgh", "Allentown", "Erie", "Reading", "Other"],
        "Rhode Island": ["Providence", "Warwick", "Cranston", "Pawtucket", "East Providence", "Other"],
        "South Carolina": ["Charleston", "Columbia", "North Charleston", "Mount Pleasant", "Rock Hill", "Other"],
        "South Dakota": ["Sioux Falls", "Rapid City", "Aberdeen", "Brookings", "Watertown", "Other"],
        Tennessee: ["Nashville", "Memphis", "Knoxville", "Chattanooga", "Murfreesboro", "Other"],
        Texas: ["Houston", "San Antonio", "Dallas", "Austin", "Fort Worth", "Other"],
        Utah: ["Salt Lake City", "West Valley City", "Provo", "West Jordan", "Orem", "Other"],
        Vermont: ["Burlington", "South Burlington", "Rutland", "Barre", "Montpelier", "Other"],
        Virginia: ["Virginia Beach", "Chesapeake", "Norfolk", "Richmond", "Arlington", "Other"],
        Washington: ["Seattle", "Spokane", "Tacoma", "Vancouver", "Bellevue", "Other"],
        "West Virginia": ["Charleston", "Huntington", "Morgantown", "Parkersburg", "Wheeling", "Other"],
        Wisconsin: ["Milwaukee", "Madison", "Green Bay", "Kenosha", "Racine", "Other"],
        Wyoming: ["Cheyenne", "Casper", "Laramie", "Gillette", "Rock Springs", "Other"],
      };
      const renderOptions = (options, selectedValue = "") => {
        citySelect.innerHTML = `<option value="">Please select</option>${options
          .map((city) => `<option${city === selectedValue ? " selected" : ""}>${city}</option>`)
          .join("")}`;
      };
      const syncCityOptions = () => {
        const currentValue = citySelect.value;
        const stateCities = cityOptionsByState[stateSelect.value];
        if (stateCities) {
          renderOptions(stateCities, stateCities.includes(currentValue) ? currentValue : "");
        } else {
          renderOptions([]);
        }
      };
      stateSelect.addEventListener("change", syncCityOptions);
      syncCityOptions();
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
  enableToggleableAgeRange();
  initStateCityFields();

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
      const numericValue = input.value
        .replace(/[^\d.]/g, "")
        .replace(/(\..*)\./g, "$1");
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
      status.textContent = isError
        ? "Please complete all required fields before submitting."
        : "Form validation passed. This form is ready to connect to the website submission backend.";
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
initCustomDateInputs();
initDonationForm();
initPrayerTimesPage();
initStaticFormValidation();
