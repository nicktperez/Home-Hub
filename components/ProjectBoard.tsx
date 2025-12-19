import { useState } from 'react';
import { Reorder } from 'framer-motion';
import { Project } from '../types';
import { Plus, X, AlignLeft, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import ProjectCard from './ProjectCard';
import { useDashboard } from '@/context/DashboardContext';
import GlassCard from './GlassCard';

export default function ProjectBoard() {
    const { projects, setProjects, loading, addProject, updateProject, deleteProject } = useDashboard();
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    if (loading) return null;

    const handleDelete = async (id: string) => {
        await deleteProject(id);
    };

    const handleUpdateProject = async (updates: Partial<Project>) => {
        if (!selectedProject) return;
        await updateProject(selectedProject.id, updates);
        setSelectedProject(prev => prev ? { ...prev, ...updates } : null);
    };

    const handleAddProject = async () => {
        await addProject('New Project');
    };

    const columns = [
        { id: 'todo', title: 'To Do', color: 'border-stone-600' },
        { id: 'in_progress', title: 'In Progress', color: 'border-blue-500/50' },
        { id: 'done', title: 'Done', color: 'border-green-500/50' },
    ] as const;

    return (
        <div className="flex flex-col h-full gap-5">
            {/* ... header ... */}
            <div className="flex items-center justify-between flex-shrink-0">
                <div className="flex gap-4 text-sm font-medium text-stone-400">
                    <span>Total: {projects.length}</span>
                    <span>Todo: {projects.filter(p => p.status === 'todo').length}</span>
                </div>
                <button
                    onClick={handleAddProject}
                    className="flex items-center gap-1.5 px-4 py-2 bg-stone-100 hover:bg-white text-stone-900 text-sm font-bold rounded-lg shadow-lg transition-all active:scale-95"
                >
                    <Plus className="w-4 h-4" /> New Project
                </button>
            </div>

            {/* Board Columns */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 min-h-0">
                {columns.map(col => {
                    const columnProjects = projects.filter(p => p.status === col.id);

                    return (
                        <GlassCard key={col.id} className={`rounded-2xl border-t-4 h-full overflow-hidden flex flex-col ${col.color}`} hover={false}>
                            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5 text-xs uppercase tracking-widest">
                                {col.title}
                                <span className="bg-stone-800 px-2.5 py-0.5 rounded-full text-stone-300 text-[10px]">
                                    {columnProjects.length}
                                </span>
                            </div>

                            <Reorder.Group
                                axis="y"
                                onReorder={(newOrder) => {
                                    const otherItems = projects.filter(p => p.status !== col.id);
                                    setProjects([...otherItems, ...newOrder]);
                                }}
                                values={columnProjects}
                                className="flex-1 p-3 overflow-y-auto space-y-3 custom-scrollbar"
                            >
                                {columnProjects.map(project => (
                                    <Reorder.Item
                                        key={project.id}
                                        value={project}
                                        dragListener={true}
                                        style={{ listStyle: 'none' }}
                                    >
                                        <div onClick={() => setSelectedProject(project)}>
                                            <ProjectCard
                                                project={project}
                                                onDelete={handleDelete}
                                            />
                                        </div>
                                    </Reorder.Item>
                                ))}
                            </Reorder.Group>
                        </GlassCard>
                    );
                })}
            </div>

            {/* Project Details Modal */}
            {selectedProject && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 lg:p-4 bg-black/70 backdrop-blur-md" onClick={() => setSelectedProject(null)}>
                    <div
                        className="bg-stone-900 border border-white/10 w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-4 lg:p-6 border-b border-white/5 flex justify-between items-start bg-stone-900">
                            <div className="flex-1">
                                <input
                                    value={selectedProject.title}
                                    onChange={(e) => handleUpdateProject({ title: e.target.value })}
                                    className="text-xl lg:text-2xl font-bold bg-transparent text-stone-100 focus:outline-none w-full placeholder-stone-600"
                                    placeholder="Project Title"
                                />
                                <div className="flex gap-4 mt-1 lg:mt-2 text-[10px] lg:text-sm text-stone-500">
                                    <span className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded">
                                        In list <span className="text-stone-300 font-medium uppercase">{selectedProject.status.replace('_', ' ')}</span>
                                    </span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedProject(null)} className="text-stone-500 hover:text-white p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 lg:p-6 overflow-y-auto space-y-6 bg-stone-950/30 custom-scrollbar">
                            <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6">
                                <div className="lg:col-span-3 space-y-4">
                                    <div>
                                        <h3 className="text-xs lg:text-sm font-bold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                            <AlignLeft className="w-4 h-4" /> Description
                                        </h3>
                                        <textarea
                                            value={selectedProject.note || ''}
                                            onChange={(e) => handleUpdateProject({ note: e.target.value })}
                                            className="w-full h-32 lg:h-48 bg-stone-900/50 border border-stone-800 rounded-xl p-4 text-stone-300 focus:border-stone-600 focus:ring-1 focus:ring-stone-600 transition-all resize-none text-sm lg:text-base"
                                            placeholder="Add a more detailed description..."
                                        />
                                    </div>
                                </div>

                                {/* Sidebar */}
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-[10px] lg:text-xs font-bold text-stone-500 uppercase mb-2">Status</h3>
                                        <select
                                            value={selectedProject.status}
                                            onChange={(e) => handleUpdateProject({ status: e.target.value as any })}
                                            className="w-full bg-stone-800 border border-stone-700 text-stone-300 text-sm rounded-lg p-2 focus:outline-none"
                                        >
                                            <option value="todo">To Do</option>
                                            <option value="in_progress">In Progress</option>
                                            <option value="done">Done</option>
                                        </select>
                                    </div>

                                    <div>
                                        <h3 className="text-[10px] lg:text-xs font-bold text-stone-500 uppercase mb-2 text-red-400">Danger Zone</h3>
                                        <button onClick={() => { handleDelete(selectedProject.id); setSelectedProject(null); }} className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2 border border-red-500/20">
                                            <Trash2 className="w-4 h-4" /> Delete Card
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
