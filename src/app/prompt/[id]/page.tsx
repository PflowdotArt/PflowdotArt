"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, PromptModeDef, PromptSession, PromptIteration } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Trash2, Send, Wand2, RefreshCw, PenSquare, ArrowRightLeft, Sparkles, MessageSquare, Plus, Check, Settings, Image as ImageIcon, Search, Download, Paperclip, UploadCloud } from "lucide-react";
import getCaretCoordinates from "textarea-caret";
import Link from "next/link";
import Image from "next/image";
import { useLLMSettings } from "@/hooks/use-llm-settings";
import { generatePrompt, LLMMessage } from "@/lib/llm-client";
import { parseComfyUIPngMetadata } from "@/lib/metadata-parser";
import { useImageUrl } from "@/hooks/use-image-url";
import { ParamInspector } from "@/components/param-inspector";
import { StructuredPromptViewer } from "@/components/structured-prompt-viewer";
import { ImageReferenceList } from "@/components/image-reference-list";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function IterationListItem({ iteration, isActive, onClick, onDelete }: { iteration: PromptIteration; isActive: boolean; onClick: () => void; onDelete: () => void; }) {
  return (
    <div
      onClick={onClick}
      className={`group p-3 rounded-md cursor-pointer text-sm transition-colors border relative ${isActive ? "bg-primary/5 border-primary/30 shadow-sm" : "hover:bg-muted border-transparent"
        }`}
    >
      <div className="flex items-center justify-between mb-1 relative z-10">
        <span className="font-semibold truncate text-xs">
          {new Date(iteration.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 text-destructive hover:bg-destructive/10 rounded-md absolute -top-1 right-5 ${isActive ? 'bg-background shadow-sm border border-destructive/20' : ''}`}
            title="Delete Iteration"
          >
            <Trash2 className="h-3 w-3" />
          </button>
          {iteration.imageIds && iteration.imageIds.length > 0 && <ImageIcon className="h-3 w-3 text-primary" />}
        </div>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2 italic relative z-0 pr-6">
        "{iteration.userNotes || "Initial formulation"}"
      </p>
    </div >
  );
}

export default function PromptWorkspace() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const { settings, isLoaded: settingsLoaded } = useLLMSettings();

  const [activeIterationId, setActiveIterationId] = useState<string | null>(null);
  const [userInput, setUserInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [selectedMode, setSelectedMode] = useState<string>("photorealistic");
  const [isDeletingSession, setIsDeletingSession] = useState(false);
  const [iterationToDeleteId, setIterationToDeleteId] = useState<string | null>(null);
  const [isOverrideActive, setIsOverrideActive] = useState(false);
  const [pendingReferenceIds, setPendingReferenceIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachInputRef = useRef<HTMLInputElement>(null);

  const [session, setSession] = useState<PromptSession | null>(null);
  const [iterations, setIterations] = useState<PromptIteration[] | null>(null);
  const [modes, setModes] = useState<PromptModeDef[]>([]);

  const loadCanvasData = useCallback(async () => {
    try {
      const dbSession = await api.getSession(id);
      if (dbSession) setSession(dbSession);

      const dbIterations = await api.getSessionIterations(id);
      setIterations(dbIterations || []);

      const dbModes = await api.getModes();
      setModes(dbModes.filter((m: PromptModeDef) => !m.isHidden));
    } catch (e) {
      console.error(e);
    }
  }, [id]);

  useEffect(() => {
    loadCanvasData();
  }, [loadCanvasData]);

  useEffect(() => {
    if (iterations && iterations.length > 0 && !activeIterationId) {
      setActiveIterationId(iterations[iterations.length - 1].id);
    }
  }, [iterations, activeIterationId]);

  const activeIteration = iterations?.find(n => n.id === activeIterationId);
  const activeImageUrl = useImageUrl(activeIteration?.imageIds?.[0]);

  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionCoords, setMentionCoords] = useState({ top: 0, left: 0 });

  const topTextareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomTextareaRef = useRef<HTMLTextAreaElement>(null);
  const activeInputRef = useRef<'top' | 'bottom'>('top');

  const handleAttachFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    let newFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    const currentCount = pendingReferenceIds.length;

    if (currentCount + newFiles.length > 5) {
      alert(`You can only attach up to 5 reference images. Adding the first ${5 - currentCount}.`);
      newFiles = newFiles.slice(0, 5 - currentCount);
    }

    const newIds: string[] = [];
    for (let i = 0; i < newFiles.length; i++) {
      const imageId = await api.saveImage(newFiles[i], newFiles[i].type);
      newIds.push(imageId);
    }
    if (newIds.length > 0) {
      setPendingReferenceIds(prev => [...prev, ...newIds]);
    }

    if (attachInputRef.current) attachInputRef.current.value = "";
  };

  const handleCreateEmptyIteration = async () => {
    try {
      const newId = await api.createIteration(id, {
        imageIds: [],
        parentId: activeIterationId || undefined,
        userNotes: "Manual branch",
      });
      setActiveIterationId(newId);
      setUserInput("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerate = async (overridePrompt?: string) => {
    const promptText = typeof overridePrompt === 'string' ? overridePrompt : userInput;
    if (!promptText.trim()) return;
    if (!settings.apiKey) {
      setErrorMsg("Please configure your API key in settings first.");
      return;
    }
    const activeModeDef = modes?.find(m => m.id === selectedMode);
    if (!activeModeDef) {
      setErrorMsg("Please select a valid mode.");
      return;
    }

    setErrorMsg("");
    setIsGenerating(true);

    try {
      const messages: LLMMessage[] = [];

      let userMessageContent: any[] = [];
      const hasCurrentGenRef = activeIteration?.imageIds?.[0] && pendingReferenceIds.includes(activeIteration.imageIds[0]);

      const promptTextToUse = activeIteration && activeIteration.structuredPrompt
        ? `Current Prompt State JSON: \n${JSON.stringify(activeIteration.structuredPrompt, null, 2)}\n\nUser's requested modification or new direction for the next iteration: ${promptText}`
        : `Initial User Idea: ${promptText}\n\nCRITICAL: You MUST use the '${activeModeDef.name}' template structure for this request.`;

      userMessageContent.push({ type: "text", text: promptTextToUse });

      if (pendingReferenceIds.length > 0) {
        userMessageContent.push({
          type: "text",
          text: `CRITICAL INSTRUCTION REGARDING ATTACHED IMAGES:
You must TRANSLATE the visual elements of the attached images into pure, highly-descriptive text. 
DO NOT use phrases like "in Image 1", "as seen in @Image 2", or "from the reference image". 
The final output prompt must be standalone and assume the target AI generating the image does NOT have access to these reference images.${hasCurrentGenRef ? '\n\nIMPORTANT: One of the reference images is the CURRENT GENERATION result of the prompt. When the user asks to modify it, you should ITERATE on the "Current Prompt State JSON" to incorporate their changes. Treat the new instructions as a diff on the existing prompt rather than a complete rewrite. Maintain the core structure.' : ''}`
        });
      }

      for (let i = 0; i < pendingReferenceIds.length; i++) {
        const id = pendingReferenceIds[i];
        const isCurrentGen = activeIteration?.imageIds?.[0] === id;
        const b64 = await api.getImageAsBase64(id);
        if (b64) {
          userMessageContent.push({
            type: "text",
            text: isCurrentGen ? `--- [@Image ${i + 1}] (Note: This is the current actual generation result of the prompt) ---` : `--- [@Image ${i + 1}] ---`
          });
          userMessageContent.push({
            type: "image_url",
            image_url: { url: b64 }
          });
        }
      }

      messages.push({
        role: "user",
        content: userMessageContent
      });

      const assembledSystemPrompt = [activeModeDef.role, activeModeDef.law, activeModeDef.jsonTemplate].filter(Boolean).join('\n\n');
      const responseJSON = await generatePrompt(messages, settings, assembledSystemPrompt);

      const newId = await api.createIteration(id, {
        parentId: activeIterationId || undefined,
        structuredPrompt: responseJSON,
        imageIds: [],
        referenceImageIds: pendingReferenceIds.length > 0 ? pendingReferenceIds : undefined,
        userNotes: userInput,
      });

      setActiveIterationId(newId);
      setUserInput("");
      setPendingReferenceIds([]);

      // Auto-update session title based on the first idea if it's the default
      if (session?.title === "New Prompt Idea" && iterations?.length === 0) {
        const newTitle = userInput.length > 200 ? userInput.slice(0, 200) : userInput;
        await api.updateSession(id, { title: newTitle });
      }

      // Refresh list to show the new iteration
      await loadCanvasData();
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMagicExtend = () => {
    handleGenerate(`MAGIC EXTEND: Expand this simple idea into a full 5-part Director script with professional cinematography, rich lighting, and detailed subject descriptions: "${userInput}"`);
  };

  const handleParamChangeRequest = (overrideInstruction: string) => {
    handleGenerate(overrideInstruction);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    if (!activeIteration) return;
    if (!file || !file.type.startsWith('image/')) return;

    try {
      const metadata = await parseComfyUIPngMetadata(file).catch(() => null);
      const imageId = await api.saveImage(file, file.type);

      // Always replace the image for the current iteration (don't append to array)
      const updates: Partial<PromptIteration> = {
        imageIds: [imageId]
      };

      if (metadata) {
        updates.metadata = metadata;
      }

      await api.updateIteration(activeIteration.id, updates);

      if (session && !session.coverImageId) {
        await api.updateSession(session.id, { coverImageId: imageId });
      }
      await loadCanvasData();
    } catch (err: any) {
      console.error("Failed to process image", err);
      setErrorMsg(`Image upload failed: ${err?.message || "Unknown error"}`);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) await processFile(file);
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
    // Reset input so the same file can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleTextDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleTextDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (!files) return;

    let newFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    const currentCount = pendingReferenceIds.length;

    if (currentCount + newFiles.length > 5) {
      alert(`You can only attach up to 5 reference images. Adding the first ${5 - currentCount}.`);
      newFiles = newFiles.slice(0, 5 - currentCount);
    }

    const newIds: string[] = [];
    for (let i = 0; i < newFiles.length; i++) {
      const imageId = await api.saveImage(newFiles[i], newFiles[i].type);
      newIds.push(imageId);
    }
    if (newIds.length > 0) {
      setPendingReferenceIds(prev => [...prev, ...newIds]);
    }
  };

  const handleTextInput = (e: React.ChangeEvent<HTMLTextAreaElement>, pos: 'top' | 'bottom') => {
    const val = e.target.value;
    setUserInput(val);
    activeInputRef.current = pos;

    const cursorPosition = e.target.selectionEnd || 0;
    const textBeforeCursor = val.slice(0, cursorPosition);

    // Match @ anywhere as long as it's the last typed character
    const match = textBeforeCursor.match(/@$/);

    if (match && pendingReferenceIds.length > 0) {
      const caret = getCaretCoordinates(e.target, cursorPosition);
      setMentionCoords({
        top: caret.top + caret.height,
        left: caret.left
      });
      setShowMentionMenu(true);
      setMentionIndex(0);
    } else {
      setShowMentionMenu(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing || e.keyCode === 229) {
      return;
    }

    if (showMentionMenu && pendingReferenceIds.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex(prev => (prev + 1) % pendingReferenceIds.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(prev => (prev - 1 + pendingReferenceIds.length) % pendingReferenceIds.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(mentionIndex);
        return;
      }
      if (e.key === 'Escape') {
        setShowMentionMenu(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey && !showMentionMenu) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const insertMention = (index: number) => {
    const targetRef = activeInputRef.current === 'top' ? topTextareaRef : bottomTextareaRef;
    if (!targetRef.current) return;

    const inputElement = targetRef.current;
    if (!inputElement) return;

    // Use actual DOM selection properties
    const cursorPosition = inputElement.selectionEnd || userInput.length;
    const textBeforeCursor = userInput.slice(0, cursorPosition);
    const textAfterCursor = userInput.slice(cursorPosition);

    // Replace the trailing @ (which we know exists right before cursor due to regex logic)
    const newTextBefore = textBeforeCursor.replace(/@$/, `@Image ${index + 1} `);

    setUserInput(newTextBefore + textAfterCursor);
    setShowMentionMenu(false);

    // Defer focus logic slightly so React state batches
    setTimeout(() => {
      inputElement.focus();
      inputElement.setSelectionRange(newTextBefore.length, newTextBefore.length);
    }, 0);
  };

  const handleDeleteSession = () => {
    setIsDeletingSession(true);
  };

  const confirmDeleteSession = async () => {
    await api.deleteSession(id);
    router.push("/gallery");
  };

  const handleDeleteIteration = async (iterationIdToDelete: string) => {
    if (!iterations) return;
    try {
      if (activeIterationId === iterationIdToDelete) {
        // Fallback to parent or chronologically previous
        const deletedIteration = iterations.find(i => i.id === iterationIdToDelete);
        const parentId = deletedIteration?.parentId;
        if (parentId) {
          setActiveIterationId(parentId);
        } else {
          const idx = iterations.findIndex(i => i.id === iterationIdToDelete);
          if (idx > 0) {
            setActiveIterationId(iterations[idx - 1].id);
          } else if (iterations.length > 1) {
            setActiveIterationId(iterations[idx + 1].id);
          } else {
            setActiveIterationId(null);
          }
        }
      }
      await api.deleteIteration(iterationIdToDelete);
      await loadCanvasData();
      setIterationToDeleteId(null);
    } catch (e) {
      console.error("Failed to delete iteration:", e);
      setIterationToDeleteId(null);
    }
  };

  if (!session || iterations === null) return <div className="p-8 text-center animate-pulse">Loading Workspace...</div>;

  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-background">
      {/* Left Sidebar - Timeline */}
      <div className="w-64 border-r bg-muted/20 flex flex-col hidden md:flex">
        <div className="p-4 border-b flex items-center justify-between bg-background shrink-0">
          <Link href="/gallery">
            <Button variant="outline" size="sm" className="gap-2 text-muted-foreground hover:text-foreground hover:border-primary/50 shadow-sm transition-all">
              <ArrowLeft className="h-4 w-4" /> Back to Gallery
            </Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={handleDeleteSession} title="Delete Session" className="h-8 w-8 text-destructive/50 hover:text-destructive hover:bg-destructive/10 shrink-0">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="space-y-2 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
            {!iterations?.length ? (
              <div className="text-center text-sm text-muted-foreground py-4">No iterations yet.<br />Start chatting.</div>
            ) : (
              iterations.map((iteration) => (
                <div key={iteration.id} className="relative z-10">
                  <IterationListItem
                    iteration={iteration}
                    isActive={iteration.id === activeIterationId}
                    onClick={() => setActiveIterationId(iteration.id)}
                    onDelete={() => setIterationToDeleteId(iteration.id)}
                  />
                  {/* Timeline connector dot */}
                  <div className={`absolute top-1/2 -left-6 md:left-1/2 md:-ml-1 -mt-1 h-2 w-2 rounded-full border-2 ${iteration.id === activeIterationId ? 'bg-primary border-primary' : 'bg-background border-muted-foreground/30'}`} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-background relative">
        {/* Global Hidden File Input for Image Attachments */}
        <input type="file" ref={attachInputRef} className="hidden" accept="image/*" multiple onChange={handleAttachFiles} />

        {!activeIteration && (!iterations || iterations.length === 0) ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-2xl mx-auto w-full">
            <Sparkles className="h-12 w-12 mb-6 text-primary/50" />
            <h2 className="text-2xl font-semibold mb-2 text-center">Let's craft your prompt</h2>
            <p className="text-muted-foreground text-center mb-8">
              Describe what you want to generate. The LLM Expert will automatically structure a highly detailed prompt template for ComfyUI or Midjourney.
            </p>

            <div className="w-full bg-card border rounded-xl shadow-sm p-4 relative focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all flex flex-col gap-3">
              {errorMsg && <p className="text-destructive text-xs mb-2">{errorMsg}</p>}
              {!settingsLoaded || !settings.apiKey ? (
                <div className="bg-destructive/10 text-destructive text-sm rounded-md p-3 flex justify-between items-center mb-2">
                  <span>Missing LLM API Key</span>
                  <Link href="/settings?tab=llm">
                    <Button size="sm" variant="outline" className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
                      <Settings className="h-4 w-4 mr-2" /> Fix
                    </Button>
                  </Link>
                </div>
              ) : null}
              <ImageReferenceList imageIds={pendingReferenceIds} onRemove={id => setPendingReferenceIds(prev => prev.filter(p => p !== id))} />
              <div
                className="relative group transition-all"
                onDragOver={handleTextDragOver}
                onDrop={handleTextDrop}
              >
                <div className="relative w-full">
                  <Textarea
                    ref={topTextareaRef}
                    value={userInput}
                    onChange={(e) => handleTextInput(e, 'top')}
                    onKeyDown={handleKeyDown}
                    placeholder="e.g. A hyper-realistic portrait of a cyberpunk mechanic in a neon lit garage... (or drop images here)"
                    className="min-h-[140px] resize-none border-0 focus-visible:ring-0 shadow-none text-base p-4 pb-12 transition-all placeholder:transition-opacity group-hover:bg-muted/10 group-[.drag-over]:bg-primary/5"
                  />
                  {showMentionMenu && activeInputRef.current === 'top' && pendingReferenceIds.length > 0 && (
                    <div
                      className="absolute z-50 bg-popover border rounded-md shadow-md p-1 min-w-[150px] animate-in fade-in"
                      style={{
                        top: `${mentionCoords.top}px`,
                        left: `${Math.min(mentionCoords.left, 400)}px`,
                        marginTop: '4px'
                      }}
                    >
                      <div className="text-[10px] font-mono text-muted-foreground px-2 py-1 uppercase tracking-wider bg-muted/50 mb-1 rounded-sm">Select Reference</div>
                      {pendingReferenceIds.map((id, index) => (
                        <button
                          key={id}
                          className={`w-full text-left px-2 py-1.5 text-xs font-mono rounded focus:outline-none flex items-center gap-2 ${mentionIndex === index ? 'bg-primary/20 text-primary font-bold' : 'hover:bg-muted'}`}
                          onMouseEnter={() => setMentionIndex(index)}
                          onClick={(e) => {
                            e.preventDefault();
                            insertMention(index);
                          }}
                        >
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${mentionIndex === index ? 'bg-primary text-primary-foreground' : 'bg-primary/20'}`}>{index + 1}</div>
                          Image {index + 1}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="absolute bottom-2 left-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors" onClick={() => attachInputRef.current?.click()} title="Attach Reference Image">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-2 border-t border-border/10 pt-4 mt-2">
                <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">[ SELECT_CORE_MODE ]</span>
                <div className="flex justify-between items-stretch gap-4">
                  {/* Scrollable Mode Container */}
                  <div className="flex flex-1 overflow-x-auto gap-2 pb-2 scrollbar-thin hover:scrollbar-thumb-zinc-700 scrollbar-track-transparent pr-4 relative">
                    {modes?.map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => setSelectedMode(mode.id)}
                        className={`group relative flex flex-col items-start p-3 pl-4 border rounded-none transition-all text-left justify-center flex-shrink-0 min-w-[140px] max-w-[180px] min-h-[64px] ${selectedMode === mode.id
                          ? "bg-primary/10 border-primary shadow-[inset_0_0_15px_rgba(var(--color-primary),0.1)]"
                          : "bg-background border-border hover:border-primary/50 hover:bg-muted/50"
                          }`}
                      >
                        <span className={`text-[11px] font-mono font-bold uppercase tracking-wider mb-1 line-clamp-2 leading-tight ${selectedMode === mode.id ? "text-primary" : "text-zinc-300"}`}>
                          {mode.name}
                        </span>
                        <span className="text-[9px] text-muted-foreground line-clamp-2 leading-snug opacity-80 w-full mt-0.5">
                          {mode.description}
                        </span>
                        {selectedMode === mode.id && <div className="absolute bottom-0 left-0 h-[2px] w-full bg-primary" />}
                      </button>
                    ))}
                  </div>

                  {/* Fixed Execute Button */}
                  <Button
                    onClick={() => handleGenerate()}
                    disabled={isGenerating || !userInput.trim()}
                    className="gap-2 h-[60px] box-border min-w-[140px] px-6 border border-transparent rounded-none bg-primary hover:bg-primary/90 flex flex-col items-center justify-center transition-all shadow-[0_4px_20px_rgba(var(--color-primary),0.2)]"
                  >
                    {isGenerating ? (
                      <div className="animate-spin h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full mb-1" />
                    ) : (
                      <Sparkles className="h-5 w-5 mb-1" />
                    )}
                    <span className="font-mono text-xs uppercase tracking-widest leading-none">Execute</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : !activeIteration ? (
          <div className="flex-1 flex items-center justify-center">Loading Iteration...</div>
        ) : (
          <div className="flex flex-1 h-full flex-col lg:flex-row min-h-0 overflow-hidden">
            {/* Center - Prompt Structure Viewer & AI Chat */}
            <div className="flex-1 flex flex-col border-r min-w-[300px] lg:max-w-3xl min-h-0">
              <div className="p-4 border-b border-border/30 flex justify-between items-center bg-transparent shrink-0">
                <div className="flex items-center gap-3">
                  <h2 className="text-[10px] font-mono uppercase tracking-widest flex items-center gap-2 text-primary">
                    <Sparkles className="h-3 w-3" />
                    [WORKSPACE.SCRIPT_EDITOR]
                  </h2>
                </div>
                {/* Mobile-only exit button since sidebar is hidden on mobile */}
                <Link href="/gallery" className="md:hidden">
                  <Button variant="outline" size="sm" className="gap-2 shadow-sm text-muted-foreground">
                    <ArrowLeft className="h-4 w-4" /> Exit
                  </Button>
                </Link>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-transparent min-h-0 flex flex-col gap-6">

                {activeIteration?.userNotes && (
                  <div className="bg-muted/30 border border-border/50 rounded-xl p-4 shrink-0 shadow-sm">
                    <p className="text-sm text-foreground/80 leading-relaxed font-serif whitespace-pre-wrap italic">
                      "{activeIteration.userNotes}"
                    </p>
                    {activeIteration.referenceImageIds && activeIteration.referenceImageIds.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <ImageReferenceList imageIds={activeIteration.referenceImageIds} onRemove={undefined} />
                      </div>
                    )}
                  </div>
                )}

                {activeIteration.structuredPrompt ? (
                  <StructuredPromptViewer
                    data={activeIteration.structuredPrompt}
                    previousData={
                      iterations && iterations.findIndex(i => i.id === activeIteration.id) > 0
                        ? iterations[iterations.findIndex(i => i.id === activeIteration.id) - 1]
                        : undefined
                    }
                    onSave={async (newData) => {
                      await api.updateIteration(activeIteration.id, {
                        structuredPrompt: newData
                      });
                    }}
                  />
                ) : (
                  <div className="p-8 text-center border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground">
                    <p className="mb-4">This iteration was created manually and lacks expert JSON structure.</p>
                    <Button variant="outline" onClick={() => setUserInput("Add deep creative detail to this concept.")}>
                      Enhance with AI
                    </Button>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-border/50 bg-background z-10 shrink-0 relative">
                {/* Decorative Terminal Accent */}
                <div className="absolute top-0 left-0 w-1/4 h-[1px] bg-primary"></div>
                {errorMsg && <p className="text-destructive text-xs mb-2 font-mono">{errorMsg}</p>}
                {!settingsLoaded || !settings.apiKey ? (
                  <div className="bg-destructive/10 text-destructive text-sm rounded-none border border-destructive/30 p-3 flex justify-between items-center font-mono">
                    <span>[ERR] MISSING_API_KEY</span>
                    <Link href="/settings?tab=llm">
                      <Button size="sm" variant="outline" className="rounded-none border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground uppercase text-[10px]">
                        <Settings className="h-3 w-3 mr-2" /> Fix
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <ImageReferenceList imageIds={pendingReferenceIds} onRemove={id => setPendingReferenceIds(prev => prev.filter(p => p !== id))} />
                    <div
                      className="flex gap-0 border border-border/50 group focus-within:border-primary transition-colors min-h-[60px]"
                      onDragOver={handleTextDragOver}
                      onDrop={handleTextDrop}
                    >
                      <div className="flex flex-col items-center justify-center px-3 text-primary/50 font-mono text-base border-r border-border/30 bg-muted/5 shrink-0 gap-1 pb-1 pt-1">
                        <span>&gt;</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground rounded-none" onClick={() => attachInputRef.current?.click()} title="Attach Image">
                          <Paperclip className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="relative flex-1">
                        <Textarea
                          ref={bottomTextareaRef}
                          value={userInput}
                          onChange={(e) => handleTextInput(e, 'bottom')}
                          onKeyDown={handleKeyDown}
                          placeholder={isOverrideActive ? "[LOCKED] Cancel pending Director Overrides to unlock text input..." : (activeImageUrl ? "How would you like to tweak the result of this image? Type '@' to reference an image." : "Enter override instruction... Type '@' to reference an image.")}
                          className={`min-h-[60px] w-full resize-none px-4 py-4 text-sm font-mono bg-transparent border-0 rounded-none focus-visible:ring-0 shadow-none flex-1 leading-relaxed ${isOverrideActive ? 'opacity-40 cursor-not-allowed text-muted-foreground' : ''}`}
                          disabled={isOverrideActive || isGenerating}
                        />
                        {showMentionMenu && activeInputRef.current === 'bottom' && pendingReferenceIds.length > 0 && (
                          <div
                            className="absolute z-50 bg-popover border rounded-md shadow-md p-1 min-w-[150px] animate-in fade-in"
                            style={{
                              // Since bottom textarea is at the bottom of the screen, render menu ABOVE cursor
                              bottom: `calc(100% - ${mentionCoords.top - 24}px)`,
                              left: `${Math.min(mentionCoords.left, 400)}px`,
                              marginBottom: '4px'
                            }}
                          >
                            <div className="text-[10px] font-mono text-muted-foreground px-2 py-1 uppercase tracking-wider bg-muted/50 mb-1 rounded-sm">Select Reference</div>
                            {pendingReferenceIds.map((id, index) => (
                              <button
                                key={id}
                                className={`w-full text-left px-2 py-1.5 text-xs font-mono rounded focus:outline-none flex items-center gap-2 ${mentionIndex === index ? 'bg-primary/20 text-primary font-bold' : 'hover:bg-muted'}`}
                                onMouseEnter={() => setMentionIndex(index)}
                                onClick={(e) => {
                                  e.preventDefault();
                                  insertMention(index);
                                }}
                              >
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${mentionIndex === index ? 'bg-primary text-primary-foreground' : 'bg-primary/20'}`}>{index + 1}</div>
                                Image {index + 1}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        onClick={() => handleGenerate()}
                        disabled={isGenerating || !userInput.trim() || isOverrideActive}
                        className="h-auto px-8 rounded-none bg-primary hover:bg-primary/80 transition-none shrink-0"
                      >
                        {isGenerating ? <div className="animate-spin h-3 w-3 border-2 border-primary-foreground border-t-transparent rounded-none" /> : <span className="font-mono text-[10px] uppercase text-primary-foreground tracking-widest">EXEC</span>}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right - Image & Metadata Dropzone */}
            <div className="w-[40%] min-w-[300px] flex flex-col bg-muted/20 relative min-h-0 overflow-y-auto">
              <div className="flex-1 p-4 flex flex-col">
                {activeIteration?.structuredPrompt?.extracted_ui_params && (
                  <div className="mb-4 shrink-0">
                    <ParamInspector
                      params={activeIteration.structuredPrompt.extracted_ui_params}
                      onParamChangeRequest={handleParamChangeRequest}
                      isGenerating={isGenerating}
                      isChatInputActive={userInput.trim().length > 0}
                      onOverrideActiveChange={setIsOverrideActive}
                    />
                  </div>
                )}
                {!activeImageUrl ? (
                  <div
                    className={`w-full aspect-[4/5] md:aspect-auto md:flex-1 border border-border/50 flex flex-col items-center justify-center text-muted-foreground transition-all ${isDragging ? 'border-primary bg-primary/10 scale-[0.99] border-dashed' : 'bg-transparent hover:bg-muted/30 hover:border-primary/50'} cursor-pointer rounded-none relative overflow-hidden group`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="absolute top-0 right-0 w-8 h-8 border-l border-b border-border/30 flex items-center justify-center bg-muted/10">
                      <Sparkles className="h-3 w-3 text-primary/30 group-hover:text-primary transition-colors" />
                    </div>
                    <UploadCloud className={`h-8 w-8 mb-4 ${isDragging ? 'text-primary' : 'opacity-30 group-hover:opacity-60 transition-opacity'}`} />
                    <span className="text-[10px] font-mono tracking-widest uppercase text-foreground/70">Click or Drop Image</span>
                    <span className="text-[10px] font-mono opacity-50 mt-2 max-w-[200px] text-center">// Upload reference</span>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col gap-4 min-h-0 p-1">
                    <div
                      className="relative w-full shadow-md rounded-xl overflow-hidden border bg-black/5 shrink-0 cursor-pointer group flex items-center justify-center"
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {/* Optimized Next Image */}
                      <Image
                        src={activeImageUrl}
                        alt="Generated Result"
                        width={1920}
                        height={1080}
                        className="w-full h-auto max-h-[70vh] object-contain"
                      />
                      {isDragging && (
                        <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm border-2 border-primary border-dashed !rounded-xl flex items-center justify-center transition-all z-10">
                          <span className="bg-background px-4 py-2 rounded-md text-sm font-semibold shadow-lg">Replace Generation</span>
                        </div>
                      )}
                      {!isDragging && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all z-10">
                          <span className="bg-background px-4 py-2 rounded-md text-sm font-semibold shadow-lg flex items-center gap-2">
                            <UploadCloud className="h-4 w-4" /> Click to replace
                          </span>
                        </div>
                      )}
                    </div>
                    {activeIteration?.imageIds?.[0] && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-1 font-mono text-[10px] uppercase tracking-widest gap-2 bg-background hover:bg-muted"
                        onClick={() => {
                          const imgId = activeIteration.imageIds[0];
                          if (imgId && !pendingReferenceIds.includes(imgId)) {
                            setPendingReferenceIds(prev => [...prev, imgId]);
                          }
                        }}
                      >
                        <Paperclip className="h-3 w-3" /> Use as Reference
                      </Button>
                    )}

                    <div className="space-y-2 flex flex-col shrink-0 mb-2 mt-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Settings className="h-3 w-3" />
                        Gen Metadata
                      </h3>
                      <div className="bg-background rounded-md border p-3 text-xs text-muted-foreground overflow-auto max-h-[200px] opacity-80 hover:opacity-100 transition-opacity">
                        {activeIteration.metadata ? (
                          <pre className="whitespace-pre-wrap font-mono text-[10px] break-all">
                            {JSON.stringify(activeIteration.metadata, null, 2)}
                          </pre>
                        ) : (
                          <span className="italic opacity-60">No ComfyUI/generation workflow metadata found in this image.</span>
                        )}
                      </div>
                    </div>

                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input for clicking on dropzone */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInput}
        accept="image/*"
        className="hidden"
      />

      {/* Retro Terminal Delete Modal */}
      {
        isDeletingSession && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-zinc-950 border border-destructive/50 w-full max-w-md p-6 relative overflow-hidden flex flex-col items-center text-center shadow-[0_0_50px_rgba(0,0,0,0.8)]">
              {/* Minimal Accents */}
              <div className="absolute top-0 left-0 w-full h-1 bg-destructive/80"></div>
              <div className="absolute top-2 left-2 text-[10px] font-mono text-destructive/50 uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="h-3 w-3" />
                [ SYS.WARN ]
              </div>

              <Trash2 className="h-12 w-12 text-destructive mb-4 mt-8 opacity-80" />

              <h2 className="text-xl font-mono text-zinc-100 mb-2 tracking-tight uppercase">Delete_Workspace?</h2>
              <p className="text-zinc-500 font-sans text-sm mb-8 leading-relaxed max-w-[280px]">
                This action cannot be undone. All prompt iterations, variations, and history will be permanently erased.
              </p>

              <div className="flex w-full gap-4">
                <button
                  onClick={() => setIsDeletingSession(false)}
                  className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-border/50 py-3 font-mono text-xs uppercase tracking-widest transition-colors rounded-none"
                >
                  Abort
                </button>
                <button
                  onClick={confirmDeleteSession}
                  className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground py-3 font-mono text-xs uppercase tracking-widest transition-colors rounded-none shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )
      }

      { /* Delete Iteration Dialog */
        iterationToDeleteId !== null && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-zinc-950 border border-destructive/50 w-full max-w-md p-6 relative overflow-hidden flex flex-col items-center text-center shadow-[0_0_50px_rgba(0,0,0,0.8)]">
              {/* Minimal Accents */}
              <div className="absolute top-0 left-0 w-full h-1 bg-destructive/80"></div>
              <div className="absolute top-2 left-2 text-[10px] font-mono text-destructive/50 uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="h-3 w-3" />
                [ SYS.WARN ]
              </div>

              <Trash2 className="h-12 w-12 text-destructive mb-4 mt-8 opacity-80" />

              <h2 className="text-xl font-mono text-zinc-100 mb-2 tracking-tight uppercase">Delete_Iteration?</h2>
              <p className="text-zinc-500 font-sans text-sm mb-8 leading-relaxed max-w-[280px]">
                This action cannot be undone. This specific prompt variation will be permanently erased.
              </p>

              <div className="flex w-full gap-4">
                <button
                  onClick={() => setIterationToDeleteId(null)}
                  className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-border/50 py-3 font-mono text-xs uppercase tracking-widest transition-colors rounded-none"
                >
                  Abort
                </button>
                <button
                  onClick={() => handleDeleteIteration(iterationToDeleteId)}
                  className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground py-3 font-mono text-xs uppercase tracking-widest transition-colors rounded-none shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}
