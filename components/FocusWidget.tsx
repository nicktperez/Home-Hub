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

import GlassCard from './GlassCard';

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
            <GlassCard className="p-8 min-h-[200px] flex flex-col items-center justify-center animate-pulse">
                <div className="h-4 bg-rose/10 rounded w-1/2 mb-4" />
                <div className="h-10 bg-rose/10 rounded w-3/4" />
            </GlassCard>
        );
    }

    return (
        <GlassCard className="p-8 h-full flex flex-col items-center justify-center relative overflow-hidden group">
            {/* Soft decorative element */}
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-rose/10 rounded-full blur-3xl group-hover:bg-rose/15 transition-colors duration-700" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-sage/10 rounded-full blur-3xl group-hover:bg-sage/15 transition-colors duration-700" />

            <div className="relative z-10 flex flex-col items-center">
                <h2 className="text-[11px] font-bold mb-6 flex items-center gap-3 text-rose uppercase tracking-[0.3em] opacity-80">
                    <Sparkles className="w-3.5 h-3.5 text-terracotta" />
                    Daily Intention
                    <Sparkles className="w-3.5 h-3.5 text-terracotta" />
                </h2>

                <div className="w-full text-center max-w-4xl transform transition-all duration-1000 group-hover:scale-105">
                    <p className="text-4xl lg:text-6xl font-serif font-bold text-cocoa leading-tight italic tracking-tight">
                        "{intention}"
                    </p>
                    <div className="mt-8 flex justify-center gap-2 opacity-40 group-hover:opacity-60 transition-opacity">
                        <div className="w-2 h-2 rounded-full bg-terracotta" />
                        <div className="w-12 h-2 rounded-full bg-rose/40" />
                        <div className="w-2 h-2 rounded-full bg-sage" />
                    </div>
                </div>
            </div>
        </GlassCard>
    );
}
