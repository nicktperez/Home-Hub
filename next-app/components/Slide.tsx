'use client';

import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface SlideProps {
  children: ReactNode;
  isActive: boolean;
  title: string;
}

export default function Slide({ children, isActive, title }: SlideProps) {
  return (
    <section
      className={clsx(
        "absolute inset-0 flex flex-col gap-5 p-6",
        "bg-stone-900/40 backdrop-blur-2xl",
        "rounded-[24px] border border-stone-800/50 shadow-2xl",
        "transition-opacity duration-700 ease-in-out",
        "overflow-y-auto overflow-x-hidden",
        isActive ? "opacity-100 pointer-events-auto z-10" : "opacity-0 pointer-events-none z-0"
      )}
    >
      {/* Subtle inner glow */}
      <div className="absolute inset-0 pointer-events-none rounded-[24px] shadow-[inset_0_0_100px_rgba(0,0,0,0.2)] -z-10" />

      <header className="flex-shrink-0 mb-2 px-1">
        <h1 className="text-3xl font-light tracking-wide text-stone-200">
          {title}
        </h1>
      </header>

      <div className="flex-1 relative min-h-0">
        {children}
      </div>
    </section>
  );
}
