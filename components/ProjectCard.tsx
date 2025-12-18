'use client';

import { motion } from 'framer-motion';
import { Project } from '../types/project';
import { clsx } from 'clsx';
import { Trash2 } from 'lucide-react';

interface ProjectCardProps {
    project: Project;
    onDelete?: (id: string) => void;
}

export default function ProjectCard({ project, onDelete }: ProjectCardProps) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}
            whileTap={{ scale: 0.98 }}
            className={clsx(
                "p-3 rounded-lg border shadow-sm group select-none cursor-grab active:cursor-grabbing",
                "flex items-start justify-between gap-2",
                project.status === 'done'
                    ? "bg-slate-800/40 border-slate-700/50 opacity-70"
                    : "bg-slate-800/80 border-white/10"
            )}
        >
            <div className="flex-1 min-w-0">
                <p className={clsx(
                    "text-sm font-medium truncate",
                    project.status === 'done' ? "text-slate-500 line-through" : "text-slate-200"
                )}>
                    {project.title}
                </p>

                {/* Status Badge */}
                <div className="mt-1.5 flex items-center gap-2">
                    <span className={clsx(
                        "text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider",
                        project.status === 'todo' && "bg-slate-700/50 text-slate-400",
                        project.status === 'in_progress' && "bg-blue-500/20 text-blue-300",
                        project.status === 'done' && "bg-green-500/10 text-green-400"
                    )}>
                        {project.status === 'in_progress' ? 'In Progress' : project.status}
                    </span>
                    {project.note && (
                        <span className="text-[10px] text-slate-500 truncate max-w-[100px]">
                            📝 {project.note}
                        </span>
                    )}
                </div>
            </div>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(project.id);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded"
            >
                <Trash2 className="w-3.5 h-3.5" />
            </button>
        </motion.div>
    );
}
