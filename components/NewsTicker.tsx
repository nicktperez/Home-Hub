'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper } from 'lucide-react';

export default function NewsTicker() {
    const [news, setNews] = useState<string | null>(null);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const res = await fetch('/api/news');
                if (res.ok) {
                    const data = await res.json();
                    setNews(data.news);
                }
            } catch (e) {
                console.error(e);
            }
        };

        fetchNews();
        // Refresh every hour
        const timer = setInterval(fetchNews, 3600000);
        return () => clearInterval(timer);
    }, []);

    if (!news) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 h-10 bg-stone-900 border-t border-white/10 flex items-center z-50 overflow-hidden">
            <div className="bg-rose px-4 h-full flex items-center gap-2 z-10 shadow-lg">
                <Newspaper className="w-4 h-4 text-white animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white">Good News</span>
            </div>

            <div className="flex-1 overflow-hidden relative h-full flex items-center">
                <motion.div
                    className="whitespace-nowrap px-8 text-sm font-medium text-stone-300"
                    animate={{ x: ["100%", "-100%"] }}
                    transition={{
                        repeat: Infinity,
                        ease: "linear",
                        duration: 30 // Slow scroll speed
                    }}
                >
                    {news} • {news} • {news}
                </motion.div>
            </div>
        </div>
    );
}
