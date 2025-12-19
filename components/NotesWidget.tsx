import { useDashboard } from '@/context/DashboardContext';
import GlassCard from './GlassCard';

export default function NotesWidget() {
    const { notes } = useDashboard();

    return (
        <GlassCard className="p-6 flex flex-col h-full cursor-pointer">
            <h3 className="text-[11px] font-bold text-rose uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
                <span>💭 Quick Reminders</span>
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-y-auto custom-scrollbar">
                {notes.slice(0, 4).map(note => (
                    <div
                        key={note.id}
                        className={clsx(
                            note.color,
                            "p-4 rounded-2xl shadow-sm text-sm font-serif italic font-bold border leading-snug transform hover:rotate-2 transition-transform min-h-24 flex items-center justify-center text-center text-cocoa/80"
                        )}
                    >
                        {note.text || "Empty note"}
                    </div>
                ))}
            </div>
        </GlassCard>
    );
}

import { clsx } from 'clsx';

