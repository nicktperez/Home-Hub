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
        "absolute inset-0 flex flex-col gap-2 lg:gap-4 p-3 lg:p-8",
        "bg-white/1 backdrop-blur-xl",
        "rounded-[32px] lg:rounded-[40px] border border-white/20 shadow-sm",
        "transition-opacity duration-700 ease-in-out",
        "overflow-y-auto lg:overflow-hidden pb-32 lg:pb-8",
        isActive ? "opacity-100 pointer-events-auto z-10" : "opacity-0 pointer-events-none z-0"
      )}
    >
      <header className="flex-shrink-0 mb-1 lg:mb-2 px-1">
        <h1 className="text-lg lg:text-3xl font-serif font-black tracking-tight text-cocoa/80 italic">
          {title}
        </h1>
      </header>

      <div className="flex-1 relative">
        {children}
      </div>
    </section>
  );
}
