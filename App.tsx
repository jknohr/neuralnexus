
import React, { useState, useEffect, useCallback } from 'react';
import GraphCanvas3D from './components/GraphCanvas3D';
import DocumentViewer from './components/DocumentViewer';
import { GraphData, GraphNode, GraphEdge, NodeSchema, EdgeSchema, AxisPreference, EdgeBehavior, NodeNature } from './types';
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [linkingMode, setLinkingMode] = useState<{ source: GraphNode, edge: string } | null>(null);
  const [editState, setEditState] = useState<{ node: GraphNode, mode: 'Properties' | 'Content' } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeProject, setActiveProject] = useState(localStorage.getItem('surreal_active_project') || '');
  
  // Overlays
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
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);

  const [editingNodeIndex, setEditingNodeIndex] = useState<number | null>(null);
  const [editingEdgeIndex, setEditingEdgeIndex] = useState<number | null>(null);

  const isActuallyConnected = surrealService.isConnected();

  const fetchGraph = async (projectName: string) => {
    if (!surrealService.isConnected() || !projectName) return;
    setLoading(true);
    try {
        const result = await surrealService.fetchGraphData(projectName);
        setData(result);
        if (result.nodes.length > 0) {
          const root = result.nodes.find(n => n.id === 'node:root') || result.nodes[0];
          setSelectedNode(root);
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
        const title = prompt(`Enter title for new ${payload.type}:`);
        if (!title) return;
        setIsGenerating(true);
        try {
          const schema = data.nodeSchema.find(s => s.type === payload.type)!;
          const pos = calculatePosition(payload.parent, schema);
          const pkg = await ai.generateNodePackage(title, payload.parent.title);
          const newNode: GraphNode = {
              id: `node:${title.toLowerCase().replace(/\s+/g, '_')}_${Math.random().toString(36).substr(2, 4)}`,
              title,
              summary: pkg.summary,
              content: pkg.content,
              type: payload.type,
              val: schema.nature === 'child' ? 18 : 12,
              color: schema.color,
              ...pos
          };
          await surrealService.createNode(newNode);
          await surrealService.relate(newNode.id, payload.parent.id, payload.edge);
          await fetchGraph(activeProject);
          setSelectedNode(newNode);
        } catch (e: any) {
          alert("Action failed: " + e.message);
        } finally {
          setIsGenerating(false);
        }
        break;
      }
      case 'START_LINK':
        setLinkingMode({ source: payload.source, edge: payload.edge });
        break;
      case 'COMPLETE_LINK':
        if (linkingMode) {
          try {
            await surrealService.relate(linkingMode.source.id, payload.id, linkingMode.edge);
            await fetchGraph(activeProject);
          } catch(e: any) { alert("Link failed: " + e.message); }
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
        } catch(e: any) { alert("Delete failed: " + e.message); }
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
      x: getCoord(schema.xAxis, parent.x || 0),
      y: getCoord(schema.yAxis, parent.y || 0),
      z: getCoord(schema.zAxis, parent.z || 0)
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

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      
      {/* GLOBAL COMMAND BAR */}
      <header className="h-16 border-b border-white/5 bg-slate-900/60 backdrop-blur-3xl flex items-center justify-between px-6 z-[100] relative shadow-2xl">
        <div className="flex items-center gap-10">
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => fetchGraph(activeProject)}>
                <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/30 group-hover:scale-110 transition-all"><Box size={22}/></div>
                <div className="flex flex-col leading-none">
                    <span className="text-xl font-black tracking-tighter bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent">NEXUS</span>
                    <span className="text-[9px] font-black text-slate-600 tracking-widest uppercase">3D Neural Browser</span>
                </div>
            </div>
            
            <nav className="flex items-center gap-1">
                <button 
                  onClick={() => { setShowProjects(!showProjects); setShowDBSettings(false); setShowArchSettings(false); }}
                  className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border ${showProjects ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'hover:bg-white/5 border-transparent text-slate-400 hover:text-white'}`}
                >
                    <FolderOpen size={16}/> {activeProject ? `Project: ${activeProject}` : 'Select Project'} <ChevronDown size={14} className={`transition-transform duration-300 ${showProjects ? 'rotate-180' : ''}`}/>
                </button>
                <button 
                  onClick={() => { setShowDBSettings(!showDBSettings); setShowProjects(false); setShowArchSettings(false); }}
                  className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border ${showDBSettings ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'hover:bg-white/5 border-transparent text-slate-400 hover:text-white'}`}
                >
                    <Server size={16}/> {isActuallyConnected ? 'Link Active' : 'Establish Link'}
                </button>
                <button 
                  onClick={() => { setShowArchSettings(!showArchSettings); setShowProjects(false); setShowDBSettings(false); }}
                  className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border ${showArchSettings ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'hover:bg-white/5 border-transparent text-slate-400 hover:text-white'}`}
                >
                    <Layers size={16}/> Global Schema
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
                {isVoiceEnabled ? <Mic size={20} className="animate-pulse"/> : <MicOff size={20}/>} Voice Hub
            </button>
        </div>

        {/* Project Dropdown */}
        {showProjects && (
            <div className="absolute top-full left-48 mt-4 w-80 glass-panel rounded-[2rem] shadow-[0_32px_80px_rgba(0,0,0,0.6)] p-3 border-white/10 animate-in fade-in slide-in-from-top-4 duration-300 z-[120]">
                <div className="p-4 flex items-center justify-between border-b border-white/5 mb-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-indigo-300">Neural Clusters</span>
                    <Hash size={12} className="text-indigo-400" />
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
                        onClick={() => { setShowCreateModal(true); setShowProjects(false); }}
                        className="w-full flex items-center justify-center gap-3 px-5 py-4 text-xs font-black uppercase tracking-widest text-indigo-400 hover:bg-indigo-500/10 rounded-2xl transition-all border border-dashed border-indigo-500/20 group cursor-pointer"
                    >
                        <Plus size={16} className="group-hover:rotate-90 transition-transform" /> New Project
                    </button>
                </div>
            </div>
        )}
      </header>

      {/* MAIN LAYOUT */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* 3D SPATIAL GRAPH */}
        <div className="relative flex-[1.4] min-w-0 h-full border-r border-slate-900 overflow-hidden bg-slate-950">
            {activeProject && (
              <div className="absolute top-8 left-8 right-8 z-30 pointer-events-none flex items-start justify-between gap-4">
                  <div className="flex-1 max-w-lg pointer-events-auto">
                      <div className="glass-panel rounded-3xl p-1 shadow-2xl flex items-center border-white/10 neo-shadow group focus-within:ring-4 focus-within:ring-indigo-500/20 transition-all">
                          <div className="pl-6 pr-3 text-slate-500 group-focus-within:text-indigo-400"><Search size={22} /></div>
                          <input type="text" placeholder="Transcend through data..." className="bg-transparent border-none outline-none py-4 text-base w-full font-medium text-slate-200" />
                      </div>
                  </div>
                  <div className="flex items-center gap-4 pointer-events-auto">
                    <div className="glass-panel rounded-3xl px-8 py-5 flex items-center gap-10 shadow-2xl border-white/10 relative">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none">Neurons</span>
                            <span className="text-2xl font-black text-indigo-400 mt-1">{data.nodes.length}</span>
                        </div>
                        <div className="w-px h-10 bg-white/5"></div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none">Synapses</span>
                            <span className="text-2xl font-black text-emerald-400 mt-1">{data.links.length}</span>
                        </div>
                    </div>
                  </div>
              </div>
            )}

            <div className="w-full h-full">
                {(!isActuallyConnected || loading || !activeProject) ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-10 bg-slate-950">
                        {loading ? (
                             <div className="flex flex-col items-center gap-6">
                                <Loader2 className="animate-spin text-indigo-500" size={80} strokeWidth={3} />
                                <div className="text-center">
                                    <p className="text-slate-400 font-black tracking-[0.4em] text-[11px] uppercase animate-pulse">Establishing Nexus Connection</p>
                                    <p className="text-slate-600 text-xs mt-2 font-medium italic text-indigo-300">Synchronizing neuralnexus:neuralindex...</p>
                                </div>
                             </div>
                        ) : !isActuallyConnected ? (
                            <>
                                <div className="relative">
                                    <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full"></div>
                                    <div className="relative p-12 bg-slate-900 rounded-[4rem] border border-white/5 shadow-2xl animate-in zoom-in duration-1000">
                                        <Power size={80} className="text-slate-800" />
                                    </div>
                                </div>
                                <div className="text-center space-y-4 px-6">
                                    <h2 className="text-3xl font-black text-slate-200 tracking-tight">Materialization Required</h2>
                                    <p className="text-slate-500 max-w-md mx-auto font-medium leading-relaxed italic">The core namespace 'neuralnexus' must be materialized to start indexing knowledge.</p>
                                    <button onClick={() => setShowDBSettings(true)} className="mt-8 px-14 py-5 bg-indigo-600 text-white font-black rounded-3xl shadow-3xl shadow-indigo-600/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 mx-auto uppercase tracking-widest text-[10px]">
                                        Establish Link <ExternalLink size={18}/>
                                    </button>
                                </div>
                            </>
                        ) : (
                          <>
                                <div className="relative">
                                    <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full"></div>
                                    <div className="relative p-12 bg-slate-900 rounded-[4rem] border border-white/5 shadow-2xl animate-in zoom-in duration-1000">
                                        <Box size={80} className="text-slate-800" />
                                    </div>
                                </div>
                                <div className="text-center space-y-4 px-6">
                                    <h2 className="text-3xl font-black text-slate-200 tracking-tight">Select Knowledge Project</h2>
                                    <p className="text-slate-500 max-w-md mx-auto font-medium leading-relaxed italic">Choose an existing cluster or initialize a new project dimension.</p>
                                    <div className="mt-8 flex gap-4 justify-center">
                                      <button onClick={() => setShowProjects(true)} className="px-10 py-4 bg-slate-800 text-white font-black rounded-2xl hover:bg-slate-700 transition-all uppercase tracking-widest text-[10px]">
                                          Open Switcher
                                      </button>
                                      <button onClick={() => setShowCreateModal(true)} className="px-10 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:scale-105 shadow-xl shadow-indigo-600/30 transition-all uppercase tracking-widest text-[10px]">
                                          New Project
                                      </button>
                                    </div>
                                </div>
                            </>
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

        {/* INFORMATION PANE */}
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
                    <button onClick={() => setEditState(null)} className="p-3 hover:bg-slate-200 rounded-2xl transition-all"><X size={24}/></button>
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
              />
            )}
        </aside>
      </main>

      {/* MODAL: CREATE PROJECT */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[150] bg-slate-950/90 backdrop-blur-3xl flex items-center justify-center p-8">
            <div className="w-full max-w-lg glass-panel rounded-[3.5rem] flex flex-col overflow-hidden shadow-[0_0_120px_rgba(0,0,0,0.8)] border-white/10 animate-in fade-in zoom-in duration-300">
                <div className="p-10 border-b border-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <div className="p-5 bg-indigo-600 text-white rounded-3xl shadow-2xl shadow-indigo-600/40"><Plus size={32}/></div>
                        <h2 className="text-3xl font-black tracking-tight">New Project</h2>
                    </div>
                    <button onClick={() => setShowCreateModal(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-all text-slate-500"><X size={32}/></button>
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
                        {loading ? <Loader2 className="animate-spin" size={24}/> : <Check size={24}/>} Initialize project
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* MODAL: CONNECTION HUB */}
      {showDBSettings && (
        <div className="fixed inset-0 z-[110] bg-slate-950/96 backdrop-blur-3xl flex items-center justify-center p-8 overflow-y-auto">
            <div className="w-full max-w-2xl glass-panel rounded-[3.5rem] flex flex-col overflow-hidden shadow-[0_0_120px_rgba(0,0,0,0.8)] border-white/10 animate-in fade-in zoom-in duration-500">
                <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/[0.03]">
                    <div className="flex items-center gap-6">
                        <div className="p-5 bg-indigo-600 text-white rounded-3xl shadow-2xl shadow-indigo-600/40"><Server size={32}/></div>
                        <div>
                            <h2 className="text-3xl font-black tracking-tight">Management Link</h2>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1.5 opacity-60">Namespace: neuralnexus | Index: neuralindex</p>
                        </div>
                    </div>
                    <button onClick={() => { setShowDBSettings(false); setErrorMsg(null); }} className="p-3 hover:bg-white/10 rounded-2xl transition-all"><X size={32}/></button>
                </div>

                <div className="p-10 pb-0 flex gap-4 border-b border-white/5">
                    <button 
                        onClick={() => setDbConfig({...dbConfig, mode: 'local'})}
                        className={`flex-1 py-4 flex items-center justify-center gap-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border ${dbConfig.mode === 'local' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-white/5 border-transparent text-slate-500'}`}
                    >
                        <Monitor size={18}/> Local Instance
                    </button>
                    <button 
                        onClick={() => setDbConfig({...dbConfig, mode: 'cloud'})}
                        className={`flex-1 py-4 flex items-center justify-center gap-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border ${dbConfig.mode === 'cloud' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-white/5 border-transparent text-slate-500'}`}
                    >
                        <Cloud size={18}/> Surreal Cloud
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
                                        onChange={e => setDbConfig({...dbConfig, url: e.target.value})}
                                        placeholder="http://127.0.0.1:8000/rpc"
                                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-3xl pl-16 pr-8 py-5 text-sm font-bold text-white outline-none focus:border-indigo-500 transition-all shadow-inner"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Security: User</label>
                                    <input value={dbConfig.user} onChange={e => setDbConfig({...dbConfig, user: e.target.value})} className="w-full bg-slate-900 border border-slate-700/50 rounded-2xl px-6 py-4 text-xs font-bold text-white outline-none" />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Security: Pass</label>
                                    <input type="password" value={dbConfig.pass} onChange={e => setDbConfig({...dbConfig, pass: e.target.value})} className="w-full bg-slate-900 border border-slate-700/50 rounded-2xl px-6 py-4 text-xs font-bold text-white outline-none" />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right duration-300">
                             <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Cloud Hostname</label>
                                <input value={dbConfig.hostname} onChange={e => setDbConfig({...dbConfig, hostname: e.target.value})} placeholder="e.g. cluster.cloud.surreal.io" className="w-full bg-slate-900 border border-slate-700/50 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none focus:border-indigo-500" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Instance ID</label>
                                <input value={dbConfig.instanceId} onChange={e => setDbConfig({...dbConfig, instanceId: e.target.value})} placeholder="06dl4tglt5..." className="w-full bg-slate-900 border border-slate-700/50 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Authentication AuthToken</label>
                                <textarea value={dbConfig.authToken} onChange={e => setDbConfig({...dbConfig, authToken: e.target.value})} rows={3} className="w-full bg-slate-900 border border-slate-700/50 rounded-2xl px-6 py-4 text-[10px] font-mono text-slate-400 outline-none resize-none leading-relaxed" placeholder="eyJhbGciOiJQUzI1NiIs..." />
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-10 bg-white/[0.04] border-t border-white/5">
                    <button 
                        onClick={() => initializeConnection(dbConfig)}
                        disabled={loading}
                        className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-[0.3em] rounded-[2.5rem] shadow-3xl shadow-indigo-600/40 transition-all flex items-center justify-center gap-4 group disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" size={24}/> : <Power size={24} className="group-hover:rotate-90 transition-transform duration-700"/>} Establish Link
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* SCHEMA SETTINGS OVERLAY */}
      {showArchSettings && (
        <div className="fixed inset-0 z-[110] bg-slate-950/98 backdrop-blur-[45px] flex items-center justify-center p-6 xl:p-14 overflow-y-auto">
           <div className="w-full max-w-7xl my-auto glass-panel rounded-[4.5rem] flex flex-col overflow-hidden shadow-[0_0_150px_rgba(0,0,0,0.8)] border-white/10 animate-in fade-in zoom-in duration-700 max-h-[92vh]">
              <div className="p-12 border-b border-white/10 flex justify-between items-center bg-white/[0.03]">
                  <div className="flex items-center gap-8">
                      <div className="p-7 bg-indigo-600 text-white rounded-[2.2rem] shadow-[0_0_40px_rgba(79,70,229,0.5)] transition-transform hover:scale-110"><Layers size={45}/></div>
                      <div>
                        <h2 className="text-5xl font-black tracking-tighter bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent leading-none">Global Architect</h2>
                        <p className="text-[12px] text-slate-500 font-black uppercase tracking-[0.5em] mt-3 opacity-50">Universal Archetypes (neuralindex)</p>
                      </div>
                  </div>
                  <button 
                    onClick={() => { 
                      surrealService.updateSchema(data.nodeSchema, data.edgeSchema); 
                      setShowArchSettings(false); 
                      setEditingNodeIndex(null);
                      setEditingEdgeIndex(null);
                    }} 
                    className="p-7 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] shadow-3xl transition-all hover:scale-105 active:scale-90"
                  >
                    <Check size={40}/>
                  </button>
              </div>

              <div className="flex-1 p-16 grid grid-cols-1 xl:grid-cols-2 gap-24 overflow-y-auto custom-scrollbar">
                  <section className="space-y-12">
                      <div className="flex items-center justify-between border-b border-white/10 pb-8 sticky top-0 bg-transparent backdrop-blur-3xl z-20">
                        <div className="flex items-center gap-5">
                            <Zap className="text-indigo-400" size={32}/>
                            <h3 className="text-3xl font-black uppercase tracking-tight text-slate-100">Archetypes</h3>
                        </div>
                        <button 
                          onClick={() => {
                            const newSchema: NodeSchema = {
                              type: 'NewDimension',
                              nature: 'child',
                              description: 'Logic archetype...',
                              color: '#818cf8',
                              defaultEdge: data.edgeSchema[0]?.type || 'CHILD_OF',
                              allowedEdges: [data.edgeSchema[0]?.type || 'CHILD_OF'],
                              zAxis: 'free', xAxis: 'free', yAxis: 'free'
                            };
                            setData({...data, nodeSchema: [...data.nodeSchema, newSchema]});
                            setEditingNodeIndex(data.nodeSchema.length);
                          }}
                          className="px-8 py-4 bg-white/5 hover:bg-indigo-600 text-[13px] font-black text-white uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all flex items-center gap-3 group border border-white/10"
                        >
                            <Plus size={20}/> New Archetype
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
                                                  <input value={ns.type} onChange={e => { const c = [...data.nodeSchema]; c[idx].type = e.target.value; setData({...data, nodeSchema: c}); }} className="w-full bg-slate-950 border border-slate-700/50 rounded-2xl px-6 py-5 font-black text-white shadow-inner outline-none focus:border-indigo-500 transition-all" />
                                              </div>
                                              <div className="space-y-3">
                                                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Nature</label>
                                                  <select value={ns.nature} onChange={e => { const c = [...data.nodeSchema]; c[idx].nature = e.target.value as any; setData({...data, nodeSchema: c}); }} className="w-full bg-slate-950 border border-slate-700/50 rounded-2xl px-6 py-5 font-black text-white shadow-inner appearance-none cursor-pointer"><option value="child">Structural Parent</option><option value="sub">Informational Leaf</option></select>
                                              </div>
                                          </div>
                                          <div className="grid grid-cols-2 gap-10">
                                              <div className="space-y-3">
                                                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Core Color</label>
                                                  <div className="flex items-center gap-5 bg-slate-950 p-2.5 rounded-2xl border border-slate-700/50">
                                                      <input type="color" value={ns.color} onChange={e => { const c = [...data.nodeSchema]; c[idx].color = e.target.value; setData({...data, nodeSchema: c}); }} className="w-14 h-14 bg-transparent border-none cursor-pointer rounded-xl overflow-hidden shadow-2xl"/>
                                                      <span className="text-xs font-mono font-black text-slate-400 uppercase tracking-[0.2em]">{ns.color}</span>
                                                  </div>
                                              </div>
                                              <div className="space-y-3">
                                                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Primary Edge</label>
                                                  <select value={ns.defaultEdge} onChange={e => { const c = [...data.edgeSchema]; const target = c.find(es => es.type === e.target.value); if(target) { const cNode = [...data.nodeSchema]; cNode[idx].defaultEdge = target.type; setData({...data, nodeSchema: cNode}); } }} className="w-full bg-slate-950 border border-slate-700/50 rounded-2xl px-6 py-5 font-black text-white shadow-inner">
                                                      {data.edgeSchema.map(es => <option key={es.type} value={es.type}>{es.label}</option>)}
                                                  </select>
                                              </div>
                                          </div>
                                          <div className="space-y-3">
                                              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Behavioral Definition</label>
                                              <textarea value={ns.description} onChange={e => { const c = [...data.nodeSchema]; c[idx].description = e.target.value; setData({...data, nodeSchema: c}); }} className="w-full bg-slate-950 border border-slate-700/50 rounded-[2.5rem] px-8 py-6 text-sm text-slate-400 font-medium resize-none shadow-inner leading-relaxed" rows={3}/>
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
                                                          <span className="text-[10px] text-slate-600 font-black uppercase tracking-[0.2em] flex items-center gap-2.5 opacity-80"><Database size={13}/> {ns.defaultEdge}</span>
                                                      </div>
                                                  </div>
                                              </div>
                                              <div className="flex gap-4">
                                                  <button onClick={() => setEditingNodeIndex(idx)} className="p-4 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-2xl transition-all"><Edit2 size={26}/></button>
                                                  <button onClick={() => { if(confirm("Sever Archetype?")) { setData({...data, nodeSchema: data.nodeSchema.filter((_, i) => i !== idx)}); } }} className="p-4 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-2xl transition-all"><Trash2 size={26}/></button>
                                              </div>
                                          </div>
                                      </div>
                                  )}
                              </div>
                          ))}
                      </div>
                  </section>

                  <section className="space-y-12">
                       <div className="flex items-center justify-between border-b border-white/10 pb-8 sticky top-0 bg-transparent backdrop-blur-3xl z-20">
                        <div className="flex items-center gap-5">
                            <Database className="text-emerald-400" size={32}/>
                            <h3 className="text-3xl font-black uppercase tracking-tight text-slate-100">Taxonomies</h3>
                        </div>
                        <button onClick={() => {
                            const newSchema: EdgeSchema = { type: 'NEW_EDGE', description: 'Relationship logic...', color: '#10b981', label: 'New Link', behavior: 'link' };
                            setData({...data, edgeSchema: [...data.edgeSchema, newSchema]});
                            setEditingEdgeIndex(data.edgeSchema.length);
                        }} className="px-8 py-4 bg-white/5 hover:bg-emerald-600 text-[13px] font-black text-white uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all flex items-center gap-3 group border border-white/10">
                            <Plus size={20}/> New Taxonomy
                        </button>
                      </div>
                      <div className="space-y-12">
                          {data.edgeSchema.map((es, idx) => (
                              <div key={idx} className={`p-10 rounded-[3.5rem] transition-all duration-700 border ${editingEdgeIndex === idx ? 'bg-white/[0.08] border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.15)] scale-105' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}>
                                  {editingEdgeIndex === idx ? (
                                      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-12 duration-700">
                                          <div className="grid grid-cols-2 gap-10">
                                              <div className="space-y-3">
                                                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Unique ID</label>
                                                  <input value={es.type} onChange={e => { const c = [...data.edgeSchema]; c[idx].type = e.target.value.toUpperCase(); setData({...data, edgeSchema: c}); }} className="w-full bg-slate-950 border border-slate-700/50 rounded-2xl px-6 py-5 font-black text-white shadow-inner uppercase font-mono tracking-widest" placeholder="TYPE_ID"/>
                                              </div>
                                              <div className="space-y-3">
                                                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Visual Label</label>
                                                  <input value={es.label} onChange={e => { const c = [...data.edgeSchema]; c[idx].label = e.target.value; setData({...data, edgeSchema: c}); }} className="w-full bg-slate-950 border border-slate-700/50 rounded-2xl px-6 py-5 font-black text-white shadow-inner" placeholder="Public Handle"/>
                                              </div>
                                          </div>
                                          <div className="grid grid-cols-2 gap-10">
                                              <div className="space-y-3">
                                                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Relational Color</label>
                                                  <div className="flex items-center gap-5 bg-slate-950 p-2.5 rounded-2xl border border-slate-700/50">
                                                      <input type="color" value={es.color} onChange={e => { const c = [...data.edgeSchema]; c[idx].color = e.target.value; setData({...data, edgeSchema: c}); }} className="w-14 h-14 bg-transparent border-none cursor-pointer rounded-xl overflow-hidden shadow-2xl"/>
                                                      <span className="text-xs font-mono font-black text-slate-400 uppercase tracking-[0.2em]">{es.color}</span>
                                                  </div>
                                              </div>
                                              <div className="space-y-3">
                                                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Cluster Behavior</label>
                                                  <select value={es.behavior} onChange={e => { const c = [...data.edgeSchema]; c[idx].behavior = e.target.value as any; setData({...data, edgeSchema: c}); }} className="w-full bg-slate-950 border border-slate-700/50 rounded-2xl px-6 py-5 font-black text-white shadow-inner appearance-none cursor-pointer"><option value="link">Cross-Link (Flat)</option><option value="child">Downward (Structural)</option><option value="nested">Sub-topic (Leaf)</option></select>
                                              </div>
                                          </div>
                                          <button onClick={() => setEditingEdgeIndex(null)} className="w-full py-6 bg-emerald-600 hover:bg-emerald-500 text-white text-[13px] font-black uppercase tracking-[0.3em] rounded-[2.2rem] shadow-3xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-4 group">
                                              <Check size={24}/> Consolidate Taxonomy
                                          </button>
                                      </div>
                                  ) : (
                                      <div className="relative">
                                          <div className="flex justify-between items-center mb-10">
                                              <div className="flex items-center gap-8">
                                                  <div className="w-24 h-2.5 rounded-full shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-white/20" style={{ backgroundColor: es.color }}></div>
                                                  <div>
                                                      <p className="text-3xl font-black text-white tracking-tighter leading-none">{es.label}</p>
                                                      <p className="text-[11px] text-emerald-400 font-black uppercase tracking-[0.3em] mt-3.5 leading-none opacity-90">{es.behavior}</p>
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  )}
                              </div>
                          ))}
                      </div>
                  </section>
              </div>

              <div className="p-14 bg-white/[0.04] border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-8 text-slate-400">
                      <div className="p-5 bg-white/5 rounded-[2.5rem] shadow-2xl"><Info size={40} className="text-indigo-400"/></div>
                      <div className="max-w-3xl">
                          <p className="text-xl font-black text-slate-200 tracking-tight">Architect Blueprint Verified</p>
                          <p className="text-xs font-medium text-slate-500 mt-1.5 leading-relaxed">Archetypes are persistent in the core 'neuralindex' database.</p>
                      </div>
                  </div>
                  <button 
                    onClick={() => { 
                        surrealService.updateSchema(data.nodeSchema, data.edgeSchema); 
                        setShowArchSettings(false); 
                    }}
                    className="px-24 py-9 bg-indigo-600 text-white text-sm font-black uppercase tracking-[0.3em] rounded-[3rem] shadow-4xl shadow-indigo-600/40 transition-all flex items-center gap-8 group"
                  >
                    Commit Dimensional Schema <Database size={32} />
                  </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
