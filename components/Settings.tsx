import * as React from 'react';
import { useState, useEffect } from 'react';
import { Server, Monitor, Cloud, AlertCircle, Loader2, Power, Globe, Layers, Zap, Plus, Check, Database, Edit2, Trash2, Info } from 'lucide-react';
import { SurrealConfig, surrealService } from '../services/surrealService'; // Adjust path if needed
import { GraphData, NodeSchema, EdgeSchema } from '../types';

interface ConnectionSettingsProps {
    show: boolean;
    onClose: () => void;
    dbConfig: SurrealConfig;
    setDbConfig: (config: SurrealConfig) => void;
    onConnect: (config: SurrealConfig) => void;
    loading: boolean;
    errorMsg: string | null;
    setErrorMsg: (msg: string | null) => void;
}

export const ConnectionSettings: React.FC<ConnectionSettingsProps> = ({
    show, onClose, dbConfig, setDbConfig, onConnect, loading, errorMsg, setErrorMsg
}) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[110] bg-slate-950/96 backdrop-blur-3xl flex items-center justify-center p-8 overflow-y-auto">
            <div className="w-full max-w-2xl glass-panel rounded-[3.5rem] flex flex-col overflow-hidden shadow-[0_0_120px_rgba(0,0,0,0.8)] border-white/10 animate-in fade-in zoom-in duration-500">
                <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/[0.03]">
                    <div className="flex items-center gap-6">
                        <div className="p-5 bg-indigo-600 text-white rounded-3xl shadow-2xl shadow-indigo-600/40"><Server size={32} /></div>
                        <div>
                            <h2 className="text-3xl font-black tracking-tight">Management Link</h2>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1.5 opacity-60">Namespace: neuralnexus | Index: neuralindex</p>
                        </div>
                    </div>
                    <button onClick={() => { onClose(); setErrorMsg(null); }} className="p-3 hover:bg-white/10 rounded-2xl transition-all"><div className="w-6 h-6 flex items-center justify-center">✕</div></button>
                </div>

                <div className="p-10 pb-0 flex gap-4 border-b border-white/5">
                    <button
                        onClick={() => setDbConfig({ ...dbConfig, mode: 'local' })}
                        className={`flex-1 py-4 flex items-center justify-center gap-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border ${dbConfig.mode === 'local' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-white/5 border-transparent text-slate-500'}`}
                    >
                        <Monitor size={18} /> Local Instance
                    </button>
                    <button
                        onClick={() => setDbConfig({ ...dbConfig, mode: 'cloud' })}
                        className={`flex-1 py-4 flex items-center justify-center gap-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border ${dbConfig.mode === 'cloud' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-white/5 border-transparent text-slate-500'}`}
                    >
                        <Cloud size={18} /> Surreal Cloud
                    </button>
                </div>

                <div className="p-12 space-y-8 overflow-y-auto custom-scrollbar max-h-[50vh]">
                    {errorMsg && (
                        <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-[2rem] flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <AlertCircle className="text-red-500 shrink-0" size={24} />
                            <p className="text-xs font-bold text-red-400">{errorMsg}</p>
                        </div>
                    )}

                    {dbConfig.mode === 'local' ? (
                        <>
                            <div className="space-y-4">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Endpoint URI</label>
                                <div className="relative">
                                    <Globe size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        value={dbConfig.url}
                                        onChange={e => setDbConfig({ ...dbConfig, url: e.target.value })}
                                        placeholder="http://127.0.0.1:8000/rpc"
                                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-3xl pl-16 pr-8 py-5 text-sm font-bold text-white outline-none focus:border-indigo-500 transition-all shadow-inner"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Security: User</label>
                                    <input value={dbConfig.user} onChange={e => setDbConfig({ ...dbConfig, user: e.target.value })} className="w-full bg-slate-900 border border-slate-700/50 rounded-2xl px-6 py-4 text-xs font-bold text-white outline-none" />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Security: Pass</label>
                                    <input type="password" value={dbConfig.pass} onChange={e => setDbConfig({ ...dbConfig, pass: e.target.value })} className="w-full bg-slate-900 border border-slate-700/50 rounded-2xl px-6 py-4 text-xs font-bold text-white outline-none" />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right duration-300">
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Cloud Hostname</label>
                                <input value={dbConfig.hostname} onChange={e => setDbConfig({ ...dbConfig, hostname: e.target.value })} placeholder="e.g. cluster.cloud.surreal.io" className="w-full bg-slate-900 border border-slate-700/50 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none focus:border-indigo-500" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Instance ID</label>
                                <input value={dbConfig.instanceId} onChange={e => setDbConfig({ ...dbConfig, instanceId: e.target.value })} placeholder="06dl4tglt5..." className="w-full bg-slate-900 border border-slate-700/50 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Authentication AuthToken</label>
                                <textarea value={dbConfig.authToken} onChange={e => setDbConfig({ ...dbConfig, authToken: e.target.value })} rows={3} className="w-full bg-slate-900 border border-slate-700/50 rounded-2xl px-6 py-4 text-[10px] font-mono text-slate-400 outline-none resize-none leading-relaxed" placeholder="eyJhbGciOiJQUzI1NiIs..." />
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-10 bg-white/[0.04] border-t border-white/5">
                    <button
                        onClick={() => onConnect(dbConfig)}
                        disabled={loading}
                        className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-[0.3em] rounded-[2.5rem] shadow-3xl shadow-indigo-600/40 transition-all flex items-center justify-center gap-4 group disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" size={24} /> : <Power size={24} className="group-hover:rotate-90 transition-transform duration-700" />} Establish Link
                    </button>
                </div>
            </div>
        </div>
    );
};

interface SchemaSettingsProps {
    show: boolean;
    onClose: () => void;
    data: GraphData;
    setData: (data: GraphData) => void;
}

export const SchemaSettings: React.FC<SchemaSettingsProps> = ({ show, onClose, data, setData }) => {
    const [editingNodeIndex, setEditingNodeIndex] = useState<number | null>(null);
    const [editingEdgeIndex, setEditingEdgeIndex] = useState<number | null>(null);

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[110] bg-slate-950/98 backdrop-blur-[45px] flex items-center justify-center p-6 xl:p-14 overflow-y-auto">
            <div className="w-full max-w-7xl my-auto glass-panel rounded-[4.5rem] flex flex-col overflow-hidden shadow-[0_0_150px_rgba(0,0,0,0.8)] border-white/10 animate-in fade-in zoom-in duration-700 max-h-[92vh]">
                <div className="p-12 border-b border-white/10 flex justify-between items-center bg-white/[0.03]">
                    <div className="flex items-center gap-8">
                        <div className="p-7 bg-indigo-600 text-white rounded-[2.2rem] shadow-[0_0_40px_rgba(79,70,229,0.5)] transition-transform hover:scale-110"><Layers size={45} /></div>
                        <div>
                            <h2 className="text-5xl font-black tracking-tighter bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent leading-none">Global Architect</h2>
                            <p className="text-[12px] text-slate-500 font-black uppercase tracking-[0.5em] mt-3 opacity-50">Universal Archetypes (neuralindex)</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            surrealService.updateSchema(data.nodeSchema, data.edgeSchema);
                            onClose();
                            setEditingNodeIndex(null);
                            setEditingEdgeIndex(null);
                        }}
                        className="p-7 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] shadow-3xl transition-all hover:scale-105 active:scale-90"
                    >
                        <Check size={40} />
                    </button>
                </div>

                <div className="flex-1 p-16 grid grid-cols-1 xl:grid-cols-2 gap-24 overflow-y-auto custom-scrollbar">
                    <section className="space-y-12">
                        <div className="flex items-center justify-between border-b border-white/10 pb-8 sticky top-0 bg-transparent backdrop-blur-3xl z-20">
                            <div className="flex items-center gap-5">
                                <Zap className="text-indigo-400" size={32} />
                                <h3 className="text-3xl font-black uppercase tracking-tight text-slate-100">Archetypes</h3>
                            </div>
                            <button
                                onClick={() => {
                                    const newSchema: NodeSchema = {
                                        type: 'NewDimension',
                                        nature: 'child',
                                        description: 'Logic archetype...',
                                        color: '#818cf8',
                                        defaultEdge: data.edgeSchema[0]?.sourcetype || 'CHILD_OF',
                                        allowedChildNodes: [], allowedSubNodes: [],
                                        flow_z: 'free', flow_x: 'free', flow_y: 'free'
                                    };
                                    setData({ ...data, nodeSchema: [...data.nodeSchema, newSchema] });
                                    setEditingNodeIndex(data.nodeSchema.length);
                                }}
                                className="px-8 py-4 bg-white/5 hover:bg-indigo-600 text-[13px] font-black text-white uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all flex items-center gap-3 group border border-white/10"
                            >
                                <Plus size={20} /> New Archetype
                            </button>
                        </div>
                        <div className="space-y-12">
                            {data.nodeSchema.map((ns, idx) => (
                                <div key={idx} className={`p-10 rounded-[3.5rem] transition-all duration-700 border ${editingNodeIndex === idx ? 'bg-white/[0.08] border-indigo-500 shadow-[0_0_50px_rgba(79,70,229,0.2)] scale-105' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}>
                                    {editingNodeIndex === idx ? (
                                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-12 duration-700">
                                            <div className="grid grid-cols-2 gap-10">
                                                <div className="space-y-3">
                                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Handle</label>
                                                    <input value={ns.type} onChange={e => { const c = [...data.nodeSchema]; c[idx].type = e.target.value as any; setData({ ...data, nodeSchema: c }); }} className="w-full bg-slate-950 border border-slate-700/50 rounded-2xl px-6 py-5 font-black text-white shadow-inner outline-none focus:border-indigo-500 transition-all" />
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Nature</label>
                                                    <select value={ns.nature} onChange={e => { const c = [...data.nodeSchema]; c[idx].nature = e.target.value as any; setData({ ...data, nodeSchema: c }); }} className="w-full bg-slate-950 border border-slate-700/50 rounded-2xl px-6 py-5 font-black text-white shadow-inner appearance-none cursor-pointer"><option value="child">Structural Parent</option><option value="sub">Informational Leaf</option></select>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-10">
                                                <div className="space-y-3">
                                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Core Color</label>
                                                    <div className="flex items-center gap-5 bg-slate-950 p-2.5 rounded-2xl border border-slate-700/50">
                                                        <input type="color" value={ns.color} onChange={e => { const c = [...data.nodeSchema]; c[idx].color = e.target.value; setData({ ...data, nodeSchema: c }); }} className="w-14 h-14 bg-transparent border-none cursor-pointer rounded-xl overflow-hidden shadow-2xl" />
                                                        <span className="text-xs font-mono font-black text-slate-400 uppercase tracking-[0.2em]">{ns.color}</span>
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Primary Edge</label>
                                                    <select value={ns.defaultEdge} onChange={e => { const c = [...data.edgeSchema]; const target = c.find(es => es.type === e.target.value); if (target) { const cNode = [...data.nodeSchema]; cNode[idx].defaultEdge = target.type; setData({ ...data, nodeSchema: cNode }); } }} className="w-full bg-slate-950 border border-slate-700/50 rounded-2xl px-6 py-5 font-black text-white shadow-inner">
                                                        {data.edgeSchema.map(es => <option key={es.type} value={es.type}>{es.type}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Behavioral Definition</label>
                                                <textarea value={ns.description} onChange={e => { const c = [...data.nodeSchema]; c[idx].description = e.target.value; setData({ ...data, nodeSchema: c }); }} className="w-full bg-slate-950 border border-slate-700/50 rounded-[2.5rem] px-8 py-6 text-sm text-slate-400 font-medium resize-none shadow-inner leading-relaxed" rows={3} />
                                            </div>
                                            <button onClick={() => setEditingNodeIndex(null)} className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white text-[13px] font-black uppercase tracking-[0.3em] rounded-[2.2rem] shadow-3xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-4">
                                                <Check size={24} /> Seal Configuration
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <div className="flex justify-between items-start mb-10">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-10 h-10 rounded-full shadow-[0_0_50px_rgba(0,0,0,0.7)] border-2 border-white/20" style={{ backgroundColor: ns.color }}></div>
                                                    <div>
                                                        <span className="font-black text-3xl tracking-tighter text-white leading-none capitalize">{ns.type}</span>
                                                        <div className="mt-4 flex gap-5">
                                                            <span className="text-[10px] px-4 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-full font-black uppercase tracking-[0.2em] border border-indigo-500/20">{ns.nature}</span>
                                                            <span className="text-[10px] text-slate-600 font-black uppercase tracking-[0.2em] flex items-center gap-2.5 opacity-80"><Database size={13} /> {ns.defaultEdge}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-4">
                                                    <button onClick={() => setEditingNodeIndex(idx)} className="p-4 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-2xl transition-all"><Edit2 size={26} /></button>
                                                    <button onClick={() => { if (confirm("Sever Archetype?")) { setData({ ...data, nodeSchema: data.nodeSchema.filter((_, i) => i !== idx) }); } }} className="p-4 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-2xl transition-all"><Trash2 size={26} /></button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Edge Schema Section - Simplified for brevity but would logically follow similar pattern */}
                    <section className="space-y-12">
                        <div className="flex items-center justify-between border-b border-white/10 pb-8 sticky top-0 bg-transparent backdrop-blur-3xl z-20">
                            <div className="flex items-center gap-5">
                                <Database className="text-emerald-400" size={32} />
                                <h3 className="text-3xl font-black uppercase tracking-tight text-slate-100">Taxonomies</h3>
                            </div>
                            <button onClick={() => {
                                const newSchema: EdgeSchema = {
                                    type: 'NEW_EDGE',
                                    description: 'Relationship logic...',
                                    color: '#10b981',
                                    nature: 'link',
                                    sourcetype: 'topic',
                                    destinationtype: 'topic'
                                };
                                setData({ ...data, edgeSchema: [...data.edgeSchema, newSchema] });
                                setEditingEdgeIndex(data.edgeSchema.length);
                            }} className="px-8 py-4 bg-white/5 hover:bg-emerald-600 text-[13px] font-black text-white uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all flex items-center gap-3 group border border-white/10">
                                <Plus size={20} /> New Taxonomy
                            </button>
                        </div>
                        <div className="space-y-12">
                            {data.edgeSchema.map((es, idx) => (
                                <div key={idx} className="p-10 rounded-[3.5rem] bg-white/[0.02] border border-white/5">
                                    {editingEdgeIndex === idx ? (
                                        <div className="space-y-6">
                                            <label className="text-[11px] font-black text-slate-500 uppercase">Type ID</label>
                                            <input value={es.type} onChange={e => { const c = [...data.edgeSchema]; c[idx].type = e.target.value as any; setData({ ...data, edgeSchema: c }) }} className="w-full bg-slate-950 p-4 rounded-xl text-white font-mono" />
                                            <button onClick={() => setEditingEdgeIndex(null)} className="py-4 w-full bg-emerald-600 text-white rounded-xl font-bold uppercase text-xs">Save</button>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-2xl font-black text-white">{es.type}</p>
                                                <p className="text-xs text-emerald-400 font-bold uppercase mt-2">{es.nature}</p>
                                            </div>
                                            <button onClick={() => setEditingEdgeIndex(idx)}><Edit2 size={20} className="text-slate-500" /></button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                </div>

                <div className="p-14 bg-white/[0.04] border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-8 text-slate-400">
                        <div className="p-5 bg-white/5 rounded-[2.5rem] shadow-2xl"><Info size={40} className="text-indigo-400" /></div>
                        <div className="max-w-3xl">
                            <p className="text-xl font-black text-slate-200 tracking-tight">Architect Blueprint Verified</p>
                            <p className="text-xs font-medium text-slate-500 mt-1.5 leading-relaxed">Archetypes are persistent in the core 'neuralindex' database.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            surrealService.updateSchema(data.nodeSchema, data.edgeSchema);
                            onClose();
                            setEditingNodeIndex(null);
                            setEditingEdgeIndex(null);
                        }}
                        className="px-24 py-9 bg-indigo-600 text-white text-sm font-black uppercase tracking-[0.3em] rounded-[3rem] shadow-4xl shadow-indigo-600/40 transition-all flex items-center gap-8 group"
                    >
                        Commit Dimensional Schema <Database size={32} />
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// EMBEDDING SETTINGS - Provider Toggles
// ============================================================================

import { embeddingTracker, ProviderConfig } from '../services/embeddingTracker';
import { Cpu, Sparkles, Bot, ToggleLeft, ToggleRight } from 'lucide-react';

interface EmbeddingSettingsProps {
    show: boolean;
    onClose: () => void;
}

export const EmbeddingSettings: React.FC<EmbeddingSettingsProps> = ({ show, onClose }) => {
    const [config, setConfig] = useState<ProviderConfig>(embeddingTracker.detectProviderConfig());

    useEffect(() => {
        if (show) {
            setConfig(embeddingTracker.detectProviderConfig());
        }
    }, [show]);

    const toggleProvider = (provider: 'gemini' | 'openai' | 'anthropic') => {
        const newEnabled = !config[provider].enabled;
        embeddingTracker.setProviderEnabled(provider, newEnabled);
        setConfig({
            ...config,
            [provider]: { ...config[provider], enabled: newEnabled }
        });
    };

    if (!show) return null;

    const providers = [
        { key: 'gemini' as const, name: 'Gemini', icon: Sparkles, color: 'indigo', desc: 'Multimodal (Text + Images + Video)' },
        { key: 'openai' as const, name: 'OpenAI', icon: Bot, color: 'emerald', desc: 'Describe-then-Embed Strategy' },
        { key: 'anthropic' as const, name: 'Voyage AI', icon: Cpu, color: 'purple', desc: 'Multimodal via Voyage API' }
    ];

    return (
        <div className="fixed inset-0 z-[110] bg-slate-950/96 backdrop-blur-3xl flex items-center justify-center p-8">
            <div className="w-full max-w-xl glass-panel rounded-[3.5rem] flex flex-col overflow-hidden shadow-[0_0_120px_rgba(0,0,0,0.8)] border-white/10 animate-in fade-in zoom-in duration-500">
                <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/[0.03]">
                    <div className="flex items-center gap-6">
                        <div className="p-5 bg-purple-600 text-white rounded-3xl shadow-2xl shadow-purple-600/40"><Cpu size={32} /></div>
                        <div>
                            <h2 className="text-3xl font-black tracking-tight">Embedding Providers</h2>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1.5 opacity-60">Vector Generation Settings</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-2xl transition-all"><div className="w-6 h-6 flex items-center justify-center">✕</div></button>
                </div>

                <div className="p-10 space-y-6">
                    {providers.map(p => (
                        <div key={p.key} className={`p-8 rounded-[2.5rem] border transition-all ${config[p.key].hasKey ? 'bg-white/[0.04] border-white/10' : 'bg-red-500/5 border-red-500/20 opacity-50'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-5">
                                    <div className={`p-4 bg-${p.color}-600/20 text-${p.color}-400 rounded-2xl`}>
                                        <p.icon size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white">{p.name}</h3>
                                        <p className="text-xs text-slate-500 mt-1">{p.desc}</p>
                                        {!config[p.key].hasKey && (
                                            <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest mt-2">⚠ API Key Missing</p>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => config[p.key].hasKey && toggleProvider(p.key)}
                                    disabled={!config[p.key].hasKey}
                                    className={`p-3 rounded-2xl transition-all ${config[p.key].enabled && config[p.key].hasKey ? 'text-emerald-400' : 'text-slate-600'}`}
                                >
                                    {config[p.key].enabled && config[p.key].hasKey ? <ToggleRight size={40} /> : <ToggleLeft size={40} />}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-8 bg-white/[0.02] border-t border-white/5">
                    <p className="text-xs text-slate-500 text-center">
                        Embeddings are generated when node content changes. Only enabled providers with valid API keys will be used.
                    </p>
                </div>
            </div>
        </div>
    );
};
