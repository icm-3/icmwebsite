const responsiveMedia = new Map([
  [
    "/public/news/friday-announcements-june-12-2026.png",
    {
      width: 1920,
      height: 1080,
      src: "./public/news/responsive/friday-announcements-june-12-2026-20260806-960.webp",
      srcset: "./public/news/responsive/friday-announcements-june-12-2026-20260806-320.webp 320w, ./public/news/responsive/friday-announcements-june-12-2026-20260806-960.webp 960w",
    },
  ],
  [
    "/public/news/womens-eid-2026.png",
    {
      width: 831,
      height: 994,
      src: "./public/news/responsive/womens-eid-2026-20260806-831.webp",
      srcset: "./public/news/responsive/womens-eid-2026-20260806-320.webp 320w, ./public/news/responsive/womens-eid-2026-20260806-831.webp 831w",
    },
  ],
  [
    "/public/news/icm-live/henna-beginner-class.png",
    {
      width: 1545,
      height: 1999,
      src: "./public/news/responsive/henna-beginner-class-20260806-960.webp",
      srcset: "./public/news/responsive/henna-beginner-class-20260806-320.webp 320w, ./public/news/responsive/henna-beginner-class-20260806-960.webp 960w",
    },
  ],
  [
    "/public/news/icm-live/friday-bukhari-circle.jpeg",
    {
      width: 1024,
      height: 1536,
      src: "./public/news/responsive/friday-bukhari-circle-20260806-960.webp",
      srcset: "./public/news/responsive/friday-bukhari-circle-20260806-320.webp 320w, ./public/news/responsive/friday-bukhari-circle-20260806-960.webp 960w",
    },
  ],
  [
    "/public/news/icm-live/summer-quran-islamic-studies.png",
    {
      width: 1545,
      height: 1999,
      src: "./public/news/responsive/summer-quran-islamic-studies-20260806-960.webp",
      srcset: "./public/news/responsive/summer-quran-islamic-studies-20260806-320.webp 320w, ./public/news/responsive/summer-quran-islamic-studies-20260806-960.webp 960w",
    },
  ],
  [
    "/public/news/icm-live/sisters-zumba-fitness.png",
    {
      width: 1545,
      height: 1999,
      src: "./public/news/responsive/sisters-zumba-fitness-20260806-960.webp",
      srcset: "./public/news/responsive/sisters-zumba-fitness-20260806-320.webp 320w, ./public/news/responsive/sisters-zumba-fitness-20260806-960.webp 960w",
    },
  ],
  [
    "/public/news/icm-live/friday-announcements-june-19-2026.png",
    {
      width: 1920,
      height: 1080,
      src: "./public/news/responsive/friday-announcements-june-19-2026-20260806-960.webp",
      srcset: "./public/news/responsive/friday-announcements-june-19-2026-20260806-320.webp 320w, ./public/news/responsive/friday-announcements-june-19-2026-20260806-960.webp 960w",
    },
  ],
  [
    "/public/news/icm-live/volunteer-icm-youth.jpeg",
    {
      width: 1080,
      height: 1350,
      src: "./public/news/responsive/volunteer-icm-youth-20260806-960.webp",
      srcset: "./public/news/responsive/volunteer-icm-youth-20260806-320.webp 320w, ./public/news/responsive/volunteer-icm-youth-20260806-960.webp 960w",
    },
  ],
]);

function mediaPath(source) {
  try {
    return new URL(String(source || ""), "https://icm.local").pathname;
  } catch {
    return "";
  }
}

export function getResponsiveMedia(source) {
  const original = String(source || "");
  const optimized = responsiveMedia.get(mediaPath(original));
  if (!optimized) return { src: original, srcset: "", width: 0, height: 0 };
  return optimized;
}
