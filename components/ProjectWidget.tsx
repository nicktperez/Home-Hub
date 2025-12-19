import { clsx } from 'clsx';
import { Circle } from 'lucide-react';
import { useDashboard } from '@/context/DashboardContext';
import GlassCard from './GlassCard';

export default function ProjectWidget() {
    const { projects } = useDashboard();
    const activeProjects = projects.filter(p => p.status !== 'done');

    return (
        <GlassCard className="p-6 flex flex-col h-full cursor-pointer">
            <h3 className="text-[11px] font-bold text-rose uppercase tracking-[0.15em] mb-4 flex items-center gap-2 justify-between">
                <span className="flex items-center gap-2">📌 Open Projects</span>
                <span className="text-[10px] bg-terracotta text-white px-2 py-0.5 rounded-full shadow-sm">{activeProjects.length}</span>
            </h3>

            <div className="space-y-2 overflow-y-auto pr-1 custom-scrollbar">
                {activeProjects.slice(0, 5).map(project => (
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
        </GlassCard>
    );
}

