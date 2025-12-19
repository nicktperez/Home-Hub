'use client';

import { clsx } from 'clsx';

interface GoogleSheetFrameProps {
    src: string;
    title: string;
}

export default function GoogleSheetFrame({ src, title }: GoogleSheetFrameProps) {
    return (
        <div className="w-full h-full flex flex-col gap-6">
            <div className="flex-1 rounded-[48px] overflow-hidden border border-white/40 shadow-xl bg-white/5 relative group transition-all duration-700 hover:shadow-2xl">
                {/* The Sheet with warm filters */}
                <iframe
                    src={src}
                    className={clsx(
                        "w-full h-full transition-all duration-1000",
                        "sepia-[0.2] brightness-[1.02] contrast-[0.95]",
                        "opacity-90 group-hover:opacity-100"
                    )}
                    title={title}
                    allowFullScreen
                ></iframe>

                {/* Decorative Aesthetic Wash (Tinting the sheet warmer) */}
                <div className="absolute inset-0 pointer-events-none bg-rose/5 mix-blend-screen opacity-50 group-hover:opacity-30 transition-opacity duration-700"></div>

                {/* Soft inner glow and protective ring */}
                <div className="absolute inset-0 pointer-events-none rounded-[48px] ring-1 ring-inset ring-white/30 shadow-[inset_0_0_80px_rgba(255,255,255,0.1)]"></div>
            </div>

            <div className="flex justify-between items-center px-6">
                <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-sage shadow-sm animate-pulse"></div>
                    <p className="text-[11px] font-black text-rose uppercase tracking-[0.3em] font-sans opacity-80">{title}</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-cocoa/20"></span>
                    <p className="text-[10px] font-serif italic text-cocoa/50 font-semibold tracking-wide">Connected Live</p>
                </div>
            </div>
        </div>
    );
}
