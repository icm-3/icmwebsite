# Homepage content refresh — October 3, 2026

Verified against https://www.icmnc.org/ and the official flyers displayed there.

- Jumu’ah: the published October 2, 2026 shifts, speakers, and topics; not presented as next week's confirmed speakers.
- Love Your Prophet: https://www.icmnc.org/wp-content/uploads/2026/09/Love-your-Prophet.png — Tuesdays after Maghrib, Imam Sami Koçak, 101 Quail Fields Ct.
- Sisters Sewing: https://www.icmnc.org/wp-content/uploads/2026/05/ICMSistersSewingClass.jpeg — Wednesdays 11 AM–1:15 PM, Abida Mushtaq, 107 Quail Fields Ct.
- Sciences of the Heart: https://www.icmnc.org/wp-content/uploads/2026/09/ICM-Sciences-of-the-Heart.jpeg — October 3, Asr to Isha, Imam Mohammed Elfarooqui; included as an announcement, not a future event.

The calendar contains the next four dated occurrences of the two currently advertised weekly programs (October 6–28). They derive from the published weekly schedules, not a separate confirmation for each occurrence. No dates of publication were invented for undated flyers. Detail pages link directly to the official flyer.

Removed synthetic calendar fixtures, the forced July 4 calendar date, summer-only notices, and unverified filler announcements. The homepage no longer backfills Upcoming Events with expired items. Future content refreshes must verify the official schedule rather than perpetually extending recurring dates.

The reference banner background was obtained by removing the UI from the user-supplied reference image with image generation. This is an edited reference asset, not the unmodified original photograph. Original project photos remain intact.

## Community announcements — October 4, 2026
- Official October 2 bulletin: https://www.icmnc.org/wp-content/uploads/2026/10/Oct02-2026-FridayAnnouncements-website.jpg
- Downloaded unchanged to `public/news/icm-current/friday-oct-02-2026.jpg`; homepage pinned record has stable ID `friday-announcements`.
- Previous program posts retained as archived announcements; upcoming events remain separate.
- Local editor: editing the pinned bulletin sets `date` to the save date in America/New_York. `issueDate` separately identifies the sheet's edition. No-op/event-only edits leave its date unchanged. Previous content is retained as an archived revision.
- Verification: node --test tests/announcement-save.test.js; real local admin edit → Save → reload → file check → homepage date check; unchanged second save creates no extra revision. Temporary test content restored before deployment.
- Vercel `/api/cms` is GET-only. Hosted admin cannot publish updates; save in the local editor and redeploy. The editor warning now makes this explicit.
