'use client';

import { useState, useRef } from 'react';
import { X, Palette } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

const INITIAL_NOTES = [
    { id: 1, text: "Welcome to the new dashboard!", color: "bg-yellow-200", rotation: "-rotate-1" },
    { id: 2, text: "WiFi: familyhub123", color: "bg-blue-200", rotation: "rotate-2" },
];

const COLORS = [
    { name: 'Yellow', class: 'bg-yellow-200' },
    { name: 'Blue', class: 'bg-blue-200' },
    { name: 'Green', class: 'bg-green-200' },
    { name: 'Pink', class: 'bg-pink-200' },
    { name: 'Purple', class: 'bg-purple-200' },
    { name: 'Orange', class: 'bg-orange-200' },
];

export default function NoteBoard() {
    const [notes, setNotes] = useState(INITIAL_NOTES);
    const containerRef = useRef<HTMLDivElement>(null);

    const updateNote = (id: number, text: string) => {
        setNotes(prev => prev.map(n => n.id === id ? { ...n, text } : n));
    };

    const updateColor = (id: number, newColor: string) => {
        setNotes(prev => prev.map(n => n.id === id ? { ...n, color: newColor } : n));
    };

    return (
        <div className="glass-card rounded-3xl p-8 h-full flex flex-col transition-all duration-500 shadow-sm border border-white/40">
            <div className="flex justify-between items-center mb-8 px-2">
                <div>
                    <h2 className="text-3xl font-serif font-black text-cocoa flex items-center gap-3">
                        Sticky Notes
                    </h2>
                    <p className="text-sm text-secondary font-medium mt-1 italic opacity-80 font-sans">Drag them anywhere, click to edit.</p>
                </div>
                <div className="text-[10px] font-black text-rose uppercase tracking-[0.2em] bg-rose/5 px-4 py-1.5 rounded-full border border-rose/10 shadow-inner font-sans">
                    {notes.length} Active Notes
                </div>
            </div>

            <div ref={containerRef} className="flex-1 relative overflow-hidden rounded-[32px] border border-white/40 bg-white/10 shadow-[inner_0_4px_12px_rgba(0,0,0,0.02)]">
                <div className="absolute inset-0 p-8 flex flex-wrap content-start gap-10">
                    {notes.map(note => (
                        <motion.div
                            key={note.id}
                            drag
                            dragConstraints={containerRef}
                            whileHover={{ scale: 1.02, zIndex: 10 }}
                            whileDrag={{ scale: 1.1, zIndex: 20, cursor: 'grabbing' }}
                            className={clsx(
                                "group relative w-72 h-72 p-8 shadow-2xl transition-shadow hover:shadow-cocoa/5",
                                note.color,
                                note.rotation,
                                "rounded-sm flex flex-col"
                            )}
                        >
                            {/* Tape effect */}
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-32 h-10 bg-white/40 backdrop-blur-sm rotate-2 shadow-sm pointer-events-none border border-white/20"></div>

                            <textarea
                                value={note.text}
                                onChange={(e) => updateNote(note.id, e.target.value)}
                                className={clsx(
                                    "flex-1 w-full h-full bg-transparent border-none outline-none resize-none",
                                    "font-handwriting text-3xl leading-relaxed text-cocoa/90",
                                    "placeholder:text-cocoa/30"
                                )}
                                placeholder="Write something sweet..."
                            />

                            {/* Controls Overlay (Visible on Hover) */}
                            <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                {/* Color Palette */}
                                <div className="group/colors relative pb-2">
                                    <button className="p-2 bg-white/50 hover:bg-white shadow-sm rounded-full text-cocoa/60 hover:text-cocoa transition-all">
                                        <Palette className="w-4 h-4" />
                                    </button>

                                    {/* Palette Dropdown */}
                                    <div className="absolute right-0 top-full pt-2 hidden group-hover/colors:block z-50">
                                        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-2.5 flex flex-col gap-2 max-h-48 overflow-y-auto no-scrollbar border border-white/60 animate-in fade-in slide-in-from-top-2 duration-200">
                                            {COLORS.map(c => (
                                                <button
                                                    key={c.name}
                                                    className={`w-6 h-6 rounded-full ${c.class} border border-black/5 hover:scale-125 transition-transform shadow-sm flex-shrink-0`}
                                                    onClick={(e) => { e.stopPropagation(); updateColor(note.id, c.class); }}
                                                    title={c.name}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => { e.stopPropagation(); setNotes(prev => prev.filter(n => n.id !== note.id)); }}
                                    className="p-2 bg-white/50 hover:bg-rose shadow-sm rounded-full text-cocoa/60 hover:text-white transition-all h-fit"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="absolute bottom-10 right-10">
                    <button
                        className="w-16 h-16 bg-white/20 hover:bg-rose/80 backdrop-blur-md rounded-full flex items-center justify-center text-rose hover:text-white transition-all duration-500 border border-white/40 shadow-lg group hover:scale-110 active:scale-95"
                        title="Add Note"
                        onClick={() => {
                            const newId = notes.length > 0 ? Math.max(...notes.map(n => n.id)) + 1 : 1;
                            setNotes([...notes, { id: newId, text: "", color: "bg-yellow-200", rotation: `rotate-${Math.floor(Math.random() * 6) - 3}` }]);
                        }}
                    >
                        <span className="text-4xl font-light group-hover:rotate-90 transition-transform duration-500">+</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
