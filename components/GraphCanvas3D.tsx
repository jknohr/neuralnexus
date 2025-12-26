
import { useRef, useEffect, useCallback, useState, FC } from 'react';
import ForceGraph3D, { ForceGraphMethods } from 'react-force-graph-3d';
import { GraphData, GraphNode, NodeSchema, GraphEdge } from '../types';
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

interface MenuState {
  x: number;
  y: number;
  node: GraphNode;
  layer: number;
  subItems?: string[];
}

const GraphCanvas3D: FC<GraphCanvas3DProps> = ({ data, selectedNodeId, onNodeSelect, onAction, isLinking, linkingSource, nodeSchema }) => {
  const fgRef = useRef<ForceGraphMethods>(null);
  const [menu, setMenu] = useState<MenuState | null>(null);

  useEffect(() => {
    if (fgRef.current) {
      // D3 force configuration
      fgRef.current.d3Force('link')?.distance(150)?.strength(0.5);
      fgRef.current.d3Force('charge')?.strength(-400);

      // Camera constraints: top-down view with ±30° tilt limit
      const controls = fgRef.current.controls() as any;
      if (controls) {
        // Polar angle: 90° is horizontal, 0° is top-down
        // We want ~60° to ~120° (top-down ±30°)
        controls.minPolarAngle = Math.PI / 3;      // 60° from top
        controls.maxPolarAngle = Math.PI / 2 + Math.PI / 6; // 120° from top

        // Zoom limits
        controls.minDistance = 150;
        controls.maxDistance = 2500;

        // Damping for smooth movement
        controls.enableDamping = true;
        controls.dampingFactor = 0.1;
      }

      // Set initial camera position: looking down from above
      fgRef.current.cameraPosition({ x: 0, y: 500, z: 300 }, { x: 0, y: 0, z: 0 }, 0);
    }
  }, [data]);

  const handleNodeClick = useCallback((node: any) => {
    // ForceGraph node might add internal props, so we cast safely
    if (!node || !fgRef.current) return;
    setMenu(null);
    const gNode = node as GraphNode;

    if (isLinking && linkingSource) {
      onAction('COMPLETE_LINK', gNode);
      return;
    }
    const x = typeof node.x === 'number' ? node.x : 0;
    const y = typeof node.y === 'number' ? node.y : 0;
    const z = typeof node.z === 'number' ? node.z : 0;

    fgRef.current.cameraPosition({ x: x * 1.5, y: y * 1.5, z: z * 1.5 + 300 }, { x, y, z }, 1200);
    onNodeSelect(gNode);
  }, [onNodeSelect, isLinking, linkingSource, onAction]);

  const handleRightClick = useCallback((node: any, event: MouseEvent) => {
    // node from ForceGraph library
    // event from MouseEvent
    // We prevent default context menu
    // event.preventDefault() handling might need to be done at window level or check if library supports it
    // But react-force-graph usually passes the event.

    // Note: react-force-graph might not pass explicit preventDefault control easily in all versions, 
    // but we'll assume standard behavior.
    if (!node) return;
    setMenu({ x: event.clientX, y: event.clientY, node: node as GraphNode, layer: 1 });
  }, []);

  const closeMenu = () => setMenu(null);

  const nodeThreeObject = useCallback((node: any) => {
    const gNode = node as GraphNode;
    const isSelected = gNode.id === selectedNodeId;
    const isTargeting = linkingSource?.id === gNode.id;
    const group = new THREE.Group();

    // Pane dimensions
    const width = 50;
    const height = 35;
    const depth = 1.5;
    const cornerRadius = 3;

    // 1. Create rounded box geometry for frosted glass pane
    const paneGeom = new THREE.BoxGeometry(width, height, depth, 4, 4, 1);

    // Frosted glass material with node color tint
    const baseColor = isTargeting ? '#f43f5e' : (gNode.color || '#475569');
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: baseColor,
      metalness: 0.05,
      roughness: isSelected ? 0.15 : 0.35,  // Clearer when selected
      transmission: 0.85,
      thickness: 1.2,
      transparent: true,
      opacity: isSelected ? 0.95 : 0.85,
      side: THREE.DoubleSide,
      envMapIntensity: 1.0,
      clearcoat: 0.3,
      clearcoatRoughness: 0.25
    });

    const pane = new THREE.Mesh(paneGeom, glassMaterial);
    group.add(pane);

    // 2. Edge glow for selected state
    if (isSelected) {
      const edgeGeom = new THREE.BoxGeometry(width + 2, height + 2, depth + 0.5);
      const edgeMaterial = new THREE.MeshBasicMaterial({
        color: baseColor,
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide
      });
      const edge = new THREE.Mesh(edgeGeom, edgeMaterial);
      group.add(edge);
    }

    // 3. Text overlay on front face
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Clear with slight tint matching node color
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, 512, 360);

      // Title (bold, large)
      ctx.font = 'Bold 38px Inter, system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textBaseline = 'top';
      const title = (gNode.title || 'Untitled').slice(0, 25);
      ctx.fillText(title, 24, 30);

      // UUID (monospace, muted)
      ctx.font = '18px "SF Mono", Monaco, monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      const shortId = gNode.id.length > 30 ? gNode.id.slice(0, 30) + '...' : gNode.id;
      ctx.fillText(shortId, 24, 85);

      // Divider line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(24, 125);
      ctx.lineTo(488, 125);
      ctx.stroke();

      // Summary (regular, slightly smaller)
      ctx.font = '24px Inter, system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      const summary = (gNode.summary || 'No summary').slice(0, 50);
      ctx.fillText(summary + (gNode.summary && gNode.summary.length > 50 ? '...' : ''), 24, 155);

      // Type badge
      ctx.font = 'Bold 14px Inter, system-ui, sans-serif';
      ctx.fillStyle = baseColor;
      ctx.fillRect(24, 200, ctx.measureText(gNode.type.toUpperCase()).width + 16, 24);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(gNode.type.toUpperCase(), 32, 218);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 16;

    const textMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.FrontSide,
      depthWrite: false
    });

    const textPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(width - 2, height - 2),
      textMaterial
    );
    textPlane.position.z = depth / 2 + 0.1;
    group.add(textPlane);

    // Also add text to back face (mirrored not needed, just visible)
    const backPlane = textPlane.clone();
    backPlane.position.z = -depth / 2 - 0.1;
    backPlane.rotation.y = Math.PI;
    group.add(backPlane);

    return group;
  }, [selectedNodeId, linkingSource]);

  return (
    <div className="w-full h-full relative bg-[#020617]" onClick={closeMenu} onContextMenu={(e) => e.preventDefault()}>
      <ForceGraph3D
        ref={fgRef}
        graphData={data}
        backgroundColor="#020617"
        showNavInfo={false}
        onNodeClick={handleNodeClick}
        onNodeRightClick={handleRightClick}
        nodeThreeObject={nodeThreeObject}
        linkColor={(link: any) => {
          // Link object from library, we look for our custom 'table' prop or 'type' prop depending on how it was passed
          const gLink = link as GraphEdge;
          // In Surreal response mapping, we mapped 'type' to the edge label (table name)
          const schema = data.edgeSchema.find(s => s.sourcetype === gLink.type || s.destinationtype === gLink.type);
          return schema ? schema.color : '#1e293b';
        }}
        linkWidth={(link: any) => {
          const gLink = link as GraphEdge;
          return (gLink.type === 'CHILD_OF' || gLink.type === 'PART_OF') ? 2 : 1;
        }}
        linkDirectionalParticles={(link: any) => {
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
          {/* 
              RIGHT-CLICK CONTEXT MENU SYSTEM 
              -------------------------------
              This is a multi-layer menu for 3D Space interactions.
              
              Layer 1: Main Actions (Create, Link, Edit, Delete)
              Layer 2: Create Submenu (Select Archetype to spawn)
              Layer 3: Link Submenu (Select Edge Type)
              
              This is the PRIMARY method for creating new nodes in the graph.
          */}
          {menu.layer === 1 ? (
            <>
              <button onClick={() => setMenu({ ...menu, layer: 2, subItems: nodeSchema.map(s => s.type) })} className="flex items-center justify-between px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3"><PlusCircle size={16} /> Create Node</div>
                <ChevronRight size={14} className="text-slate-600" />
              </button>
              <button onClick={() => setMenu({ ...menu, layer: 3, subItems: data.edgeSchema.map(s => s.type) })} className="flex items-center justify-between px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3"><Link size={16} /> Link Node</div>
                <ChevronRight size={14} className="text-slate-600" />
              </button>
              <button onClick={() => setMenu({ ...menu, layer: 4, subItems: ['Properties', 'Content'] })} className="flex items-center justify-between px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3"><Edit3 size={16} /> Edit Node</div>
                <ChevronRight size={14} className="text-slate-600" />
              </button>
              <div className="h-px bg-white/5 my-1"></div>
              <button onClick={() => { if (confirm("Purge this node?")) { onAction('DELETE', menu.node); closeMenu(); } }} className="flex items-center px-4 py-2.5 text-sm font-bold text-red-400 hover:bg-red-500/10 transition-colors">
                <div className="flex items-center gap-3"><Trash2 size={16} /> Delete Node</div>
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
                  if (menu.layer === 3) onAction('START_LINK', { source: menu.node, edge: item });
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
