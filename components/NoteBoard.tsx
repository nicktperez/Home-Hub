import { useRef, useState, useEffect } from 'react';
import { X, Palette, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { useDashboard } from '@/context/DashboardContext';
import { Note } from '@/types';
import GlassCard from './GlassCard';
import { useDebounce } from '@/hooks/useDebounce';

const COLORS = [
    { name: 'Yellow', class: 'bg-yellow-200' },
    { name: 'Blue', class: 'bg-blue-200' },
    { name: 'Green', class: 'bg-green-200' },
    { name: 'Pink', class: 'bg-pink-200' },
    { name: 'Purple', class: 'bg-purple-200' },
    { name: 'Orange', class: 'bg-orange-200' },
];

function NoteCard({ note, onUpdate, onDelete, containerRef }: {
    note: Note,
    onUpdate: (id: number, updates: Partial<Note>) => void,
    onDelete: (id: number) => void,
    containerRef: React.RefObject<HTMLDivElement | null>
}) {
    const [localText, setLocalText] = useState(note.text);
    const debouncedText = useDebounce(localText, 1000);

    // Sync from local state to global/backend when debounced text changes
    useEffect(() => {
        if (debouncedText !== note.text) {
            onUpdate(note.id, { text: debouncedText });
        }
    }, [debouncedText, note.id, onUpdate, note.text]);

    // Sync from global/backend to local state if changed externally (e.g. from Supabase load)
    useEffect(() => {
        setLocalText(note.text);
    }, [note.text]);

    return (
        <motion.div
            drag={typeof window !== 'undefined' && window.innerWidth > 1024}
            dragConstraints={containerRef}
            whileHover={{ scale: 1.02, zIndex: 10 }}
            whileDrag={{ scale: 1.05, zIndex: 20, cursor: 'grabbing' }}
            className={clsx(
                "group relative w-full lg:w-72 h-56 lg:h-72 p-5 lg:p-8 shadow-xl transition-shadow hover:shadow-cocoa/5",
                note.color,
                "lg:" + note.rotation,
                "rounded-sm flex flex-col shrink-0"
            )}
        >
            {/* Tape effect */}
            <div className="absolute -top-3 lg:-top-4 left-1/2 -translate-x-1/2 w-24 lg:w-32 h-8 lg:h-10 bg-white/30 backdrop-blur-sm lg:rotate-2 shadow-sm pointer-events-none border border-white/20"></div>

            <textarea
                value={localText}
                onChange={(e) => setLocalText(e.target.value)}
                className={clsx(
                    "flex-1 w-full h-full bg-transparent border-none outline-none resize-none",
                    "font-handwriting text-2xl lg:text-3xl leading-relaxed text-cocoa/90",
                    "placeholder:text-cocoa/30"
                )}
                placeholder="Write something sweet..."
            />

            {/* Controls */}
            <div className="absolute top-2 right-2 lg:top-3 lg:right-3 flex gap-1.5 lg:gap-2 opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300">
                <div className="group/colors relative pb-2">
                    <button className="p-1.5 lg:p-2 bg-white/50 hover:bg-white shadow-sm rounded-full text-cocoa/60 hover:text-cocoa transition-all">
                        <Palette className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                    </button>
                    <div className="absolute right-0 top-full pt-2 hidden group-hover/colors:block z-50">
                        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-2 flex flex-col gap-2 border border-white/60">
                            {COLORS.map(c => (
                                <button
                                    key={c.name}
                                    className={`w-6 h-6 rounded-full ${c.class} border border-black/5 hover:scale-125 transition-transform`}
                                    onClick={() => onUpdate(note.id, { color: c.class })}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => onDelete(note.id)}
                    className="p-1.5 lg:p-2 bg-white/50 hover:bg-rose shadow-sm rounded-full text-cocoa/60 hover:text-white transition-all h-fit"
                >
                    <X className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                </button>
            </div>
        </motion.div>
    );
}

export default function NoteBoard() {
    const { notes, loading, addNote, updateNote, deleteNote } = useDashboard();
    const containerRef = useRef<HTMLDivElement>(null);

    if (loading) return null;

    return (
        <GlassCard className="rounded-[32px] lg:rounded-[40px] p-4 lg:p-8 h-full flex flex-col shadow-sm border border-white/40" hover={false}>
            <div ref={containerRef} className="flex-1 relative overflow-y-auto lg:overflow-hidden rounded-[24px] lg:rounded-[32px] border border-white/40 bg-white/5 shadow-[inner_0_4px_12px_rgba(0,0,0,0.01)] min-h-[400px] lg:min-h-0">
                <div className="lg:absolute lg:inset-0 p-3 lg:p-8 flex flex-col lg:flex-row lg:flex-wrap content-start gap-6 lg:gap-10">
                    {notes.map(note => (
                        <NoteCard
                            key={note.id}
                            note={note}
                            onUpdate={updateNote}
                            onDelete={deleteNote}
                            containerRef={containerRef}
                        />
                    ))}
                    {notes.length === 0 && (
                        <div className="w-full h-64 flex flex-col items-center justify-center text-cocoa/20">
                            <Plus className="w-12 h-12 mb-2 opacity-10" />
                            <p className="font-serif italic text-lg">No notes yet. Add one below!</p>
                        </div>
                    )}
                </div>

                <div className="fixed lg:absolute bottom-6 right-6 lg:bottom-10 lg:right-10 z-[60]">
                    <button
                        className="w-14 h-14 lg:w-16 lg:h-16 bg-white hover:bg-rose lg:bg-white/40 lg:hover:bg-rose/80 backdrop-blur-md rounded-full flex items-center justify-center text-rose hover:text-white transition-all duration-300 border border-rose/20 lg:border-white/40 shadow-xl group hover:scale-110"
                        onClick={() => addNote("")}
                    >
                        <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                </div>
            </div>
        </GlassCard>
    );
}
