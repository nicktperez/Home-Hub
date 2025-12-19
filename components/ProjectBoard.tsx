'use client';

import { useEffect, useState } from 'react';
import { Reorder } from 'framer-motion';
import { Project } from '../types/project';
import { Plus, X, AlignLeft } from 'lucide-react';
import { clsx } from 'clsx';
import ProjectCard from './ProjectCard';

const STORAGE_KEY = 'home-hub-projects';

const MOCK_PROJECTS: Project[] = [
    { id: '1', title: 'Fix the garage door', status: 'todo' },
    { id: '2', title: 'Plan summer vacation', status: 'in_progress', note: 'Check flights' },
    { id: '3', title: 'Buy groceries', status: 'done' },
    { id: '4', title: 'Update Family Wall Dashboard', status: 'in_progress', note: 'Migrating to Next.js' },
    { id: '5', title: 'Call Grandma', status: 'todo' },
];

export default function ProjectBoard() {
    const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved) as Project[];
                if (Array.isArray(parsed)) {
                    setProjects(parsed);
                }
            } catch (error) {
                console.error('Failed to parse projects', error);
            }
        }
        setLoaded(true);
    }, []);

    useEffect(() => {
        if (!loaded) return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    }, [loaded, projects]);

    const handleDelete = (id: string) => {
        setProjects(prev => prev.filter(p => p.id !== id));
    };

    const handleUpdateProject = (updated: Project) => {
        setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
        setSelectedProject(updated);
    };

    const columns = [
        { id: 'todo', title: 'To Do', color: 'border-stone-600' },
        { id: 'in_progress', title: 'In Progress', color: 'border-blue-500/50' },
        { id: 'done', title: 'Done', color: 'border-green-500/50' },
    ] as const;

    return (
        <div className="flex flex-col h-full gap-5">
            {/* Header */}
            <div className="flex items-center justify-between flex-shrink-0">
                <div className="flex gap-4 text-sm font-medium text-stone-400">
                    <span>Total: {projects.length}</span>
                    <span>Todo: {projects.filter(p => p.status === 'todo').length}</span>
                </div>
                <button className="flex items-center gap-1.5 px-4 py-2 bg-stone-100 hover:bg-white text-stone-900 text-sm font-bold rounded-lg shadow-lg transition-all active:scale-95">
                    <Plus className="w-4 h-4" /> New Project
                </button>
            </div>

            {/* Board Columns */}
            <div className="flex-1 grid grid-cols-3 gap-6 min-h-0">
                {columns.map(col => {
                    const columnProjects = projects.filter(p => p.status === col.id);

                    return (
                        <div key={col.id} className={`glass-card rounded-2xl border-t-4 h-full overflow-hidden flex flex-col ${col.color}`}>
                            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5 text-xs uppercase tracking-widest">
                                {col.title}
                                <span className="bg-stone-800 px-2.5 py-0.5 rounded-full text-stone-300 text-[10px]">
                                    {columnProjects.length}
                                </span>
                            </div>

                            <Reorder.Group
                                axis="y"
                                onReorder={(newOrder) => {
                                    // Merge reordered column items back into global state
                                    // 1. Get items NOT in this column
                                    const otherItems = projects.filter(p => p.status !== col.id);
                                    // 2. Combine others + newOrder (which is this column reordered)
                                    // Note: This puts reordered column at the end of the array, which is fine for data structure
                                    // but ideally we'd preserve relative positions. For this simple app, this is sufficient.
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
                        </div>
                    );
                })}
            </div>

            {/* Project Details Modal */}
            {selectedProject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedProject(null)}>
                    <div
                        className="bg-stone-900 border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-6 border-b border-white/5 flex justify-between items-start bg-stone-900">
                            <div className="flex-1">
                                <input
                                    value={selectedProject.title}
                                    onChange={(e) => handleUpdateProject({ ...selectedProject, title: e.target.value })}
                                    className="text-2xl font-bold bg-transparent text-stone-100 focus:outline-none w-full placeholder-stone-600"
                                    placeholder="Project Title"
                                />
                                <div className="flex gap-4 mt-2 text-sm text-stone-500">
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
                        <div className="p-6 overflow-y-auto space-y-6 bg-stone-950/30">
                            <div className="flex gap-4">
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                            <AlignLeft className="w-4 h-4" /> Description
                                        </h3>
                                        <textarea
                                            value={selectedProject.note || ''}
                                            onChange={(e) => handleUpdateProject({ ...selectedProject, note: e.target.value })}
                                            className="w-full h-32 bg-stone-900/50 border border-stone-800 rounded-xl p-4 text-stone-300 focus:border-stone-600 focus:ring-1 focus:ring-stone-600 transition-all resize-none"
                                            placeholder="Add a more detailed description..."
                                        />
                                    </div>
                                </div>

                                {/* Sidebar */}
                                <div className="w-48 space-y-6">
                                    <div>
                                        <h3 className="text-xs font-bold text-stone-500 uppercase mb-2">Status</h3>
                                        <select
                                            value={selectedProject.status}
                                            onChange={(e) => handleUpdateProject({ ...selectedProject, status: e.target.value as any })}
                                            className="w-full bg-stone-800 border border-stone-700 text-stone-300 text-sm rounded-lg p-2 focus:outline-none"
                                        >
                                            <option value="todo">To Do</option>
                                            <option value="in_progress">In Progress</option>
                                            <option value="done">Done</option>
                                        </select>
                                    </div>

                                    <div>
                                        <h3 className="text-xs font-bold text-stone-500 uppercase mb-2">Actions</h3>
                                        <button onClick={() => { handleDelete(selectedProject.id); setSelectedProject(null); }} className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2">
                                            <X className="w-4 h-4" /> Delete Card
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
