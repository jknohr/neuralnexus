
import React, { useRef, useEffect, useCallback } from 'react';
import ForceGraph2D, { ForceGraphMethods } from 'react-force-graph-2d';
import { GraphData, GraphNode, GraphEdge } from '../types';
// Fix: Import NODE_COLORS and EDGE_COLORS from constants
import { NODE_COLORS, EDGE_COLORS } from '../constants';

interface GraphCanvasProps {
  data: GraphData;
  selectedNodeId: string | null;
  onNodeSelect: (node: GraphNode) => void;
}

const GraphCanvas: React.FC<GraphCanvasProps> = ({ data, selectedNodeId, onNodeSelect }) => {
  // Fix: Added null as initial value to useRef to satisfy TypeScript requirements and avoid "Expected 1 arguments" error
  const fgRef = useRef<ForceGraphMethods>(null);

  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force('link')?.distance(100);
      fgRef.current.d3Force('charge')?.strength(-200);
    }
  }, []);

  const handleNodeClick = useCallback((node: any) => {
    onNodeSelect(node as GraphNode);
    if (fgRef.current) {
        fgRef.current.centerAt(node.x, node.y, 400);
    }
  }, [onNodeSelect]);

  return (
    <div className="w-full h-full relative">
      <ForceGraph2D
        ref={fgRef}
        graphData={data}
        nodeLabel="title"
        nodeColor={(node: any) => {
          const baseColor = NODE_COLORS[node.type] || '#cbd5e1';
          return node.id === selectedNodeId ? '#fff' : baseColor;
        }}
        nodeVal={(node: any) => node.val || 5}
        // Fix: Use link.table instead of link.type to match GraphEdge interface
        linkColor={(link: any) => EDGE_COLORS[link.table] || '#475569'}
        linkWidth={2}
        linkDirectionalArrowLength={4}
        linkDirectionalArrowRelPos={1}
        onNodeClick={handleNodeClick}
        backgroundColor="#0f172a"
        nodeCanvasObject={(node: any, ctx, globalScale) => {
            const label = node.title;
            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px Sans-Serif`;
            const textWidth = ctx.measureText(label).width;
            const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding

            ctx.fillStyle = node.id === selectedNodeId ? 'rgba(255, 255, 255, 0.9)' : 'rgba(15, 23, 42, 0.8)';
            ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2 - (node.val + 2), bckgDimensions[0], bckgDimensions[1]);

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = node.id === selectedNodeId ? '#0f172a' : '#94a3b8';
            ctx.fillText(label, node.x, node.y - (node.val + 2));

            // Circle node
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);
            ctx.fillStyle = node.id === selectedNodeId ? '#ffffff' : (NODE_COLORS[node.type] || '#cbd5e1');
            ctx.fill();
            if (node.id === selectedNodeId) {
                ctx.strokeStyle = '#6366f1';
                ctx.lineWidth = 2 / globalScale;
                ctx.stroke();
            }
        }}
        nodePointerAreaPaint={(node: any, color, ctx) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);
            ctx.fill();
        }}
      />
      <div className="absolute bottom-4 left-4 flex flex-col gap-2 pointer-events-none">
        <div className="flex items-center gap-2 text-xs text-slate-400">
            {/* Fix: Use correct EdgeTable keys from EDGE_COLORS */}
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: EDGE_COLORS.CHILD_OF }}></span> Parent/Child
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: EDGE_COLORS.RELATED_TO }}></span> Related
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: EDGE_COLORS.REFERENCES }}></span> Reference
        </div>
      </div>
    </div>
  );
};

export default GraphCanvas;
