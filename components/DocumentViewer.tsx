
import React, { useState } from 'react';
import { GraphNode, NodeSchema, EdgeSchema } from '../types';
import { BookOpen, Share2, Sparkles, PlusCircle, Trash2 } from 'lucide-react';

interface DocumentViewerProps {
  node: GraphNode | null;
  onExpand: (title: string, type: string, edge: string) => void;
  onDelete: (id: string) => void;
  isGenerating: boolean;
  nodeSchema: NodeSchema[];
  edgeSchema: EdgeSchema[];
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ node, onExpand, onDelete, isGenerating, nodeSchema, edgeSchema }) => {
  const [newTitle, setNewTitle] = useState('');
  const [selectedType, setSelectedType] = useState(nodeSchema[0]?.type || 'article');
  const [selectedEdge, setSelectedEdge] = useState(edgeSchema[0]?.type || 'CHILD_OF');

  if (!node) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50">
        <div className="mb-6 p-6 rounded-full bg-white shadow-xl text-slate-300"><BookOpen size={64} strokeWidth={1.5} /></div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Select a Dimension</h2>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim()) {
      onExpand(newTitle.trim(), selectedType, selectedEdge);
      setNewTitle('');
    }
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white/80 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><BookOpen size={24} /></div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">{node.title}</h1>
            <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-black uppercase text-slate-500">{node.type}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
            <button onClick={() => onDelete(node.id)} className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all rounded-xl"><Trash2 size={20} /></button>
            <button className="p-2.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all rounded-xl"><Share2 size={20} /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
        <div className="max-w-2xl mx-auto">
            <p className="text-xl text-slate-500 font-medium italic border-l-4 border-indigo-200 pl-6 mb-12">{node.summary}</p>
            <article className="prose prose-slate prose-lg max-w-none">
                {node.content.split('\n').map((line, i) => <p key={i}>{line}</p>)}
            </article>
        </div>
      </div>

      <div className="p-8 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Neural Expansion</h3>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2">
                <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold">
                    {nodeSchema.map(s => <option key={s.type} value={s.type}>{s.type.toUpperCase()}</option>)}
                </select>
                <select value={selectedEdge} onChange={(e) => setSelectedEdge(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold">
                    {edgeSchema.map(s => <option key={s.type} value={s.type}>{s.type}</option>)}
                </select>
            </div>
            <div className="relative">
                <input type="text" placeholder="Title..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)} disabled={isGenerating} className="w-full pl-5 pr-14 py-4 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none font-bold" />
                <button type="submit" disabled={isGenerating || !newTitle.trim()} className="absolute right-2 top-2 bottom-2 px-4 bg-slate-900 text-white rounded-xl"><PlusCircle size={20} /></button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentViewer;
