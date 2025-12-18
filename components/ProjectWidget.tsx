'use client';

import { clsx } from 'clsx';
import { CheckCircle2, Circle } from 'lucide-react';

interface Project {
    id: string;
    title: string;
    status: 'todo' | 'in_progress' | 'done';
}

// Mock data matching the main board
const PROJECTS: Project[] = [
    { id: '1', title: 'Fix the garage door', status: 'todo' },
    { id: '2', title: 'Plan summer vacation', status: 'in_progress' },
    { id: '4', title: 'Update Family Wall Dashboard', status: 'in_progress' },
];

export default function ProjectWidget() {
    return (
        <div className="glass-card rounded-3xl p-6 flex flex-col h-full hover:bg-white/60 transition-all duration-500 cursor-pointer shadow-sm">
            <h3 className="text-[11px] font-bold text-rose uppercase tracking-[0.15em] mb-4 flex items-center gap-2 justify-between">
                <span className="flex items-center gap-2">📌 Open Projects</span>
                <span className="text-[10px] bg-terracotta text-white px-2 py-0.5 rounded-full shadow-sm">3</span>
            </h3>

            <div className="space-y-2 overflow-y-auto pr-1 custom-scrollbar">
                {PROJECTS.map(project => (
                    <div key={project.id} className="flex items-start gap-4 p-3 rounded-2xl bg-white/40 border border-white/60 hover:border-terracotta/30 transition-colors">
                        {project.status === 'in_progress' ? (
                            <Circle className="w-4 h-4 text-terracotta mt-0.5 fill-terracotta/20" />
                        ) : (
                            <Circle className="w-4 h-4 text-rose mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                            <p className={clsx("text-sm font-black truncate", project.status === 'done' ? "text-rose/50 line-through" : "text-cocoa")}>
                                {project.title}
                            </p>
                            <p className="text-[9px] text-terracotta uppercase font-black mt-0.5 tracking-tighter">
                                {project.status === 'in_progress' ? 'Momentum' : 'Up Next'}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
