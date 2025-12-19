'use client';

import { useState, useEffect, useCallback } from 'react';

export interface CalendarEvent {
    summary: string;
    start: Date;
    end: Date;
    allDay: boolean;
}

export function useCalendarEvents(icalUrl: string) {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const parseICS = useCallback((text: string) => {
        const events: CalendarEvent[] = [];
        // Handle line folding and normalize line endings
        const normalized = text.replace(/\r\n\s+/g, '').replace(/\n\s+/g, '').replace(/\r\n/g, '\n');
        const vevents = normalized.split('BEGIN:VEVENT');
        vevents.shift();

        vevents.forEach(vevent => {
            const summaryMatch = vevent.match(/SUMMARY:(.*)/);
            const dtStartMatch = vevent.match(/DTSTART(?:;[^:]*)?:(.*)/);
            const dtEndMatch = vevent.match(/DTEND(?:;[^:]*)?:(.*)/);

            if (summaryMatch && dtStartMatch) {
                const summary = summaryMatch[1].trim()
                    .replace(/\\,/g, ',')
                    .replace(/\\;/g, ';')
                    .replace(/\\n/g, '\n');
                const startStr = dtStartMatch[1].trim();
                const endStr = dtEndMatch ? dtEndMatch[1].trim() : startStr;

                const parseDate = (str: string) => {
                    const cleanStr = str.replace(/[^0-9T]/g, '');

                    if (cleanStr.length === 8) { // YYYYMMDD
                        const y = parseInt(cleanStr.substring(0, 4));
                        const m = parseInt(cleanStr.substring(4, 6)) - 1;
                        const d = parseInt(cleanStr.substring(6, 8));
                        return { date: new Date(y, m, d), allDay: true };
                    } else if (cleanStr.includes('T')) {
                        const y = parseInt(cleanStr.substring(0, 4));
                        const m = parseInt(cleanStr.substring(4, 6)) - 1;
                        const d = parseInt(cleanStr.substring(6, 8));
                        const h = parseInt(cleanStr.substring(9, 11));
                        const min = parseInt(cleanStr.substring(11, 13));
                        const s = parseInt(cleanStr.substring(13, 15));

                        if (str.endsWith('Z')) {
                            return { date: new Date(Date.UTC(y, m, d, h, min, s)), allDay: false };
                        } else {
                            return { date: new Date(y, m, d, h, min, s), allDay: false };
                        }
                    }
                    return null;
                };

                const startInfo = parseDate(startStr);
                const endInfo = parseDate(endStr);

                if (startInfo) {
                    events.push({
                        summary,
                        start: startInfo.date,
                        end: endInfo?.date || startInfo.date,
                        allDay: startInfo.allDay
                    });
                }
            }
        });

        setEvents(events);
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const proxyUrl = `/api/calendar?url=${encodeURIComponent(icalUrl)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error('Failed to fetch calendar data');
            const icalText = await response.text();
            parseICS(icalText);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    }, [icalUrl, parseICS]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000 * 15);
        return () => clearInterval(interval);
    }, [fetchData]);

    return { events, loading, error, refresh: fetchData };
}
