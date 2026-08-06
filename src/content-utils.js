export const EVERGREEN_ANNOUNCEMENT_ID = "friday-announcements";

const fridayAnnouncementPattern = /\bfriday announcements?\b/i;

export function normalizeNewsItems(items, fallbackItems = []) {
  const source = Array.isArray(items) && items.length ? items : fallbackItems;
  let evergreenAssigned = false;

  return source.map((item) => {
    const normalized = { ...item };
    const isEvergreen = !evergreenAssigned && (
      normalized.id === EVERGREEN_ANNOUNCEMENT_ID
      || normalized.pinned === true
      || fridayAnnouncementPattern.test(String(normalized.title || ""))
    );

    if (isEvergreen) {
      evergreenAssigned = true;
      normalized.id = EVERGREEN_ANNOUNCEMENT_ID;
      normalized.pinned = true;
      if (!normalized.category) normalized.category = "Announcement";
    }

    return normalized;
  });
}

export function sortNewsEntries(entries, dateValue) {
  return [...entries].sort((first, second) => {
    const pinnedDifference = Number(Boolean(second.item.pinned)) - Number(Boolean(first.item.pinned));
    if (pinnedDifference) return pinnedDifference;
    return dateValue(second.item.date) - dateValue(first.item.date);
  });
}

export function newsCategory(item) {
  if (item.category) return item.category;

  const text = `${item.title || ""} ${item.summary || ""}`.toLowerCase();
  if (text.includes("ramadan") || text.includes("taraweeh")) return "Program";
  if (text.includes("youth") || text.includes("camp")) return "Youth";
  if (text.includes("eid")) return "Announcement";
  if (text.includes("program") || text.includes("workshop") || text.includes("class")) return "Program";
  if (text.includes("parking") || text.includes("arrival")) return "Notice";
  return "Announcement";
}

export function findEvergreenAnnouncement(items) {
  if (!Array.isArray(items)) return null;
  return items.find((item) => (
    item.id === EVERGREEN_ANNOUNCEMENT_ID
    || item.pinned === true
    || fridayAnnouncementPattern.test(String(item.title || ""))
  )) || null;
}

export function editableAnnouncementSnapshot(item) {
  if (!item) return "";
  return JSON.stringify({
    title: item.title || "",
    summary: item.summary || "",
    image: item.image || "",
    imageAlt: item.imageAlt || "",
    category: item.category || "Announcement",
  });
}

export function todayDateKey(date = new Date(), timeZone = "America/New_York") {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}
