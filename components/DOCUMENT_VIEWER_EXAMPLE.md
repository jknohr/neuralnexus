HERE IS SOME EXAMPLES OF ADDITIONS TO THE DOCUMENT VIEWER COMPONENT i also upgraded the schema... but given you this file as a markdown file ... So you manually can merge the functioanlity with our existing code.... and update other files and package.json...

```typescript
import React, { useState, useMemo, useRef } from 'react';
import { GraphNode, NodeSchema, EdgeSchema, MediaItem } from '../types';
import { BookOpen, Share2, Sparkles, PlusCircle, Trash2, Paperclip, Loader2, Eye, Code2, Bold, Italic, List, ListOrdered, Link2, Image, Table, CheckSquare, Code, Heading1, Heading2, Strikethrough, Quote } from 'lucide-react';
import { mediaPipeline } from '../services/mediaPipeline';
import { mediaBucket } from '../services/backblaze_mediabucket';
import { surrealService } from '../services/surrealService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface DocumentViewerProps {
  node: GraphNode | null;
  onExpand: (title: string, type: string, edge: string) => void;
  onDelete: (id: string) => void;
  onNavigate?: (nodeId: string) => void; // Optional: for wikilink navigation
  isGenerating: boolean;
  nodeSchema: NodeSchema[];
  edgeSchema: EdgeSchema[];
  allNodes?: GraphNode[]; // Optional: for resolving wikilink titles
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ 
  node, 
  onExpand, 
  onDelete, 
  onNavigate,
  isGenerating, 
  nodeSchema, 
  edgeSchema,
  allNodes = []
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState(nodeSchema[0]?.type || 'article');
  const [selectedEdge, setSelectedEdge] = useState(edgeSchema[0]?.type || 'CHILD_OF');
  
  // WYSIWYG Editor State
  const [isEditMode, setIsEditMode] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [showFloatingMenu, setShowFloatingMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Markdown formatting functions
  const insertMarkdown = (prefix: string, suffix: string = '', placeholder: string = 'text') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = editContent.substring(start, end);
    const textToInsert = selectedText || placeholder;
    
    const newText = editContent.substring(0, start) + prefix + textToInsert + suffix + editContent.substring(end);
    setEditContent(newText);
    
    // Set cursor position after insertion
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length + textToInsert.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const newText = editContent.substring(0, start) + text + editContent.substring(start);
    setEditContent(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  const toggleEditMode = () => {
    if (!isEditMode) {
      setEditContent(node?.content || '');
    }
    setIsEditMode(!isEditMode);
    setShowFloatingMenu(false);
  };

  const saveContent = async () => {
    if (!node) return;
    try {
      await surrealService.updateNodeField(node.id, 'content', editContent);
      node.content = editContent;
      setIsEditMode(false);
      setShowFloatingMenu(false);
    } catch (err) {
      console.error('Failed to save:', err);
      alert('Failed to save content');
    }
  };

  const insertWikilink = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = editContent.substring(start, end);
    
    if (selectedText) {
      insertMarkdown(`[[${selectedText}|`, ']]', 'node:uuid');
    } else {
      insertAtCursor('[[Title|node:uuid]]');
    }
  };

  const insertCitation = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = editContent.substring(start, end);
    
    if (selectedText) {
      insertMarkdown(`{{${selectedText}|`, '}}', 'ref:uuid');
    } else {
      insertAtCursor('{{Source Name|ref:uuid}}');
    }
  };

  const insertMediaReference = () => {
    insertAtCursor('![alt text](image-url)');
  };

  const insertTable = () => {
    const table = `\n| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n`;
    insertAtCursor(table);
  };

  // Process wikilinks: [[Title|node:uuid]] or [[node:uuid]]
  // Process citations: {{Source|ref:uuid}} or {{ref:uuid}}
  const processedContent = useMemo(() => {
    if (!node) return '';
    
    let content = node.content;
    
    // Process wikilinks
    const wikilinkRegex = /\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g;
    content = content.replace(wikilinkRegex, (match, titleOrId, uuid) => {
      const nodeId = uuid || titleOrId;
      const displayText = uuid ? titleOrId : titleOrId;
      
      // Try to find the node to get its actual title
      const linkedNode = allNodes.find(n => n.id === nodeId);
      const finalText = linkedNode ? linkedNode.title : displayText;
      const finalId = linkedNode ? linkedNode.id : nodeId;
      
      // Return markdown link format for rendering
      return `[${finalText}](wikilink://${finalId})`;
    });
    
    // Process citations/references
    const citationRegex = /\{\{([^\}|]+?)(?:\|([^\}]+?))?\}\}/g;
    content = content.replace(citationRegex, (match, titleOrId, refId) => {
      const referenceId = refId || titleOrId;
      const displayText = refId ? titleOrId : titleOrId;
      
      // Return markdown superscript link format for rendering
      return `[^${displayText}](citation://${referenceId})`;
    });
    
    return content;
  }, [node?.content, allNodes]);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !node) return;
    const file = e.target.files[0];

    setUploading(true);
    setProcessingStatus('Standardizing Format...');

    try {
      // 1. Process/Standardize
      const { blob, extension, mime } = await mediaPipeline.processMedia(file);
      const processedFile = new File([blob], `${node.id.replace(':', '_')}_${Date.now()}.${extension}`, { type: mime });

      // 2. Upload
      setProcessingStatus('Uploading to Neural Storage...');
      const publicUrl = await mediaBucket.uploadFile(processedFile, processedFile.name);

      if (publicUrl) {
        // 3. Update Node Data
        const newItem: MediaItem = {
          id: crypto.randomUUID(),
          type: mime.startsWith('image') ? 'image' : mime.startsWith('video') ? 'video' : mime.startsWith('audio') ? 'audio' : 'document',
          url: publicUrl,
          name: file.name,
          mimeType: mime
        };

        const currentMedia = node.media || [];
        await surrealService.updateNodeField(node.id, 'media', [...currentMedia, newItem]);
        node.media = [...currentMedia, newItem];
      }

    } catch (err: any) {
      alert(`Upload Failed: ${err.message}`);
      console.error(err);
    } finally {
      setUploading(false);
      setProcessingStatus(null);
      e.target.value = '';
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
          {/* Edit Mode Toggle */}
          <button 
            onClick={toggleEditMode}
            className={`p-2.5 transition-all rounded-xl ${isEditMode ? 'bg-indigo-100 text-indigo-600' : 'text-slate-300 hover:text-indigo-600 hover:bg-indigo-50'}`}
            title={isEditMode ? "View Mode" : "Edit Mode"}
          >
            {isEditMode ? <Eye size={20} /> : <Code2 size={20} />}
          </button>
          <button onClick={() => onDelete(node.id)} className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all rounded-xl"><Trash2 size={20} /></button>
          <button className="p-2.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all rounded-xl"><Share2 size={20} /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
        <div className="max-w-2xl mx-auto">
          <p className="text-xl text-slate-500 font-medium italic border-l-4 border-indigo-200 pl-6 mb-12">{node.summary}</p>

          {/* MEDIA GRID */}
          {node.media && node.media.length > 0 && (
            <div className="mb-12 grid grid-cols-2 gap-4">
              {node.media.map(m => (
                <div key={m.id} className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                  {m.type === 'image' && <img src={m.url} alt={m.name} className="w-full h-48 object-cover" />}
                  {m.type === 'video' && <video src={m.url} controls className="w-full h-48 object-cover bg-black" />}
                  {m.type === 'audio' && (
                    <div className="h-48 flex flex-col items-center justify-center p-4">
                      <div className="mb-2 p-3 bg-indigo-100 text-indigo-600 rounded-full"><Sparkles size={24} /></div>
                      <audio src={m.url} controls className="w-full" />
                    </div>
                  )}
                  {m.type === 'document' && (
                    <div className="h-48 flex flex-col items-center justify-center p-4 text-center hover:bg-slate-100 transition-colors cursor-pointer" onClick={() => window.open(m.url, '_blank')}>
                      <BookOpen size={32} className="text-slate-400 mb-2" />
                      <span className="text-xs font-bold text-slate-600 truncate w-full px-2">{m.name}</span>
                    </div>
                  )}
                  <button onClick={() => {/* TODO: Delete Media */ }} className="absolute top-2 right-2 p-2 bg-white/90 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          )}

          {/* MARKDOWN CONTENT with GitHub Flavored Markdown and wikilink support */}
          {isEditMode ? (
            <div className="relative">
              {/* Floating Toolbar */}
              <div className="sticky top-0 z-20 mb-4 bg-white border border-slate-200 rounded-xl shadow-lg p-2 flex flex-wrap gap-1">
                {/* Text Formatting */}
                <button onClick={() => insertMarkdown('**', '**', 'bold text')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Bold">
                  <Bold size={18} />
                </button>
                <button onClick={() => insertMarkdown('*', '*', 'italic text')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Italic">
                  <Italic size={18} />
                </button>
                <button onClick={() => insertMarkdown('~~', '~~', 'strikethrough')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Strikethrough">
                  <Strikethrough size={18} />
                </button>
                <button onClick={() => insertMarkdown('`', '`', 'code')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Inline Code">
                  <Code size={18} />
                </button>
                
                <div className="w-px h-8 bg-slate-200 mx-1" />
                
                {/* Headers */}
                <button onClick={() => insertMarkdown('# ', '', 'Heading 1')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Heading 1">
                  <Heading1 size={18} />
                </button>
                <button onClick={() => insertMarkdown('## ', '', 'Heading 2')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Heading 2">
                  <Heading2 size={18} />
                </button>
                
                <div className="w-px h-8 bg-slate-200 mx-1" />
                
                {/* Lists */}
                <button onClick={() => insertMarkdown('- ', '', 'List item')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Bullet List">
                  <List size={18} />
                </button>
                <button onClick={() => insertMarkdown('1. ', '', 'Numbered item')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Numbered List">
                  <ListOrdered size={18} />
                </button>
                <button onClick={() => insertMarkdown('- [ ] ', '', 'Task item')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Task List">
                  <CheckSquare size={18} />
                </button>
                
                <div className="w-px h-8 bg-slate-200 mx-1" />
                
                {/* Special Insertions */}
                <button onClick={insertWikilink} className="p-2 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors" title="Insert Wikilink">
                  <Link2 size={18} />
                </button>
                <button onClick={insertCitation} className="p-2 hover:bg-amber-100 text-amber-600 rounded-lg transition-colors" title="Insert Citation">
                  <Quote size={18} />
                </button>
                <button onClick={insertMediaReference} className="p-2 hover:bg-purple-100 text-purple-600 rounded-lg transition-colors" title="Insert Image">
                  <Image size={18} />
                </button>
                <button onClick={insertTable} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Insert Table">
                  <Table size={18} />
                </button>
                
                <div className="flex-1" />
                
                {/* Save/Cancel */}
                <button 
                  onClick={() => { setIsEditMode(false); setEditContent(''); }}
                  className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveContent}
                  className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  Save
                </button>
              </div>

              {/* Editor Textarea */}
              <textarea
                ref={textareaRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full min-h-[600px] p-6 border-2 border-slate-200 rounded-xl focus:border-indigo-500 outline-none font-mono text-sm text-slate-700 resize-y"
                placeholder="Write your content here... Use the toolbar above for formatting"
              />
              
              {/* Quick Reference */}
              <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                <p className="font-bold mb-2">Quick Reference:</p>
                <div className="grid grid-cols-2 gap-2">
                  <div><code className="bg-white px-1 py-0.5 rounded">**bold**</code> for bold text</div>
                  <div><code className="bg-white px-1 py-0.5 rounded">*italic*</code> for italic text</div>
                  <div><code className="bg-white px-1 py-0.5 rounded">`code`</code> for inline code</div>
                  <div><code className="bg-white px-1 py-0.5 rounded">~~strike~~</code> for strikethrough</div>
                  <div><code className="bg-white px-1 py-0.5 rounded">[[Title|node:id]]</code> for wikilinks</div>
                  <div><code className="bg-white px-1 py-0.5 rounded">{{"{"}}{"{"}Source|ref:id{"}"}}</code> for citations</div>
                  <div><code className="bg-white px-1 py-0.5 rounded">- [ ] task</code> for task lists</div>
                </div>
              </div>
            </div>
          ) : (
            <article className="prose prose-slate prose-lg max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Handle wikilinks
                  a: ({ href, children, ...props }) => {
                    if (href?.startsWith('wikilink://') && onNavigate) {
                      const nodeId = href.replace('wikilink://', '');
                      return (
                        <button
                          onClick={() => onNavigate(nodeId)}
                          className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline cursor-pointer bg-transparent border-0 p-0"
                          {...props}
                        >
                          {children}
                        </button>
                      );
                    }
                    // Handle citations
                    if (href?.startsWith('citation://')) {
                      const refId = href.replace('citation://', '');
                      return (
                        <sup>
                          <button
                            onClick={() => {/* TODO: Show citation details */}}
                            className="text-amber-600 hover:text-amber-700 font-bold cursor-pointer bg-transparent border-0 p-0 text-xs"
                            title={`Citation: ${refId}`}
                            {...props}
                          >
                            [{children}]
                          </button>
                        </sup>
                      );
                    }
                    return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
                  },
                  // Syntax highlighting for code blocks
                  code: ({ inline, className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={match[1]}
                        PreTag="div"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {processedContent}
              </ReactMarkdown>
            </article>
          )}
        </div>
      </div>

      <div className="p-8 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Neural Expansion</h3>
          <div className="flex gap-2">
            <label className={`p-2 bg-slate-200 hover:bg-indigo-100 text-slate-600 hover:text-indigo-600 rounded-xl cursor-pointer transition-all ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
              {uploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
              <input type="file" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        </div>
        {processingStatus && <div className="mb-4 text-xs font-bold text-indigo-500 animate-pulse text-center uppercase tracking-widest">{processingStatus}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2">
            <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="bg-white border text-slate-800 border-slate-200 rounded-xl px-3 py-2 text-sm font-bold shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all">
              {nodeSchema.map(s => <option key={s.type} value={s.type}>{s.type.toUpperCase()}</option>)}
            </select>
            <select value={selectedEdge} onChange={(e) => setSelectedEdge(e.target.value)} className="bg-white border text-slate-800 border-slate-200 rounded-xl px-3 py-2 text-sm font-bold shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all">
              {edgeSchema.map((s, i) => (
                <option key={`${s.destinationtype}-${i}`} value={s.destinationtype}>{s.destinationtype}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <input type="text" placeholder="Title..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)} disabled={isGenerating} className="w-full pl-5 pr-14 py-4 border-2 border-slate-100 bg-white text-slate-900 rounded-2xl focus:border-indigo-500 outline-none font-bold shadow-sm transition-all" />
            <button type="submit" disabled={isGenerating || !newTitle.trim()} className="absolute right-2 top-2 bottom-2 px-4 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 transition-colors flex items-center justify-center"><PlusCircle size={20} /></button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentViewer;

´´´
