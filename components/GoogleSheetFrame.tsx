'use client';

import { clsx } from 'clsx';

interface GoogleSheetFrameProps {
    src: string;
    title: string;
}

export default function GoogleSheetFrame({ src, title }: GoogleSheetFrameProps) {
    return (
        <div className="w-full h-full flex flex-col gap-4">
            <div className="flex-1 rounded-[40px] overflow-hidden border border-white/20 shadow-2xl bg-white/5 relative group">
                <iframe
                    src={src}
                    className="w-full h-full grayscale-[20%] hover:grayscale-0 transition-all duration-700"
                    title={title}
                    allowFullScreen
                ></iframe>

                {/* Soft edge overlay to blend with theme */}
                <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/10 rounded-[40px]"></div>
            </div>

            <div className="flex justify-between items-center px-4">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-sage shadow-sm"></div>
                    <p className="text-[10px] font-black text-rose uppercase tracking-[0.2em]">{title}</p>
                </div>
                <p className="text-[10px] font-medium text-cocoa/40 italic">Live Syncing...</p>
            </div>
        </div>
    );
}
