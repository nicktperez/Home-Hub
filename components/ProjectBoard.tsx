import { useState, useEffect } from 'react';
import { Reorder, motion, AnimatePresence } from 'framer-motion';
import { Project } from '../types';
import { Plus, X, AlignLeft, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import ProjectCard from './ProjectCard';
import { useDashboard } from '@/context/DashboardContext';
import GlassCard from './GlassCard';
import { useDebounce } from '@/hooks/useDebounce';
function ProjectModal({ project, onClose, onUpdate, onDelete }: {
    project: Project,
    onClose: () => void,
    onUpdate: (id: string, updates: Partial<Project>) => Promise<void>,
    onDelete: (id: string) => void
}) {
    const [localTitle, setLocalTitle] = useState(project.title);
    const [localNote, setLocalNote] = useState(project.note || '');

    const debouncedTitle = useDebounce(localTitle, 1000);
    const debouncedNote = useDebounce(localNote, 1000);

    useEffect(() => {
        if (debouncedTitle !== project.title) {
            onUpdate(project.id, { title: debouncedTitle });
        }
    }, [debouncedTitle, project.id, onUpdate, project.title]);

    useEffect(() => {
        if (debouncedNote !== (project.note || '')) {
            onUpdate(project.id, { note: debouncedNote });
        }
    }, [debouncedNote, project.id, onUpdate, project.note]);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 lg:p-4 bg-black/80 backdrop-blur-md" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-stone-900 border border-white/10 w-full max-w-2xl rounded-[24px] lg:rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="p-5 lg:p-7 border-b border-white/5 flex justify-between items-start bg-stone-900">
                    <div className="flex-1">
                        <input
                            value={localTitle}
                            onChange={(e) => setLocalTitle(e.target.value)}
                            className="text-xl lg:text-3xl font-bold bg-transparent text-stone-50 focus:outline-none w-full placeholder-stone-700"
                            placeholder="Untilted Project"
                        />
                        <div className="flex gap-4 mt-2 text-[10px] lg:text-xs text-stone-500 uppercase tracking-widest font-bold">
                            <span className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded text-stone-400">
                                List: <span className="text-stone-100">{project.status.replace('_', ' ')}</span>
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-stone-500 hover:text-white p-2 hover:bg-white/5 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-5 lg:p-7 overflow-y-auto space-y-8 bg-stone-950/20 custom-scrollbar">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        <div className="lg:col-span-3 space-y-6">
                            <div>
                                <h3 className="text-[10px] lg:text-xs font-black text-stone-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                    <AlignLeft className="w-3.5 h-3.5" /> Description
                                </h3>
                                <textarea
                                    value={localNote}
                                    onChange={(e) => setLocalNote(e.target.value)}
                                    className="w-full h-40 lg:h-64 bg-stone-900/40 border border-stone-800 rounded-2xl p-4 lg:p-6 text-stone-200 focus:border-stone-600 focus:ring-1 focus:ring-stone-600 transition-all resize-none text-sm lg:text-lg leading-relaxed placeholder-stone-700"
                                    placeholder="Add some details about this project..."
                                />
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-[10px] lg:text-xs font-black text-stone-500 uppercase tracking-[0.2em] mb-3">Move To</h3>
                                <div className="flex flex-col gap-2">
                                    {['todo', 'in_progress', 'done'].map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => onUpdate(project.id, { status: s as any })}
                                            className={clsx(
                                                "w-full text-left px-4 py-2.5 text-xs font-bold rounded-xl border transition-all",
                                                project.status === s
                                                    ? "bg-stone-50 border-stone-50 text-stone-900 shadow-lg"
                                                    : "bg-white/5 border-white/5 text-stone-400 hover:bg-white/10"
                                            )}
                                        >
                                            {s.replace('_', ' ').toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/5">
                                <button
                                    onClick={() => { onDelete(project.id); onClose(); }}
                                    className="w-full px-4 py-3 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-xl transition-colors flex items-center justify-center gap-2 border border-red-500/20 group"
                                >
                                    <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" /> Delete Project
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default function ProjectBoard() {
    const { projects, setProjects, loading, addProject, updateProject, deleteProject } = useDashboard();
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    if (loading) return null;

    const handleDelete = async (id: string) => {
        await deleteProject(id);
    };

    const handleUpdateProject = async (id: string, updates: Partial<Project>) => {
        await updateProject(id, updates);
        if (selectedProject?.id === id) {
            setSelectedProject(prev => prev ? { ...prev, ...updates } : null);
        }
    };

    const columns = [
        { id: 'todo', title: 'To Do', color: 'border-stone-600' },
        { id: 'in_progress', title: 'In Progress', color: 'border-sky-500/40' },
        { id: 'done', title: 'Done', color: 'border-emerald-500/40' },
    ] as const;

    return (
        <div className="flex flex-col h-full gap-4 lg:gap-6">
            <div className="flex items-center justify-between flex-shrink-0 px-1">
                <div className="flex gap-4 text-[10px] lg:text-xs font-black text-stone-500 uppercase tracking-widest">
                    <span>{projects.length} Total</span>
                    <span className="hidden lg:inline">{projects.filter(p => p.status === 'todo').length} To Do</span>
                </div>
                <button
                    onClick={() => addProject('New Project')}
                    className="flex items-center gap-2 px-4 py-2 bg-stone-50 hover:bg-white text-stone-900 text-xs font-black uppercase tracking-wider rounded-xl shadow-xl transition-all active:scale-95"
                >
                    <Plus className="w-4 h-4" /> New Project
                </button>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-8 min-h-0 overflow-hidden">
                {columns.map(col => {
                    const columnProjects = projects.filter(p => p.status === col.id);

                    return (
                        <div key={col.id} className="h-full flex flex-col">
                            <GlassCard
                                className={`rounded-[24px] lg:rounded-[32px] border-t-4 h-full overflow-hidden flex flex-col ${col.color} bg-white/2`}
                                hover={false}
                            >
                                <div className="p-4 lg:p-5 border-b border-white/5 flex justify-between items-center bg-white/5 text-[10px] uppercase tracking-[0.2em] font-black text-stone-400">
                                    {col.title}
                                    <span className="bg-white/10 px-2 py-0.5 rounded-full text-stone-300">
                                        {columnProjects.length}
                                    </span>
                                </div>

                                <div className="flex-1 p-2 lg:p-4 overflow-y-auto space-y-3 lg:space-y-4 custom-scrollbar lg:min-h-0">
                                    <AnimatePresence mode="popLayout">
                                        {columnProjects.map(project => (
                                            <motion.div
                                                key={project.id}
                                                layoutId={project.id}
                                                drag={true}
                                                dragSnapToOrigin={true}
                                                onDragEnd={(_, info) => {
                                                    // Determine drop column based on drag distance
                                                    // This is a simple heuristic: if they dragged far enough to the right/left
                                                    const { x, y } = info.offset;
                                                    const isDesktop = window.innerWidth > 768;

                                                    if (isDesktop) {
                                                        const colWidth = window.innerWidth / 3;
                                                        if (x > colWidth * 0.4) {
                                                            const nextStatus = col.id === 'todo' ? 'in_progress' : col.id === 'in_progress' ? 'done' : 'done';
                                                            if (nextStatus !== col.id) handleUpdateProject(project.id, { status: nextStatus });
                                                        } else if (x < -colWidth * 0.4) {
                                                            const prevStatus = col.id === 'done' ? 'in_progress' : col.id === 'in_progress' ? 'todo' : 'todo';
                                                            if (prevStatus !== col.id) handleUpdateProject(project.id, { status: prevStatus });
                                                        }
                                                    } else {
                                                        // Vertical drag on mobile
                                                        if (y > 100) {
                                                            const nextStatus = col.id === 'todo' ? 'in_progress' : col.id === 'in_progress' ? 'done' : 'done';
                                                            if (nextStatus !== col.id) handleUpdateProject(project.id, { status: nextStatus });
                                                        } else if (y < -100) {
                                                            const prevStatus = col.id === 'done' ? 'in_progress' : col.id === 'in_progress' ? 'todo' : 'todo';
                                                            if (prevStatus !== col.id) handleUpdateProject(project.id, { status: prevStatus });
                                                        }
                                                    }
                                                }}
                                                className="cursor-grab active:cursor-grabbing z-10"
                                                whileDrag={{ scale: 1.05, zIndex: 50, rotate: 1 }}
                                            >
                                                <div onClick={() => setSelectedProject(project)}>
                                                    <ProjectCard
                                                        project={project}
                                                        onDelete={handleDelete}
                                                        onMove={(id, nextStatus) => handleUpdateProject(id, { status: nextStatus })}
                                                    />
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                    <div className="h-20 flex-shrink-0" />
                                    {columnProjects.length === 0 && (
                                        <div className="h-40 border-2 border-dashed border-white/5 rounded-[32px] flex flex-col items-center justify-center text-stone-600">
                                            <p className="text-[10px] uppercase font-black tracking-[0.2em] opacity-30">Empty Column</p>
                                        </div>
                                    )}
                                </div>
                            </GlassCard>
                        </div>
                    );
                })}
            </div>

            {selectedProject && (
                <ProjectModal
                    project={selectedProject}
                    onClose={() => setSelectedProject(null)}
                    onUpdate={handleUpdateProject}
                    onDelete={handleDelete}
                />
            )}
        </div>
    );
}
