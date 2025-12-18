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

    const updateColor = (id: number, newColor: string) => {
        setNotes(prev => prev.map(n => n.id === id ? { ...n, color: newColor } : n));
    };

    return (
        <div className="glass-card rounded-2xl p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-stone-300 flex items-center gap-2">
                    <span>📌</span> Sticky Notes
                </h2>
                <div className="text-xs text-stone-500 font-mono">
                    {notes.length} Active
                </div>
            </div>

            <div ref={containerRef} className="flex-1 relative overflow-hidden rounded-xl border border-white/5 bg-white/5">
                <div className="absolute inset-0 p-4 flex flex-wrap content-start gap-8">
                    {notes.map(note => (
                        <motion.div
                            key={note.id}
                            drag
                            dragConstraints={containerRef}
                            whileHover={{ scale: 1.05, zIndex: 10 }}
                            whileDrag={{ scale: 1.1, zIndex: 20, cursor: 'grabbing' }}
                            className={clsx(
                                "relative w-64 h-64 p-6 shadow-xl text-stone-800 font-handwriting text-xl leading-relaxed cursor-grab",
                                note.color,
                                note.rotation
                            )}
                        >
                            {/* Tape effect */}
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-8 bg-white/30 backdrop-blur-sm rotate-1 shadow-sm pointer-events-none"></div>

                            {note.text}

                            {/* Controls Overlay (Visible on Hover) */}
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {/* Color Palette */}
                                <div className="group/colors relative">
                                    <button className="p-1.5 bg-black/5 hover:bg-black/10 rounded-full text-black/40 hover:text-black/70">
                                        <Palette className="w-4 h-4" />
                                    </button>
                                    <div className="absolute right-0 top-8 bg-white/90 backdrop-blur rounded-lg shadow-lg p-2 flex gap-1 hidden group-hover/colors:flex z-50">
                                        {COLORS.map(c => (
                                            <button
                                                key={c.name}
                                                className={`w-4 h-4 rounded-full ${c.class} border border-black/10 hover:scale-125 transition-transform`}
                                                onClick={(e) => { e.stopPropagation(); updateColor(note.id, c.class); }}
                                                title={c.name}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => { e.stopPropagation(); setNotes(prev => prev.filter(n => n.id !== note.id)); }}
                                    className="p-1.5 bg-black/5 hover:bg-red-500/10 rounded-full text-black/40 hover:text-red-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    ))}

                    {/* Add button placeholder (Static) */}

                </div>
                <div className="absolute bottom-4 right-4">
                    <button
                        className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-all border border-white/10"
                        title="Add Note"
                        onClick={() => {
                            const newId = Math.max(...notes.map(n => n.id), 0) + 1;
                            setNotes([...notes, { id: newId, text: "New Note...", color: "bg-yellow-200", rotation: `rotate-${Math.floor(Math.random() * 6) - 3}` }]);
                        }}
                    >
                        <span className="text-2xl font-light">+</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
