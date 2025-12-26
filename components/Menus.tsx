import * as React from 'react';
import { Box, Layers, Server, FolderOpen, ChevronDown, Mic, MicOff, Plus, Database, ChevronRight, Check } from 'lucide-react';
import { GraphData } from '../types';

interface MainHeaderProps {
    fetchGraph: (project: string) => Promise<void>;
    activeProject: string;
    showProjects: boolean;
    setShowProjects: (show: boolean) => void;
    showDBSettings: boolean;
    setShowDBSettings: (show: boolean) => void;
    showArchSettings: boolean;
    setShowArchSettings: (show: boolean) => void;
    isActuallyConnected: boolean;
    isVoiceEnabled: boolean;
    setIsVoiceEnabled: (enabled: boolean) => void;
    projects: string[];
    switchProject: (project: string) => Promise<void>;
    openCreateModal: () => void;
}

export const MainHeader: React.FC<MainHeaderProps> = ({
    fetchGraph, activeProject, showProjects, setShowProjects,
    showDBSettings, setShowDBSettings, showArchSettings, setShowArchSettings,
    isActuallyConnected, isVoiceEnabled, setIsVoiceEnabled,
    projects, switchProject, openCreateModal
}) => {

    const toggleProjects = () => {
        setShowProjects(!showProjects);
        setShowDBSettings(false);
        setShowArchSettings(false);
    };

    const toggleDBSettings = () => {
        setShowDBSettings(!showDBSettings);
        setShowProjects(false);
        setShowArchSettings(false);
    };

    const toggleArchSettings = () => {
        setShowArchSettings(!showArchSettings);
        setShowProjects(false);
        setShowDBSettings(false);
    };

    return (
        <header className="h-16 border-b border-white/5 bg-slate-900/60 backdrop-blur-3xl flex items-center justify-between px-6 z-[100] relative shadow-2xl">
            <div className="flex items-center gap-10">
                <div className="flex items-center gap-3 group cursor-pointer" onClick={() => fetchGraph(activeProject)}>
                    <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/30 group-hover:scale-110 transition-all"><Box size={22} /></div>
                    <div className="flex flex-col leading-none">
                        <span className="text-xl font-black tracking-tighter bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent">NEXUS</span>
                        <span className="text-[9px] font-black text-slate-600 tracking-widest uppercase">3D Neural Browser</span>
                    </div>
                </div>

                <nav className="flex items-center gap-1">
                    <button
                        onClick={toggleProjects}
                        className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border ${showProjects ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'hover:bg-white/5 border-transparent text-slate-400 hover:text-white'}`}
                    >
                        <FolderOpen size={16} /> {activeProject ? `Project: ${activeProject}` : 'Select Project'} <ChevronDown size={14} className={`transition-transform duration-300 ${showProjects ? 'rotate-180' : ''}`} />
                    </button>
                    <button
                        onClick={toggleDBSettings}
                        className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border ${showDBSettings ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'hover:bg-white/5 border-transparent text-slate-400 hover:text-white'}`}
                    >
                        <Server size={16} /> {isActuallyConnected ? 'Link Active' : 'Establish Link'}
                    </button>
                    <button
                        onClick={toggleArchSettings}
                        className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border ${showArchSettings ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'hover:bg-white/5 border-transparent text-slate-400 hover:text-white'}`}
                    >
                        <Layers size={16} /> Global Schema
                    </button>
                </nav>
            </div>

            <div className="flex items-center gap-6">
                <div className="hidden md:flex items-center gap-3 bg-slate-800/40 rounded-2xl px-5 py-2 border border-white/5 shadow-inner cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => setShowDBSettings(true)}>
                    <div className={`w-2 h-2 rounded-full ${isActuallyConnected ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500'} animate-pulse`}></div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{isActuallyConnected ? 'Connected' : 'Offline'}</span>
                </div>

                <button
                    onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                    className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border shadow-lg ${isVoiceEnabled ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' : 'bg-white/5 border-white/5 text-slate-500 hover:text-slate-300'}`}
                >
                    {isVoiceEnabled ? <Mic size={20} className="animate-pulse" /> : <MicOff size={20} />} Voice Hub
                </button>
            </div>

            {/* Project Dropdown */}
            {showProjects && (
                <div className="absolute top-full left-48 mt-4 w-80 glass-panel rounded-[2rem] shadow-[0_32px_80px_rgba(0,0,0,0.6)] p-3 border-white/10 animate-in fade-in slide-in-from-top-4 duration-300 z-[120]">
                    <div className="p-4 flex items-center justify-between border-b border-white/5 mb-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-indigo-300">Neural Clusters</span>
                        <div className="text-indigo-400 text-xs">#</div>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar space-y-1 pr-1">
                        {projects.map(p => (
                            <button
                                key={p}
                                onClick={() => switchProject(p)}
                                className={`w-full text-left px-5 py-4 text-sm font-bold rounded-2xl transition-all flex items-center justify-between group ${activeProject === p ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30' : 'hover:bg-white/5 text-slate-400'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <Box size={14} className={activeProject === p ? 'text-white' : 'text-slate-600 group-hover:text-indigo-400'} />
                                    <span>{p}</span>
                                </div>
                                <ChevronRight size={14} className={`transition-all ${activeProject === p ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'}`} />
                            </button>
                        ))}
                        {projects.length === 0 && (
                            <div className="p-10 text-center flex flex-col items-center gap-3">
                                <Database size={32} className="text-slate-800" />
                                <p className="text-xs text-slate-600 font-medium leading-relaxed italic">No isolated knowledge spaces found.</p>
                            </div>
                        )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/5">
                        <button
                            onClick={openCreateModal}
                            className="w-full flex items-center justify-center gap-3 px-5 py-4 text-xs font-black uppercase tracking-widest text-indigo-400 hover:bg-indigo-500/10 rounded-2xl transition-all border border-dashed border-indigo-500/20 group cursor-pointer"
                        >
                            <Plus size={16} className="group-hover:rotate-90 transition-transform" /> New Project
                        </button>
                    </div>
                </div>
            )}
        </header>
    );
};
