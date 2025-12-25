
import React, { useRef, useEffect, useCallback, useState } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { GraphData, GraphNode, NodeSchema } from '../types';
import * as THREE from 'three';
import { PlusCircle, Link, Edit3, Trash2, ChevronRight } from 'lucide-react';

interface GraphCanvas3DProps {
  data: GraphData;
  selectedNodeId: string | null;
  onNodeSelect: (node: GraphNode) => void;
  onAction: (action: string, payload: any) => void;
  isLinking: boolean;
  linkingSource: GraphNode | null;
  nodeSchema: NodeSchema[];
}

const GraphCanvas3D: React.FC<GraphCanvas3DProps> = ({ data, selectedNodeId, onNodeSelect, onAction, isLinking, linkingSource, nodeSchema }) => {
  // Fix: Added null as initial value to useRef to satisfy TypeScript requirements and avoid "Expected 1 arguments" error
  const fgRef = useRef<any>(null);
  const [menu, setMenu] = useState<{ x: number, y: number, node: GraphNode, layer: number, subItems?: any[] } | null>(null);

  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force('link').distance(150).strength(0.5);
      fgRef.current.d3Force('charge').strength(-400);
    }
  }, [data]);

  const handleNodeClick = useCallback((node: any) => {
    if (!node || !fgRef.current) return;
    setMenu(null);
    if (isLinking && linkingSource) {
      onAction('COMPLETE_LINK', node);
      return;
    }
    const x = typeof node.x === 'number' ? node.x : 0;
    const y = typeof node.y === 'number' ? node.y : 0;
    const z = typeof node.z === 'number' ? node.z : 0;
    fgRef.current.cameraPosition({ x: x * 1.5, y: y * 1.5, z: z * 1.5 + 300 }, { x, y, z }, 1200);
    onNodeSelect(node as GraphNode);
  }, [onNodeSelect, isLinking, linkingSource, onAction]);

  const handleRightClick = useCallback((node: any, event: MouseEvent) => {
    event.preventDefault();
    if (!node) return;
    setMenu({ x: event.clientX, y: event.clientY, node: node as GraphNode, layer: 1 });
  }, []);

  const closeMenu = () => setMenu(null);

  const nodeThreeObject = useCallback((node: any) => {
    const isSelected = node.id === selectedNodeId;
    const isTargeting = linkingSource?.id === node.id;
    const group = new THREE.Group();
    
    const geometry = new THREE.IcosahedronGeometry(isSelected ? node.val + 2 : node.val, 2);
    const material = new THREE.MeshPhongMaterial({ 
      color: isTargeting ? '#f43f5e' : (node.color || '#475569'),
      emissive: isTargeting ? '#f43f5e' : (node.color || '#475569'),
      emissiveIntensity: isSelected || isTargeting ? 1.5 : 0.3,
      transparent: true,
      opacity: 0.9,
    });
    group.add(new THREE.Mesh(geometry, material));

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
        canvas.width = 300; canvas.height = 100;
        ctx.font = 'Bold 28px "Inter", sans-serif';
        ctx.fillStyle = isSelected ? '#ffffff' : '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText(node.title, 150, 50);
        const texture = new THREE.CanvasTexture(canvas);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
        sprite.scale.set(40, 13.3, 1);
        sprite.position.y = (node.val || 5) + 12;
        group.add(sprite);
    }
    return group;
  }, [selectedNodeId, linkingSource]);

  return (
    <div className="w-full h-full relative bg-[#020617]" onClick={closeMenu}>
      <ForceGraph3D
        ref={fgRef}
        graphData={data}
        backgroundColor="#020617"
        showNavInfo={false}
        onNodeClick={handleNodeClick}
        onNodeRightClick={handleRightClick}
        nodeThreeObject={nodeThreeObject}
        linkColor={(link: any) => {
            const schema = data.edgeSchema.find(s => s.type === link.table);
            return schema ? schema.color : '#1e293b';
        }}
        linkWidth={link => (link.table === 'CHILD_OF' ? 2 : 1)}
        linkDirectionalParticles={link => {
            const s = typeof link.source === 'object' ? link.source.id : link.source;
            const t = typeof link.target === 'object' ? link.target.id : link.target;
            return (s === selectedNodeId || t === selectedNodeId) ? 4 : 0;
        }}
        enableNodeDrag={false}
      />

      {menu && (
        <div 
          className="absolute z-[100] glass-panel rounded-xl py-2 shadow-2xl border-white/10 flex flex-col min-w-[200px]"
          style={{ top: menu.y, left: menu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {menu.layer === 1 ? (
            <>
              <button onClick={() => setMenu({ ...menu, layer: 2, subItems: nodeSchema.map(s => s.type) })} className="flex items-center justify-between px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3"><PlusCircle size={16}/> Create Node</div>
                <ChevronRight size={14} className="text-slate-600"/>
              </button>
              <button onClick={() => setMenu({ ...menu, layer: 3, subItems: data.edgeSchema.map(s => s.type) })} className="flex items-center justify-between px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3"><Link size={16}/> Link Node</div>
                <ChevronRight size={14} className="text-slate-600"/>
              </button>
              <button onClick={() => setMenu({ ...menu, layer: 4, subItems: ['Properties', 'Content'] })} className="flex items-center justify-between px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3"><Edit3 size={16}/> Edit Node</div>
                <ChevronRight size={14} className="text-slate-600"/>
              </button>
              <div className="h-px bg-white/5 my-1"></div>
              <button onClick={() => { if(confirm("Purge this node?")) { onAction('DELETE', menu.node); closeMenu(); } }} className="flex items-center px-4 py-2.5 text-sm font-bold text-red-400 hover:bg-red-500/10 transition-colors">
                <div className="flex items-center gap-3"><Trash2 size={16}/> Delete Node</div>
              </button>
            </>
          ) : menu.layer === 2 ? (
            <>
              <div className="px-4 py-1.5 text-[10px] text-slate-500 font-black uppercase">Create Archetype</div>
              {menu.subItems?.map(type => {
                const schema = nodeSchema.find(s => s.type === type)!;
                return (
                  <button key={type} onClick={() => { onAction('CREATE', { parent: menu.node, type, edge: schema.defaultEdge }); closeMenu(); }} className="px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 text-left capitalize">
                    {type} ({schema.defaultEdge})
                  </button>
                );
              })}
              <button onClick={() => setMenu({ ...menu, layer: 1 })} className="mt-1 px-4 py-1 text-[10px] text-indigo-400 font-bold hover:underline">← Back</button>
            </>
          ) : (
            <div className="px-4 py-4 text-xs text-slate-500">
               {menu.layer === 3 ? "Select Edge Type to begin linking..." : "Select Edit mode..."}
               {menu.subItems?.map(item => (
                 <button key={item} onClick={() => { 
                   if(menu.layer === 3) onAction('START_LINK', { source: menu.node, edge: item });
                   else onAction('EDIT', { node: menu.node, mode: item });
                   closeMenu();
                 }} className="w-full text-left mt-2 px-3 py-2 bg-white/5 rounded-lg text-slate-300 hover:bg-white/10">{item}</button>
               ))}
               <button onClick={() => setMenu({ ...menu, layer: 1 })} className="mt-2 block text-indigo-400 font-bold">← Back</button>
            </div>
          )}
        </div>
      )}

      {isLinking && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="glass-panel border-indigo-500/50 bg-indigo-950/40 rounded-3xl p-6 flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                <div className="p-4 bg-indigo-500 rounded-full shadow-2xl animate-pulse"><Link className="text-white" size={32} /></div>
                <div className="text-center">
                    <h3 className="text-xl font-black text-white mb-1">Linking Node Space</h3>
                    <p className="text-sm text-slate-300">Target a dimension to connect via <span className="font-bold text-indigo-400">"{linkingSource?.id}"</span></p>
                </div>
                <button onClick={() => onAction('CANCEL_LINK', null)} className="pointer-events-auto mt-2 px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-black uppercase text-slate-400 transition-all">Cancel</button>
            </div>
        </div>
      )}
    </div>
  );
};

export default GraphCanvas3D;
