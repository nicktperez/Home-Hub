'use client';

import { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import { useCalendarEvents } from '../hooks/useCalendarEvents';

export default function CalendarDataView({ icalUrl }: { icalUrl: string }) {
    const { events, loading } = useCalendarEvents(icalUrl);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = [];
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    };

    const days = getDaysInMonth(currentMonth);
    const monthName = currentMonth.toLocaleString('default', { month: 'long' });
    const year = currentMonth.getFullYear();

    const getEventsForDay = (date: Date) => {
        return events.filter(event => {
            const eventDate = new Date(event.start);
            return eventDate.getFullYear() === date.getFullYear() &&
                eventDate.getMonth() === date.getMonth() &&
                eventDate.getDate() === date.getDate();
        });
    };

    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

    if (loading && events.length === 0) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-cocoa/40">
                <RefreshCw className="w-8 h-8 animate-spin" />
                <p className="font-serif italic text-lg text-cocoa/60 animate-pulse">Setting the family schedule...</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col gap-4 overflow-hidden pr-2">
            <div className="flex-1 glass-card rounded-[40px] p-6 border border-white/40 shadow-xl overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-6 px-2">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-rose/10 rounded-2xl flex items-center justify-center text-rose shadow-inner ring-1 ring-rose/20">
                            <CalendarIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-serif font-black text-cocoa">
                                {monthName}
                            </h3>
                            <p className="text-[10px] font-black text-rose uppercase tracking-[0.2em]">
                                {year}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-white/40 backdrop-blur-sm p-1.5 rounded-2xl border border-white/60 shadow-sm">
                        <button onClick={prevMonth} className="p-2 hover:bg-rose/10 rounded-xl transition-colors text-cocoa/60 hover:text-rose">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button onClick={nextMonth} className="p-2 hover:bg-rose/10 rounded-xl transition-colors text-cocoa/60 hover:text-rose">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 mb-4 border-b border-rose/10 pb-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-[10px] font-black text-rose uppercase tracking-[0.2em]">
                            {day}
                        </div>
                    ))}
                </div>

                <div
                    className="flex-1 grid grid-cols-7 gap-px bg-white/20 rounded-2xl overflow-hidden border border-white/40 min-h-0"
                    style={{
                        gridTemplateRows: `repeat(${Math.ceil(days.length / 7)}, 1fr)`
                    }}
                >
                    {days.map((date, idx) => {
                        const dayEvents = date ? getEventsForDay(date) : [];
                        const isToday = date && date.toDateString() === new Date().toDateString();
                        const hasEvents = dayEvents.length > 0;

                        return (
                            <div
                                key={idx}
                                className={clsx(
                                    "p-3 bg-white/40 transition-colors group relative flex flex-col min-h-0",
                                    !date && "bg-white/5",
                                    isToday && "ring-2 ring-rose/30 ring-inset bg-rose/5"
                                )}
                            >
                                {date && (
                                    <>
                                        <div className="flex justify-between items-start">
                                            <span className={clsx(
                                                "text-sm font-black font-sans transition-all flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full",
                                                isToday ? "text-rose bg-rose/10" : "text-cocoa/40 group-hover:text-cocoa/80",
                                                hasEvents && !isToday && "bg-emerald-400/20 text-emerald-700 shadow-[0_0_10px_rgba(52,211,153,0.3)] ring-1 ring-emerald-400/40"
                                            )}>
                                                {date.getDate()}
                                            </span>
                                        </div>
                                        <div className="mt-1 space-y-1 overflow-y-auto no-scrollbar flex-1 min-h-0">
                                            {dayEvents.map((event, eIdx) => (
                                                <div
                                                    key={eIdx}
                                                    className="text-[9px] font-bold leading-tight px-2 py-1 rounded-lg bg-sage/10 text-sage border border-sage/20 truncate shadow-sm hover:scale-105 transition-transform"
                                                    title={event.summary}
                                                >
                                                    {event.summary}
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex gap-6 px-6 py-1">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose animate-pulse"></div>
                    <span className="text-[10px] font-black text-cocoa/60 uppercase tracking-widest">Today</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400/40 shadow-[0_0_8px_rgba(52,211,153,0.4)] ring-1 ring-emerald-400/40"></div>
                    <span className="text-[10px] font-black text-cocoa/60 uppercase tracking-widest">Has Event</span>
                </div>
            </div>
        </div>
    );
}
