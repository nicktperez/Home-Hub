'use client';

import { motion } from 'framer-motion';
import { Project } from '@/types';
import { clsx } from 'clsx';
import { Trash2, ArrowLeft, ArrowRight, MoreVertical } from 'lucide-react';

interface ProjectCardProps {
    project: Project;
    onDelete?: (id: string) => void;
    onMove?: (id: string, nextStatus: Project['status']) => void;
}

export default function ProjectCard({ project, onDelete, onMove }: ProjectCardProps) {
    const statuses: Project['status'][] = ['todo', 'in_progress', 'done'];
    const currentIndex = statuses.indexOf(project.status);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={clsx(
                "p-4 rounded-[20px] border shadow-sm group select-none relative overflow-hidden",
                "flex flex-col gap-3",
                project.status === 'done'
                    ? "bg-stone-900/40 border-white/5 opacity-70"
                    : "bg-stone-900/90 border-white/10"
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <p className={clsx(
                        "text-sm lg:text-base font-bold truncate",
                        project.status === 'done' ? "text-stone-500 line-through" : "text-stone-100"
                    )}>
                        {project.title}
                    </p>
                    {project.note && (
                        <p className="text-[10px] lg:text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                            {project.note}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete?.(project.id); }}
                        className="p-1.5 text-stone-500 hover:text-rose hover:bg-rose/10 rounded-full transition-all"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 text-stone-500 rounded-full">
                        <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Mobile/Hover Move Controls */}
            <div className="flex items-center justify-between mt-1 pt-3 border-t border-white/5">
                <div className="flex gap-2">
                    {currentIndex > 0 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onMove?.(project.id, statuses[currentIndex - 1]); }}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white transition-all flex items-center gap-1 text-[9px] font-black uppercase tracking-widest"
                        >
                            <ArrowLeft className="w-3 h-3" />
                        </button>
                    )}
                    {currentIndex < 2 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onMove?.(project.id, statuses[currentIndex + 1]); }}
                            className="p-1.5 rounded-lg bg-white/10 hover:bg-stone-100 hover:text-stone-900 text-stone-200 transition-all flex items-center gap-1 text-[9px] font-black uppercase tracking-widest"
                        >
                            Next <ArrowRight className="w-3 h-3" />
                        </button>
                    )}
                </div>

                <span className={clsx(
                    "text-[9px] px-2 py-0.5 rounded-full uppercase font-black tracking-[0.15em] shrink-0",
                    project.status === 'todo' && "bg-stone-800 text-stone-500",
                    project.status === 'in_progress' && "bg-sky-500/10 text-sky-400 border border-sky-500/20",
                    project.status === 'done' && "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                )}>
                    {project.status.replace('_', ' ')}
                </span>
            </div>
        </motion.div>
    );
}
