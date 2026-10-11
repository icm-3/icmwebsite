export const EVERGREEN_ANNOUNCEMENT_ID = "friday-announcements";

const fridayAnnouncementPattern = /\bfriday announcements?\b/i;

export function normalizeNewsItems(items, fallbackItems = []) {
  const source = Array.isArray(items) ? items : fallbackItems;
  let evergreenAssigned = false;

  return source.map((item) => {
    const normalized = { ...item };
    const isEvergreen = !evergreenAssigned && !normalized.archived && (
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
  if (item.kind === "newsletter") return "Newsletter";

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
  return items.find((item) => !item.archived && (
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
    issueDate: item.issueDate || "",
    sourceUrl: item.sourceUrl || "",
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

// Dates describe real edits, not page views. Preserve the preceding edition.
export function prepareAnnouncementSave(content, previousContent, now = new Date()) {
  const result = structuredClone(content);
  const current = findEvergreenAnnouncement(result.news);
  const previous = findEvergreenAnnouncement(previousContent?.news);
  if (!current || editableAnnouncementSnapshot(current) === editableAnnouncementSnapshot(previous)) return result;
  current.date = todayDateKey(now);
  if (previous) {
    const snapshot = editableAnnouncementSnapshot(previous);
    const alreadyArchived = result.news.some(item => item.archived && item.date === previous.date && editableAnnouncementSnapshot(item) === snapshot);
    if (!alreadyArchived) result.news.push({ ...structuredClone(previous), id: crypto.randomUUID(), pinned: false, archived: true });
  }
  return result;
}

export const announcementPin = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" role="img" aria-label="Pinned"><path d="M8 2h8a1 1 0 0 1 0 2h-1v5l3 4v2h-5v6l-1 2-1-2v-6H6v-2l3-4V4H8a1 1 0 0 1 0-2Z"/></svg>`;
