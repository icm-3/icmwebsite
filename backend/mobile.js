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
    image: item.image || '',
    imageAlt: item.imageAlt || '',
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
      newsletterUrl: content.settings.newsletterUrl,
      facebook: content.settings.facebook,
      instagram: content.settings.instagram,
      youtube: content.settings.youtube,
    },
    donation: {
      title: 'Support ICM',
      description: 'Choose an amount and giving frequency on the ICM donation page. Payment processing is not connected yet.',
      buttonLabel: 'Open ICM Donation Page',
      url: '/donate.html',
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
