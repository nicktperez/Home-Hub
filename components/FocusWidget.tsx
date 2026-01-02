'use client';

import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { clsx } from 'clsx';


import GlassCard from './GlassCard';

export default function FocusWidget() {
    const [intention, setIntention] = useState('Loading...');
    const [isMounted, setIsMounted] = useState(false);

    const fetchNewQuote = async () => {
        setIntention("Thinking..."); // Optimistic UI
        try {
            const res = await fetch('/api/quote');
            if (res.ok) {
                const data = await res.json();
                if (data.error) {
                    console.error("API Quote Error Details:", data.error); // Log to console
                    setIntention("Choose Kindness"); // Still fallback for UI cleanliness, but now we know why
                } else {
                    setIntention(data.quote);
                }
            } else {
                console.error("API Quote Network Error", res.status, res.statusText);
                const text = await res.text();
                console.error("Response body:", text);
                setIntention("Choose Kindness");
            }
        } catch (e) {
            console.error("Fetch Logic Error:", e);
            setIntention("Choose Kindness");
        }
    };

    useEffect(() => {
        setIsMounted(true);
        fetchNewQuote();

        // Refresh quote every 4 hours
        const interval = setInterval(fetchNewQuote, 14400000);
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
