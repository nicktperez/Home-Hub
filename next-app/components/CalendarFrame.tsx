'use client';

interface CalendarFrameProps {
    src: string;
    title: string;
}

export default function CalendarFrame({ src, title }: CalendarFrameProps) {
    return (
        <div className="w-full h-full rounded-xl overflow-hidden bg-[#0c111a] border border-white/10 shadow-inner p-1">
            <iframe
                src={src}
                title={title}
                className="w-full h-full rounded-lg bg-[#0c111a]"
                frameBorder="0"
                scrolling="no"
            />
        </div>
    );
}
