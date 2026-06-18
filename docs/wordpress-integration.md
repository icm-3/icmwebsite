# WordPress Integration Contract

This frontend is intentionally ready to connect to a WordPress backend through a small JSON API layer. The UI should not need to be rebuilt when WordPress access is available.

## Recommended Integration Path

Keep the current frontend pages and replace the local API responses with WordPress-powered endpoints:

- `GET /api/cms` returns homepage, Jumu'ah, events, and news content.
- `GET /api/prayer-times?month=6` returns the monthly prayer schedule HTML or equivalent parsed data.
- Form pages can submit to WordPress form handlers later, but the current frontend validation and numeric-only behavior can stay.

This is safer than immediately converting every page into PHP templates because it preserves the current design exactly.

## `/api/cms` Shape

WordPress should output JSON in this shape:

```json
{
  "hero": {
    "image": "https://example.com/path/to/hero.jpg",
    "imageAlt": "Islamic Center of Morrisville prayer hall interior"
  },
  "jummah": {
    "dateLabel": "Friday, June 19, 2026",
    "shifts": [
      {
        "shift": "1",
        "time": "1:00 PM",
        "speaker": "Imam Name",
        "topic": "Khutbah topic"
      }
    ]
  },
  "events": [
    {
      "title": "Youth Qiyam Night",
      "date": "2026-06-27",
      "time": "9:45 PM",
      "location": "ICM Prayer Hall",
      "description": "Full event description.",
      "link": "https://example.com/register",
      "poster": "https://example.com/event-poster.jpg",
      "posterAlt": "Youth Qiyam Night poster"
    }
  ],
  "news": [
    {
      "title": "Friday Announcements - June 12, 2026",
      "date": "2026-06-12",
      "summary": "Short announcement summary.",
      "image": "https://example.com/news-image.jpg",
      "imageAlt": "Friday announcements poster"
    }
  ]
}
```

## WordPress Content Model

Suggested WordPress setup:

- Events: custom post type `icm_event`
- News and announcements: normal posts or custom post type `icm_announcement`
- Jumu'ah schedule: ACF options page or custom post type `icm_jummah_schedule`
- Hero image: ACF options page field
- Posters/images: WordPress Media Library URLs

Recommended event fields:

- `title`
- `event_date` in `YYYY-MM-DD`
- `event_time`
- `location`
- `description`
- `registration_link`
- `poster`
- `poster_alt`

Recommended news fields:

- `title`
- `publish_date`
- `summary`
- `image`
- `image_alt`

Recommended Jumu'ah fields:

- `date_label`
- repeater field `shifts`
- each shift has `shift`, `time`, `speaker`, `topic`

## Prayer Times

The local server already proxies ICM's WordPress AJAX endpoint:

```text
https://www.icmnc.org/wp-admin/admin-ajax.php
action=get_monthly_timetable
month=6
```

When the real WordPress backend is available, keep the same frontend route:

```text
/api/prayer-times?month=6
```

Then either:

- proxy the existing WordPress AJAX response, or
- expose a cleaner WordPress REST endpoint and adapt the server/API layer.

The frontend should not directly depend on WordPress internals.

## Forms

Current form pages are frontend-ready but not backend-connected:

- Donation form
- Financial aid request
- Volunteer form
- Program registration forms

Recommended WordPress approach:

- Use WordPress nonce-protected REST endpoints for submissions.
- Store submissions as private custom posts or send them to an approved form plugin.
- Keep file uploads in WordPress Media Library or a protected upload location.
- Do not collect real card data in this custom form. Use Stripe/PayPal hosted or embedded secure fields.

## Current Fallback Behavior

If `/api/cms` is unavailable, the site uses `src/default-content.js`. This is useful for local development and preview deploys.

Keep that fallback even after WordPress integration so the frontend does not go blank if the backend is temporarily unavailable.

