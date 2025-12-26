import * as React from 'react';
import { useState, useCallback, useEffect } from 'react';
import GraphCanvas3D from './components/GraphCanvas3D';
import DocumentViewer from './components/DocumentViewer';
import { ConnectionSettings, SchemaSettings } from './components/Settings';
import { MainHeader } from './components/Menus';
import { useAIIntegration } from './components/AIIntegration';
import { GraphData, GraphNode, NodeSchema, EdgeSchema, AxisPreference } from './types';
import { surrealService, SurrealConfig } from './services/surrealService';
import * as ai from './services/geminiService';
import {
    Search, Loader2, Settings, Database, Edit2, Check, X, Plus,
    Layers, Zap, Info, Trash2, Palette, ChevronDown, Move,
    Globe, FolderOpen, Mic, MicOff, Server, LayoutGrid, Box,
    Activity, Power, ChevronRight, Hash, ExternalLink, Cloud, Monitor, AlertCircle
} from 'lucide-react';

const App: React.FC = () => {
    const [data, setData] = useState<GraphData>({ nodes: [], links: [], nodeSchema: [], edgeSchema: [] });
    const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
    const [loading, setLoading] = useState(false);
    const [linkingMode, setLinkingMode] = useState<{ source: GraphNode, edge: string } | null>(null);
    const [editState, setEditState] = useState<{ node: GraphNode, mode: 'Properties' | 'Content' } | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [activeProject, setActiveProject] = useState(localStorage.getItem('surreal_active_project') || '');

    // Overlays State
    const [showArchSettings, setShowArchSettings] = useState(false);
    const [showDBSettings, setShowDBSettings] = useState(false);
    const [showProjects, setShowProjects] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');

    // App Config
    const [dbConfig, setDbConfig] = useState<SurrealConfig>({
        mode: (localStorage.getItem('surreal_mode') as 'local' | 'cloud') || 'local',
        url: localStorage.getItem('surreal_url') || 'http://127.0.0.1:8000/rpc',
        user: localStorage.getItem('surreal_user') || '',
        pass: localStorage.getItem('surreal_pass') || '',
        hostname: localStorage.getItem('surreal_hostname') || '',
        instanceId: localStorage.getItem('surreal_instance_id') || '',
        authToken: localStorage.getItem('surreal_auth_token') || '',
        jwtConfig: localStorage.getItem('surreal_jwt') || '',
        jwksEndpoint: localStorage.getItem('surreal_jwks') || '',
    });
    const [projects, setProjects] = useState<string[]>([]);

    // Voice is currently a placeholder
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);

    const [editingNodeIndex, setEditingNodeIndex] = useState<number | null>(null);
    const [editingEdgeIndex, setEditingEdgeIndex] = useState<number | null>(null);


    const isActuallyConnected = surrealService.isConnected();

    // -- AI Integration Hook --
    const { isGenerating, handleCreateNode } = useAIIntegration(data, (p) => fetchGraph(p), activeProject, setSelectedNode);

    const fetchGraph = async (projectName: string) => {
        if (!surrealService.isConnected() || !projectName) return;
        setLoading(true);
        try {
            const result = await surrealService.fetchGraphData(projectName);
            setData(result);
            if (result.nodes.length > 0 && !selectedNode) {
                // Auto-select root if nothing selected, or keep selection if valid
                const root = result.nodes.find(n => n.id === 'node:root') || result.nodes[0];
                if (!selectedNode) setSelectedNode(root);
            }
        } catch (e) {
            console.error("Fetch data failed:", e);
        }
        setLoading(false);
    };

    const initializeConnection = async (config: SurrealConfig) => {
        setLoading(true);
        setErrorMsg(null);
        try {
            const success = await surrealService.connect(config);
            if (success) {
                // Persist config
                localStorage.setItem('surreal_mode', config.mode);
                localStorage.setItem('surreal_url', config.url);
                localStorage.setItem('surreal_user', config.user || '');
                localStorage.setItem('surreal_pass', config.pass || '');
                localStorage.setItem('surreal_hostname', config.hostname || '');
                localStorage.setItem('surreal_instance_id', config.instanceId || '');
                localStorage.setItem('surreal_auth_token', config.authToken || '');
                localStorage.setItem('surreal_jwt', config.jwtConfig || '');
                localStorage.setItem('surreal_jwks', config.jwksEndpoint || '');

                const projList = await surrealService.listProjects();
                setProjects(projList);

                let targetProj = activeProject;
                if (!projList.includes(activeProject)) {
                    targetProj = projList[0] || '';
                }

                if (targetProj) {
                    setActiveProject(targetProj);
                    await fetchGraph(targetProj);
                } else {
                    setShowProjects(true);
                }

                setShowDBSettings(false);
            } else {
                setErrorMsg("Materialization failed. Verify credentials.");
            }
        } catch (e: any) {
            setErrorMsg(`Link Error: ${e.message || 'Check connection details'}`);
        }
        setLoading(false);
    };

    // Initial load
    useEffect(() => {
        if (dbConfig.url || dbConfig.hostname) {
            initializeConnection(dbConfig);
        }
    }, []);

    const handleAction = async (action: string, payload: any) => {
        if (!surrealService.isConnected()) {
            setShowDBSettings(true);
            return;
        }
        switch (action) {
            case 'CREATE': {
                await handleCreateNode(payload.type, payload.parent, payload.edge);
                break;
            }
            case 'START_LINK':
                setLinkingMode({ source: payload.source, edge: payload.edge });
                break;
            case 'COMPLETE_LINK':
                if (linkingMode) {
                    try {
                        const edgeDef = data.edgeSchema.find(e => e.type === linkingMode.edge);
                        const nature = edgeDef?.nature || 'link';
                        await surrealService.relate(linkingMode.source.id, payload.id, linkingMode.edge, nature);
                        await fetchGraph(activeProject);
                    } catch (e: any) { alert("Link failed: " + e.message); }
                    setLinkingMode(null);
                }
                break;
            case 'CANCEL_LINK':
                setLinkingMode(null);
                break;
            case 'DELETE':
                if (payload.id === 'node:root') {
                    alert("Foundational nodes are core and cannot be purged.");
                    return;
                }
                try {
                    await surrealService.deleteNode(payload.id);
                    await fetchGraph(activeProject);
                    if (selectedNode?.id === payload.id) setSelectedNode(null);
                } catch (e: any) { alert("Delete failed: " + e.message); }
                break;
            case 'EDIT':
                setEditState({ node: payload.node, mode: payload.mode });
                break;
        }
    };

    const calculatePosition = (parent: GraphNode, schema: NodeSchema) => {
        const offset = 150 + Math.random() * 50;
        const getCoord = (axis: AxisPreference, current: number) => {
            if (axis === 'positive') return current + offset;
            if (axis === 'negative') return current - offset;
            if (axis === 'neutral') return current + (Math.random() - 0.5) * 40;
            return current + (Math.random() - 0.5) * offset * 3;
        };
        return {
            x: getCoord(schema.flow_x, parent.x || 0),
            y: getCoord(schema.flow_y, parent.y || 0),
            z: getCoord(schema.flow_z, parent.z || 0)
        };
    };

    const switchProject = async (pName: string) => {
        setActiveProject(pName);
        localStorage.setItem('surreal_active_project', pName);
        setSelectedNode(null);
        await fetchGraph(pName);
        setShowProjects(false);
    };

    const handleCreateProject = async () => {
        if (!newProjectName.trim()) return;
        setLoading(true);
        try {
            const sanitized = await surrealService.createProject(newProjectName);
            const list = await surrealService.listProjects();
            setProjects(list);
            await switchProject(sanitized);
            setShowCreateModal(false);
            setNewProjectName('');
        } catch (e: any) {
            alert("Project Initialization Failed: " + e.message);
        }
        setLoading(false);
    };

    const handleBackgroundClick = () => {
        setSelectedNode(null);
        setEditState(null);
        setLinkingMode(null);
    };

    const handleNodeUpdate = async (updatedNode: GraphNode) => {
        // Optimistic update
        const newNodes = data.nodes.map(n => n.id === updatedNode.id ? updatedNode : n);
        setData({ ...data, nodes: newNodes });

        // Persist to DB
        try {
            await surrealService.updateNodeFields(updatedNode.id, {
                title: updatedNode.title,
                summary: updatedNode.summary,
                content: updatedNode.content,
                color: updatedNode.color,
                media: updatedNode.media,
                metadata: updatedNode.metadata
            });

            // Trigger embedding generation for content changes
            // Import dynamically to avoid circular dependencies
            const { embeddingTracker } = await import('./services/embeddingTracker');
            embeddingTracker.embedNodeIfNeeded(updatedNode).catch(console.error);
        } catch (e) {
            console.error("Failed to save node:", e);
        }
    };

    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
            <MainHeader
                activeProject={activeProject}
                projects={projects}
                isActuallyConnected={isActuallyConnected}
                fetchGraph={fetchGraph}
                switchProject={async (p) => { await switchProject(p); }}
                setShowProjects={setShowProjects}
                showProjects={showProjects}
                showDBSettings={showDBSettings}
                setShowDBSettings={setShowDBSettings}
                showArchSettings={showArchSettings}
                setShowArchSettings={setShowArchSettings}
                isVoiceEnabled={isVoiceEnabled}
                setIsVoiceEnabled={setIsVoiceEnabled}
                openCreateModal={() => setShowCreateModal(true)}
            />

            <main className="flex-1 flex overflow-hidden">
                {/* 3D SPATIAL GRAPH */}
                <div className="relative flex-[1.4] min-w-0 h-full border-r border-slate-900 overflow-hidden bg-slate-950">
                    <div className="w-full h-full">
                        {(!isActuallyConnected || loading || !activeProject) ? (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-10 bg-slate-950">
                                {loading ? (
                                    <div className="flex flex-col items-center gap-6">
                                        <Loader2 className="animate-spin text-indigo-500" size={80} strokeWidth={3} />
                                        <div className="text-center">
                                            <p className="text-slate-400 font-black tracking-[0.4em] text-[11px] uppercase animate-pulse">Establishing Nexus Connection</p>
                                        </div>
                                    </div>
                                ) : !isActuallyConnected ? (
                                    <div className="text-center space-y-4 px-6">
                                        <Power size={80} className="text-slate-800 mx-auto mb-8" />
                                        <h2 className="text-3xl font-black text-slate-200 tracking-tight">Materialization Required</h2>
                                        <button onClick={() => setShowDBSettings(true)} className="mt-8 px-14 py-5 bg-indigo-600 text-white font-black rounded-3xl shadow-3xl shadow-indigo-600/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 mx-auto uppercase tracking-widest text-[10px]">
                                            Establish Link <ExternalLink size={18} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center space-y-4 px-6">
                                        <Box size={80} className="text-slate-800 mx-auto mb-8" />
                                        <h2 className="text-3xl font-black text-slate-200 tracking-tight">Select Knowledge Project</h2>
                                        <div className="mt-8 flex gap-4 justify-center">
                                            <button onClick={() => setShowProjects(true)} className="px-10 py-4 bg-slate-800 text-white font-black rounded-2xl hover:bg-slate-700 transition-all uppercase tracking-widest text-[10px]">
                                                Open Switcher
                                            </button>
                                            <button onClick={() => setShowCreateModal(true)} className="px-10 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:scale-105 shadow-xl shadow-indigo-600/30 transition-all uppercase tracking-widest text-[10px]">
                                                New Project
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <GraphCanvas3D
                                data={data}
                                selectedNodeId={selectedNode?.id || null}
                                onNodeSelect={setSelectedNode}
                                onAction={handleAction}
                                isLinking={!!linkingMode}
                                linkingSource={linkingMode?.source || null}
                                nodeSchema={data.nodeSchema}
                            />
                        )}
                    </div>
                </div>

                <aside className="flex-1 min-w-[550px] h-full shadow-[0_0_80px_rgba(0,0,0,0.5)] z-40 relative bg-white">
                    {editState ? (
                        <div className="h-full flex flex-col bg-white text-slate-900 animate-in slide-in-from-right duration-500">
                            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-indigo-50/40">
                                <div className="flex items-center gap-6">
                                    <div className="p-4 bg-indigo-600 text-white rounded-[1.5rem] shadow-2xl shadow-indigo-600/30"><Edit2 size={32} /></div>
                                    <div>
                                        <h2 className="text-2xl font-black tracking-tighter leading-none mb-1">Editor: {editState.mode}</h2>
                                        <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.2em]">{editState.node.title}</p>
                                    </div>
                                </div>
                                <button onClick={() => setEditState(null)} className="p-3 hover:bg-slate-200 rounded-2xl transition-all"><X size={24} /></button>
                            </div>
                            <div className="flex-1 p-12 overflow-y-auto custom-scrollbar">
                                {editState.mode === 'Content' ? (
                                    <textarea
                                        defaultValue={editState.node.content}
                                        className="w-full h-full p-10 border border-slate-200 rounded-[3rem] outline-none focus:ring-[20px] focus:ring-indigo-500/5 font-mono text-base leading-relaxed shadow-inner"
                                    />
                                ) : (
                                    <div className="space-y-12 max-w-2xl mx-auto py-6">
                                        <div className="space-y-4">
                                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Knowledge Label</label>
                                            <input type="text" defaultValue={editState.node.title} className="w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl font-black text-xl focus:bg-white transition-all shadow-sm focus:ring-8 focus:ring-indigo-500/5" />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Neural Abstract</label>
                                            <textarea defaultValue={editState.node.summary} className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] h-56 resize-none font-bold text-slate-600 leading-relaxed shadow-sm focus:bg-white transition-all focus:ring-8 focus:ring-indigo-500/5" />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="p-10 bg-slate-50 border-t border-slate-100 flex justify-end gap-6">
                                <button onClick={() => setEditState(null)} className="px-10 py-5 font-black uppercase tracking-widest text-slate-400 hover:text-slate-800 transition-colors">Discard</button>
                                <button onClick={() => { alert('Changes Committed to Core'); setEditState(null); }} className="px-16 py-5 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-3xl shadow-3xl shadow-indigo-600/30 hover:scale-[1.03] active:scale-95 transition-all">
                                    Sync with Project
                                </button>
                            </div>
                        </div>
                    ) : (
                        <DocumentViewer
                            node={selectedNode}
                            onExpand={(t, type, e) => handleAction('CREATE', { parent: selectedNode, type, edge: e })}
                            onDelete={(id) => handleAction('DELETE', { id })}
                            isGenerating={isGenerating}
                            nodeSchema={data.nodeSchema}
                            edgeSchema={data.edgeSchema}
                            allNodes={data.nodes}
                        />
                    )}
                </aside>
            </main>

            {/* MODALS */}
            {showDBSettings && (
                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center pointer-events-auto">
                    <ConnectionSettings
                        dbConfig={dbConfig}
                        setDbConfig={setDbConfig}
                        onConnect={initializeConnection}
                        onClose={() => setShowDBSettings(false)}
                        loading={loading}
                        errorMsg={errorMsg}
                        setErrorMsg={setErrorMsg}
                        show={true}
                    />
                </div>
            )}

            {showArchSettings && (
                <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md overflow-y-auto pointer-events-auto">
                    <SchemaSettings
                        show={true}
                        onClose={() => setShowArchSettings(false)}
                        data={data}
                        setData={setData}
                    />
                </div>
            )}

            {showCreateModal && (
                <div className="fixed inset-0 z-[150] bg-slate-950/90 backdrop-blur-3xl flex items-center justify-center p-8">
                    <div className="w-full max-w-lg glass-panel rounded-[3.5rem] flex flex-col overflow-hidden shadow-[0_0_120px_rgba(0,0,0,0.8)] border-white/10 animate-in fade-in zoom-in duration-300">
                        <div className="p-10 border-b border-white/5 flex justify-between items-center">
                            <div className="flex items-center gap-6">
                                <div className="p-5 bg-indigo-600 text-white rounded-3xl shadow-2xl shadow-indigo-600/40"><Plus size={32} /></div>
                                <h2 className="text-3xl font-black tracking-tight">New Project</h2>
                            </div>
                            <button onClick={() => setShowCreateModal(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-all text-slate-500"><X size={32} /></button>
                        </div>
                        <div className="p-12 space-y-8">
                            <div className="space-y-4">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Knowledge Label</label>
                                <input
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    placeholder="e.g. Molecular Biology"
                                    className="w-full bg-slate-900 border border-slate-700/50 rounded-3xl px-8 py-5 text-lg font-bold text-white outline-none focus:border-indigo-500 transition-all shadow-inner"
                                />
                                <p className="text-[10px] text-slate-600 font-medium italic ml-1">This name will be sanitized for database identification.</p>
                            </div>
                            <button
                                onClick={handleCreateProject}
                                disabled={loading || !newProjectName.trim()}
                                className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-[0.3em] rounded-[2.5rem] shadow-3xl shadow-indigo-600/40 transition-all flex items-center justify-center gap-4 group disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin" size={24} /> : <Check size={24} />} Initialize project
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
