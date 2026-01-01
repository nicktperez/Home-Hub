'use client';

import { useCalendarEvents } from '../hooks/useCalendarEvents';
import { Calendar, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import { useState, useEffect } from 'react';
import GlassCard from './GlassCard';

export default function CalendarWidget({ icalUrl }: { icalUrl: string }) {
    const { events, loading } = useCalendarEvents(icalUrl);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const todayEvents = events.filter(event => {
        const eventDate = new Date(event.start);
        const today = new Date();
        return eventDate.getDate() === today.getDate() &&
            eventDate.getMonth() === today.getMonth() &&
            eventDate.getFullYear() === today.getFullYear();
    }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    const [digest, setDigest] = useState<string | null>(null);

    useEffect(() => {
        if (todayEvents.length > 0) {
            fetch('/api/digest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ events: todayEvents })
            })
                .then(res => res.json())
                .then(data => setDigest(data.summary))
                .catch(err => console.error("Digest fetch error", err));
        } else {
            setDigest("No plans today. Enjoy the peace!");
        }
    }, [todayEvents.length]); // Only re-run if number of events changes to save API calls

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    };

    return (
        <GlassCard className="p-6 h-full flex flex-col relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-400/10 rounded-xl flex items-center justify-center text-emerald-600 ring-1 ring-emerald-400/20 shadow-inner shrink-0">
                    <Calendar className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-[11px] font-bold text-emerald-600 uppercase tracking-[0.2em]">
                        Today's Schedule
                    </h2>
                    <div className="text-xl font-serif font-black text-cocoa">
                        {currentTime.toLocaleDateString('en-US', { weekday: 'long' })}
                    </div>
                </div>
            </div>

            {/* AI Digest */}
            {digest && (
                <div className="mb-4 px-3 py-2 bg-emerald-400/10 rounded-lg text-xs font-medium text-emerald-800 italic border border-emerald-400/20">
                    "{digest}"
                </div>
            )}

            {/* Event List */}
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 min-h-[100px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 opacity-50">
                        <div className="w-1 h-1 bg-cocoa rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-1 h-1 bg-cocoa rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-1 h-1 bg-cocoa rounded-full animate-bounce"></div>
                    </div>
                ) : todayEvents.length > 0 ? (
                    todayEvents.map((event, idx) => (
                        <div
                            key={idx}
                            className="group/event relative pl-4 border-l-2 border-emerald-400/30 hover:border-emerald-400 transition-colors"
                        >
                            <div className="text-lg font-black text-cocoa leading-snug mb-1">
                                {event.summary}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-secondary uppercase tracking-wider">
                                {event.allDay ? (
                                    <span className="text-emerald-600">All Day</span>
                                ) : (
                                    <>
                                        <Clock className="w-3 h-3 text-emerald-600/60" />
                                        <span>{formatTime(event.start)}</span>
                                        {event.end && <span> - {formatTime(event.end)}</span>}
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                        <p className="font-handwriting text-2xl text-cocoa/50 rotate-[-2deg]">
                            No plans today...
                        </p>
                        <p className="text-xs font-bold text-cocoa/30 mt-2 uppercase tracking-widest">
                            Time to relax!
                        </p>
                    </div>
                )}
            </div>
        </GlassCard>
    );
}
