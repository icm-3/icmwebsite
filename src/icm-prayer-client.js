const ICM_PRAYER_ENDPOINT = "https://www.icmnc.org/wp-admin/admin-ajax.php";

export function normalizePrayerMonth(value = new Date().getMonth() + 1) {
  const month = Number(value);
  if (!Number.isInteger(month) || month < 1 || month > 13) {
    throw new Error("Month must be between 1 and 13.");
  }
  return month;
}

export async function fetchIcmMonthlyPrayerHtml(monthValue) {
  const month = normalizePrayerMonth(monthValue);
  const body = new URLSearchParams({
    action: "get_monthly_timetable",
    month: String(month),
  });

  const response = await fetch(ICM_PRAYER_ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "x-requested-with": "XMLHttpRequest",
      "referer": "https://www.icmnc.org/",
      "user-agent": "Mozilla/5.0 ICM website prayer schedule proxy",
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`ICM schedule request failed with ${response.status}`);
  }

  return response.text();
}
