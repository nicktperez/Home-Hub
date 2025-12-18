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
        <nav className="fixed top-8 left-1/2 -translate-x-1/2 z-50">
            <div className="glass-card px-3 py-2 rounded-full flex items-center gap-1 shadow-md border border-white/60">
                {slides.map((label, index) => (
                    <button
                        key={label}
                        onClick={() => onNavigate(index)}
                        className={clsx(
                            "relative px-6 py-2 rounded-full text-sm font-bold transition-all duration-300",
                            "font-sans tracking-wide",
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
