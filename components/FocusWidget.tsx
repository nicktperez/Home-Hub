'use client';

import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { clsx } from 'clsx';

const INTENTIONS = [
    "Choose Kindness",
    "Practice Gratitude",
    "Stay Present",
    "Find Joy in Small Things",
    "Listen with Heart",
    "Be Patient with Yourself",
    "Spread Light",
    "Breathe Deeply",
    "Seek Balance",
    "Act with Love",
    "Cultivate Peace",
    "Keep Growing",
    "Embrace the Mess",
    "Find Magic in the Ordinary",
    "Trust the Journey"
];

export default function FocusWidget() {
    const [intention, setIntention] = useState('');
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        // Set a random intention on mount
        setIntention(INTENTIONS[Math.floor(Math.random() * INTENTIONS.length)]);

        // Rotate every 4 hours for a "daily rhythm" feel
        const interval = setInterval(() => {
            setIntention(INTENTIONS[Math.floor(Math.random() * INTENTIONS.length)]);
        }, 14400000);

        return () => clearInterval(interval);
    }, []);

    if (!isMounted) {
        return (
            <div className="glass-card rounded-3xl p-8 min-h-[200px] flex flex-col items-center justify-center animate-pulse">
                <div className="h-4 bg-rose/10 rounded w-1/2 mb-4" />
                <div className="h-10 bg-rose/10 rounded w-3/4" />
            </div>
        );
    }

    return (
        <div className="glass-card rounded-3xl p-8 h-full flex flex-col items-center justify-center relative overflow-hidden group transition-all duration-700 hover:bg-white/90">
            {/* Soft decorative element */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-rose/5 rounded-full blur-3xl group-hover:bg-rose/10 transition-colors duration-700" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-sage/5 rounded-full blur-3xl group-hover:bg-sage/10 transition-colors duration-700" />

            <h2 className="text-[11px] font-bold mb-6 flex items-center gap-3 text-rose uppercase tracking-[0.25em]">
                <Sparkles className="w-3.5 h-3.5 text-terracotta animate-pulse" />
                Daily Intention
                <Sparkles className="w-3.5 h-3.5 text-terracotta animate-pulse" />
            </h2>

            <div className="w-full text-center transform transition-all duration-1000 group-hover:scale-105">
                <p className="text-5xl font-serif font-bold text-cocoa leading-tight italic tracking-tight drop-shadow-sm">
                    "{intention}"
                </p>
                <div className="mt-6 flex justify-center gap-1.5 opacity-30 group-hover:opacity-50 transition-opacity">
                    <div className="w-1.5 h-1.5 rounded-full bg-terracotta" />
                    <div className="w-1.5 h-1.5 rounded-full bg-rose" />
                    <div className="w-1.5 h-1.5 rounded-full bg-sage" />
                </div>
            </div>
        </div>
    );
}
