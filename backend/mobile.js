function withSchedule(description, schedule) {
  return [description, schedule].filter(Boolean).join(' · ');
}

export function mobileContent(content) {
  const news = content.news.map(item => ({
    id: item.id,
    title: item.title,
    date: item.date,
    summary: item.summary || item.body,
    body: item.body,
    category: item.kind === 'newsletter' ? 'Newsletter' : 'Announcement',
    image: item.image,
    imageAlt: item.imageAlt,
    imageFit: 'contain',
    url: item.url,
  }));
  const events = content.events.map(item => ({
    id: `event-${item.id}`,
    title: item.title,
    date: item.date,
    summary: withSchedule(item.description, [item.time, item.location].filter(Boolean).join(' · ')),
    category: 'Event',
    image: '',
    imageAlt: '',
    imageFit: 'contain',
    url: item.url,
  }));
  const programs = content.programs.map(item => ({
    id: `program-${item.id}`,
    title: item.title,
    date: '',
    summary: withSchedule(item.description, item.schedule),
    category: item.category || 'Program',
    image: '',
    imageAlt: '',
    imageFit: 'contain',
    url: item.url,
  }));
  return {
    schemaVersion: 1,
    site: {
      name: 'Islamic Center of Morrisville',
      shortName: 'ICM',
      tagline: 'Serving Morrisville, West Cary, and RTP.',
      address: content.settings.address,
      email: content.settings.contactEmail,
      websiteUrl: 'https://www.icmnc.org/',
      newsletterUrl: content.settings.newsletterUrl,
    },
    donation: {
      title: 'Support ICM',
      description: 'Give securely through the official ICM donation page.',
      buttonLabel: 'Donate securely',
      url: content.settings.donationUrl,
    },
    news: [...news, ...events, ...programs],
    jummah: {
      dateLabel: content.jummah.dateLabel,
      shifts: content.jummah.shifts.map((shift, index) => ({
        id: `jummah-${index + 1}`,
        ...shift,
        location: content.settings.address,
      })),
    },
    prayerTimes: { apiUrl: '/api/prayers' },
  };
}
