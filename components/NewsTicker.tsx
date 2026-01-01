'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper } from 'lucide-react';

export default function NewsTicker() {
    const [news, setNews] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                // Try to guess location or default to US
                const res = await fetch('/api/news?location=USA');
                if (res.ok) {
                    const data = await res.json();

                    if (Array.isArray(data.news)) {
                        setNews(data.news);
                    } else {
                        // Handle legacy single string format
                        setNews([data.news]);
                    }
                }
            } catch (e) {
                console.error("Ticker Error", e);
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
        // Refresh every hour
        const timer = setInterval(fetchNews, 3600000);
        return () => clearInterval(timer);
    }, []);

    if (loading && news.length === 0) return null;
    if (news.length === 0) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 h-10 bg-stone-900 border-t border-white/10 flex items-center z-50 overflow-hidden">
            <div className="bg-rose px-4 h-full flex items-center gap-2 z-10 shadow-lg shrink-0">
                <Newspaper className="w-4 h-4 text-white animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white">Good News</span>
            </div>

            <div className="flex-1 overflow-hidden relative h-full flex items-center">
                <motion.div
                    className="whitespace-nowrap px-8 text-sm font-medium text-stone-300 flex gap-12"
                    animate={{ x: ["100%", "-100%"] }}
                    transition={{
                        repeat: Infinity,
                        ease: "linear",
                        duration: 60 // Slower scroll for longer content
                    }}
                >
                    {/* Only render if we have items. Cycle them. */}
                    {/* We repeat the array 2-3 times to create a seamless loop buffer */}
                    {[...news, ...news, ...news].map((item, i) => (
                        <span key={i} className="flex items-center gap-8">
                            <span>{item}</span>
                            <span className="text-rose/50 text-[10px]">●</span>
                        </span>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}
