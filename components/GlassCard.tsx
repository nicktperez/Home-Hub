'use client';

import { ReactNode } from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    animate?: boolean;
    hover?: boolean;
}

export default function GlassCard({ children, className, animate = false, hover = true }: GlassCardProps) {
    const Component = animate ? motion.div : 'div';

    return (
        <Component
            {...(animate ? {
                whileHover: hover ? { y: -4, transition: { duration: 0.3 } } : {},
                initial: { opacity: 0, y: 10 },
                animate: { opacity: 1, y: 0 },
            } : {})}
            className={clsx(
                "glass-card rounded-[32px] border border-white/40 shadow-sm transition-all duration-500",
                hover && "hover:shadow-lg hover:border-white/60 hover:bg-white/10",
                className
            )}
        >
            {children}
        </Component>
    );
}
