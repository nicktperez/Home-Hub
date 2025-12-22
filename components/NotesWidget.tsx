import { useDashboard } from '@/context/DashboardContext';
import GlassCard from './GlassCard';
import { clsx } from 'clsx';

export default function NotesWidget() {
    const { notes } = useDashboard();

    return (
        <GlassCard className="p-5 flex flex-col h-full cursor-pointer group overflow-hidden" hover={true}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-[10px] font-black text-rose uppercase tracking-[0.2em] flex items-center gap-2">
                    <span>Sticky Reminders</span>
                </h3>
                <span className="text-[10px] font-bold text-cocoa/30 px-2 py-0.5 rounded-full bg-cocoa/5">
                    {notes.length}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-3 overflow-y-auto custom-scrollbar pr-1">
                {notes.length === 0 ? (
                    <div className="col-span-2 h-24 flex items-center justify-center border-2 border-dashed border-cocoa/5 rounded-2xl text-cocoa/20 italic text-xs">
                        No stickies yet
                    </div>
                ) : (
                    notes.slice(0, 4).map((note, idx) => (
                        <div
                            key={note.id}
                            className={clsx(
                                note.color,
                                "p-3 rounded-xl shadow-sm border border-black/5 flex items-center justify-center text-center",
                                "transition-all duration-300 group-hover:scale-[1.02]",
                                idx % 2 === 0 ? "rotate-1" : "-rotate-1"
                            )}
                        >
                            <p className="text-[11px] lg:text-xs font-handwriting font-bold text-cocoa/80 line-clamp-3 leading-relaxed">
                                {note.text || "Empty note"}
                            </p>
                        </div>
                    ))
                )}
            </div>
        </GlassCard>
    );
}

