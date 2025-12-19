'use client';

import { clsx } from 'clsx';

import { motion } from 'framer-motion';

interface NavigationProps {
    slides: string[];
    activeIndex: number;
    onNavigate: (index: number) => void;
}

export default function Navigation({ slides, activeIndex, onNavigate }: NavigationProps) {
    return (
        <nav className="fixed top-4 lg:top-8 left-0 right-0 lg:left-1/2 lg:-translate-x-1/2 z-[100] px-4 lg:px-0">
            <div className="glass-card px-2 lg:px-3 py-1.5 lg:py-2 rounded-full flex items-center gap-1 shadow-md border border-white/60 overflow-x-auto no-scrollbar scroll-smooth mx-auto max-w-max">
                {slides.map((label, index) => (
                    <button
                        key={label}
                        onClick={() => onNavigate(index)}
                        className={clsx(
                            "relative px-4 lg:px-6 py-1.5 lg:py-2 rounded-full text-xs lg:text-sm font-bold transition-all duration-300 whitespace-nowrap",
                            "font-sans tracking-wide shrink-0",
                            activeIndex === index
                                ? "text-white"
                                : "text-rose/80 hover:text-terracotta hover:bg-white/40"
                        )}
                    >
                        {activeIndex === index && (
                            <motion.div
                                layoutId="active-pill"
                                className="absolute inset-0 bg-terracotta rounded-full -z-10 shadow-sm"
                                transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                            />
                        )}
                        <span className="relative z-10">{label}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
}
