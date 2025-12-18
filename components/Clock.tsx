'use client';

import { useState, useEffect } from 'react';
import { clsx } from 'clsx';

const GREETINGS = [
    "Good morning, Sunshine!",
    "Ready to tackle the day?",
    "Hope your coffee is strong!",
    "Living the dream!",
    "You're doing great, Mom!",
    "Time for a little 'me' time?",
    "Good afternoon, lovely!",
    "Almost wine o'clock?",
    "Sweet dreams tonight!",
];

export default function Clock() {
    const [time, setTime] = useState<Date | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [greetingIndex, setGreetingIndex] = useState(0);

    useEffect(() => {
        setIsMounted(true);
        setTime(new Date());
        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);

        // Rotate greeting every hour
        setGreetingIndex(Math.floor(Math.random() * GREETINGS.length));
        const greetingTimer = setInterval(() => {
            setGreetingIndex(Math.floor(Math.random() * GREETINGS.length));
        }, 3600000);

        return () => {
            clearInterval(timer);
            clearInterval(greetingTimer);
        };
    }, []);

    if (!isMounted || !time) {
        return (
            <div className="p-4 bg-white/20 border border-white/30 rounded-2xl text-center h-[140px] animate-pulse flex flex-col justify-center">
                <div className="h-10 bg-white/30 rounded mb-4 w-3/4 mx-auto"></div>
                <div className="h-4 bg-white/30 rounded w-1/2 mx-auto"></div>
            </div>
        );
    }

    const hoursNum = time.getHours();
    const ampm = hoursNum >= 12 ? 'pm' : 'am';
    const displayHours = hoursNum % 12 || 12;
    const minutes = String(time.getMinutes()).padStart(2, '0');
    const seconds = String(time.getSeconds()).padStart(2, '0');

    const dateStr = time.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });

    const greeting = GREETINGS[greetingIndex];

    return (
        <div className={clsx(
            "glass-card p-8 rounded-3xl text-center",
            "flex flex-col justify-center gap-4 transition-all duration-500"
        )}>
            <div className="text-sm font-serif italic text-rose font-semibold tracking-wide">
                {greeting}
            </div>
            <div className={clsx(
                "text-6xl font-serif font-bold text-cocoa",
                "flex items-baseline justify-center"
            )}>
                <span>{displayHours}</span>
                <span className="animate-pulse mx-1 opacity-50">:</span>
                <span>{minutes}</span>
                <span className="text-2xl ml-2 font-sans font-light text-rose/80 lowercase">{ampm}</span>
            </div>
            <div className="text-base font-medium text-secondary tracking-tight">
                {dateStr}
            </div>
        </div>
    );
}
