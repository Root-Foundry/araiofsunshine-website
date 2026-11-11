// schema.org Event markup for upcoming events, so search engines can list the meetings.
// Used by index.html and events.html with the event docs admins enter on admin-events.html
// ({ title, date: 'YYYY-MM-DD', time: 'HH:MM', location, description }).

const ORGANIZER = { '@type': 'NGO', name: 'A Rai of Sunshine of North Florida Inc.', url: 'https://araiofsunshine.org/' };
const DEFAULT_ADDRESS = '850 N. Jefferson Street, Unit 805, Monticello, FL 32344';

/** "2026-12-05" + "15:00" -> "2026-12-05T15:00:00-05:00", in Monticello's time zone (daylight saving included). */
function startDate(date, time) {
    if (!/^\d{2}:\d{2}$/.test(time || '')) return date;
    const offset = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', timeZoneName: 'longOffset' })
        .formatToParts(new Date(`${date}T12:00:00Z`))
        .find((p) => p.type === 'timeZoneName').value.replace('GMT', '');
    return `${date}T${time}:00${offset}`;
}

export function addEventSchema(events) {
    const today = new Date().toISOString().split('T')[0];
    const upcoming = events.filter((e) => e.title && /^\d{4}-\d{2}-\d{2}$/.test(e.date || '') && e.date >= today).slice(0, 20);
    if (!upcoming.length) return;

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(upcoming.map((e) => ({
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: e.title,
        startDate: startDate(e.date, e.time),
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: { '@type': 'Place', name: e.location || 'A Rai of Sunshine', address: e.location || DEFAULT_ADDRESS },
        description: e.description || undefined,
        organizer: ORGANIZER,
        url: 'https://araiofsunshine.org/events',
    })));
    document.head.appendChild(script);
}
