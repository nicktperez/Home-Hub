'use client';

import { useState, useEffect } from 'react';
import { Quote } from 'lucide-react';
import { clsx } from 'clsx';

const QUOTES = [
    "Behind every great kid is a mom who's pretty sure she's screwing it up.",
    "Silence is golden. Unless you have kids, then silence is suspicious.",
    "I'm not a regular mom, I'm a cool mom.",
    "Everything is figure-out-able.",
    "Done is better than perfect.",
    "Choose joy today.",
    "You are enough.",
    "Mama needs coffee.",
    "Home is where the heart (and the laundry) is.",
    "Strong as a mother.",
    "Pardon the mess, the children are making memories.",
    "Inhale tacos, exhale negativity."
];

export default function QuoteWidget() {
    const [quote, setQuote] = useState('');
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);

        const interval = setInterval(() => {
            setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
        }, 86400000); // Daily

        return () => clearInterval(interval);
    }, []);

    if (!isMounted) {
        return (
            <div className="glass-card p-6 rounded-3xl h-full flex flex-col items-center justify-center animate-pulse">
                <div className="w-8 h-8 bg-rose/10 rounded-full mb-4" />
                <div className="h-4 bg-rose/10 rounded w-3/4 mb-2" />
                <div className="h-4 bg-rose/10 rounded w-1/2" />
            </div>
        );
    }

    return (
        <div className={clsx(
            "glass-card p-6 rounded-3xl h-full flex flex-col items-center justify-center text-center",
            "group hover:bg-white/50 transition-all duration-500"
        )}>
            <Quote className="w-5 h-5 text-rose/30 mb-4 group-hover:scale-110 transition-transform" />
            <p className="text-xl font-serif italic text-cocoa leading-relaxed font-semibold">
                "{quote}"
            </p>
            <div className="mt-4 w-8 h-1 bg-terracotta/20 rounded-full" />
        </div>
    );
}
