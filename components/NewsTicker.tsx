'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Newspaper } from 'lucide-react';

interface NewsItem {
    text: string;
    source: string;
}

export default function NewsTicker() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                // Get user's city if possible via simple free IP API
                // Or checking a localstorage pref if Weather.tsx saved it
                // For now, let's try a best-effort IP gelocation or default
                let location = 'USA';
                try {
                    // try browser geo helper if we had one, but for now simple fetch
                    // This step is optional but helps personalization
                } catch { }

                const res = await fetch(`/api/news?location=${encodeURIComponent(location)}`);
                if (res.ok) {
                    const data = await res.json();

                    if (Array.isArray(data.news)) {
                        // Check if it's the new object format or legacy string
                        const parsedNews = data.news.map((item: any) => {
                            if (typeof item === 'string') return { text: item, source: 'Good News' };
                            return item;
                        });
                        setNews(parsedNews);
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
                    className="whitespace-nowrap px-8 text-sm font-medium text-stone-300 flex gap-4"
                    animate={{ x: ["100%", "-100%"] }}
                    transition={{
                        repeat: Infinity,
                        ease: "linear",
                        duration: 80
                    }}
                >
                    {/* Render Loop */}
                    {[...news, ...news, ...news].map((item, i) => (
                        <div key={i} className="flex items-center gap-4 px-4 border-r border-white/10">
                            <span className="text-stone-200">{item.text}</span>
                            <span className="text-[10px] font-black uppercase tracking-wider text-rose/80 bg-rose/10 px-1.5 rounded">
                                {item.source}
                            </span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}
