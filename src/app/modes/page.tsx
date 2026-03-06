"use client";

import { useState, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, PromptModeDef } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles, BookOpen, Eye, EyeOff, Trash2, Settings2, Paperclip, Layers } from "lucide-react";
import Link from "next/link";
import { useLLMSettings } from "@/hooks/use-llm-settings";
import { generateNewModeArchitect } from "@/lib/llm-client";
import { v4 as uuidv4 } from "uuid";
import { ModeEditDialog } from "@/components/mode-edit-dialog";
import { ImageReferenceList } from "@/components/image-reference-list";
import { api } from "@/lib/api";
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
import getCaretCoordinates from "textarea-caret";

export default function ModesPage() {
    const modes = useLiveQuery(() => db.modes.toArray(), []);
    const { settings } = useLLMSettings();

    const [creationPrompt, setCreationPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [pendingReferenceIds, setPendingReferenceIds] = useState<string[]>([]);

    // Mention state
    const [showMentionMenu, setShowMentionMenu] = useState(false);
    const [mentionIndex, setMentionIndex] = useState(0);
    const [mentionCoords, setMentionCoords] = useState({ top: 0, left: 0 });

    const attachInputRef = useRef<HTMLInputElement>(null);
    const textInputRef = useRef<HTMLInputElement>(null);

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

    const handleTextInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setCreationPrompt(val);

        const cursorPosition = e.target.selectionStart || 0;
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

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
            if (e.key === 'Enter') {
                e.preventDefault();
                insertMention(mentionIndex);
                return;
            }
            if (e.key === 'Escape') {
                setShowMentionMenu(false);
                return;
            }
        }

        if (e.key === 'Enter' && !showMentionMenu) {
            handleDraftMode();
        }
    };

    const insertMention = (index: number) => {
        if (!textInputRef.current) return;
        const cursorPosition = textInputRef.current.selectionStart || 0;
        const textBeforeCursor = creationPrompt.slice(0, cursorPosition);
        const textAfterCursor = creationPrompt.slice(cursorPosition);

        // Replace the trailing @
        const newTextBefore = textBeforeCursor.replace(/@$/, `@Image ${index + 1} `);

        setCreationPrompt(newTextBefore + textAfterCursor);
        setShowMentionMenu(false);

        // Refocus and restore cursor
        setTimeout(() => {
            textInputRef.current?.focus();
            textInputRef.current?.setSelectionRange(newTextBefore.length, newTextBefore.length);
        }, 0);
    };

    // Dialog states
    const [editingMode, setEditingMode] = useState<PromptModeDef | null>(null);
    const [modeToDelete, setModeToDelete] = useState<string | null>(null);

    const handleDraftMode = async () => {
        if (!creationPrompt.trim() || !settings.apiKey) return;
        setIsGenerating(true);
        try {
            // Include reference images in the LLM architect prompt
            let userMessageContent: any[] = [{ type: "text", text: creationPrompt }];

            for (let i = 0; i < pendingReferenceIds.length; i++) {
                const id = pendingReferenceIds[i];
                const b64 = await api.getImageAsBase64(id);
                if (b64) {
                    userMessageContent.push({ type: "text", text: `--- [@Image ${i + 1}] ---` });
                    userMessageContent.push({
                        type: "image_url",
                        image_url: { url: b64 }
                    });
                }
            }

            const newModeData = await generateNewModeArchitect(userMessageContent as any, settings);

            const newMode: PromptModeDef = {
                id: `custom_${uuidv4()}`,
                name: newModeData.name,
                description: newModeData.description,
                role: newModeData.role,
                law: newModeData.law,
                jsonTemplate: newModeData.jsonTemplate,
                referenceImageIds: pendingReferenceIds.length > 0 ? pendingReferenceIds : undefined,
                isBaseMode: false,
                isHidden: false,
                createdAt: Date.now()
            };

            await db.modes.add(newMode);
            setCreationPrompt("");
            setPendingReferenceIds([]);
            alert(`Successfully drafted and saved mode: ${newMode.name}!`);
        } catch (err: any) {
            console.error(err);
            alert(`Failed to generate mode: ${err.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const toggleVisibility = async (mode: PromptModeDef) => {
        await db.modes.update(mode.id, { isHidden: !mode.isHidden });
    };

    const confirmDeleteMode = async () => {
        if (modeToDelete) {
            await db.modes.delete(modeToDelete);
            setModeToDelete(null);
        }
    };

    const handleSaveMode = async (updatedMode: PromptModeDef) => {
        await db.modes.put(updatedMode);
        setEditingMode(null);
    };

    return (
        <div className="container max-w-4xl mx-auto py-12 px-4 sm:px-6">
            <div className="flex flex-col gap-2 border-b border-border/30 pb-6 mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
                            <BookOpen className="h-8 w-8 text-primary" />
                            Prompt Modes
                        </h1>
                        <p className="text-muted-foreground">
                            Manage the AI Directors that power your prompt generation. Toggle visibility or create new architectural rulesets.
                        </p>
                    </div>
                </div>
            </div>

            {/* Mode Creator Concept */}
            <div className="mb-12 border border-primary/20 bg-primary/5 rounded-xl p-6 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                <h2 className="font-mono text-sm tracking-widest uppercase text-primary mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Custom Mode Architect
                </h2>
                <p className="text-sm text-foreground/80 mb-6">
                    Define a new structural mode and let the LLM automatically draft its system instructions, the 5-sentence formula, and extraction parameters.
                </p>

                <ImageReferenceList imageIds={pendingReferenceIds} onRemove={id => setPendingReferenceIds(prev => prev.filter(p => p !== id))} />

                <div
                    className="relative flex gap-0 border border-border/50 rounded-md focus-within:border-primary transition-colors bg-background overflow-visible"
                    onDragOver={handleTextDragOver}
                    onDrop={handleTextDrop}
                >
                    <div className="flex items-center justify-center px-3 text-primary/50 font-mono text-base border-r border-border/30 bg-muted/5 shrink-0 gap-1 rounded-l-md overflow-hidden">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground rounded-none" onClick={() => attachInputRef.current?.click()} title="Attach Style References">
                            <Paperclip className="h-3 w-3" />
                        </Button>
                    </div>
                    <div className="flex-1 relative border-r border-border/20">
                        <input
                            ref={textInputRef}
                            className="w-full bg-transparent border-0 px-4 py-2 text-sm font-mono focus:outline-none focus:ring-0 transition-colors"
                            placeholder="e.g. A mode for creating 90s Anime cel-shaded illustrations... (or drop images)"
                            value={creationPrompt}
                            onChange={handleTextInput}
                            onKeyDown={handleKeyDown}
                            disabled={isGenerating || !settings.apiKey}
                        />
                        {showMentionMenu && pendingReferenceIds.length > 0 && (
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
                    <Button
                        onClick={handleDraftMode}
                        disabled={isGenerating || !creationPrompt.trim() || !settings.apiKey}
                        className="gap-2 shrink-0 rounded-l-none"
                    >
                        {isGenerating ? <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" /> : <Plus className="h-4 w-4" />}
                        Draft Mode
                    </Button>
                </div>
                {/* Hidden file input */}
                <input type="file" ref={attachInputRef} className="hidden" accept="image/*" multiple onChange={async (e) => {
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
                }} />
                <div className="mt-3 text-xs text-muted-foreground/60 italic">
                    {!settings.apiKey ? "// [WARNING] You must configure an API Key in Settings to use the Mode Architect." : "// The LLM will engineer a high-quality system prompt and parameter extractions for you."}
                </div>
            </div>

            {/* List of Modes */}
            <h2 className="text-lg font-semibold tracking-tight mb-4 flex items-center gap-2">
                <Layers className="h-5 w-5 text-muted-foreground" />
                Active Library
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
                {!modes ? (
                    <div className="col-span-2 text-center py-12 text-muted-foreground animate-pulse">Loading mode definitions...</div>
                ) : modes.length === 0 ? (
                    <div className="col-span-2 text-center py-12 text-muted-foreground border border-dashed rounded-xl">No modes discovered in the databank.</div>
                ) : (
                    modes.map((mode) => (
                        <div key={mode.id} className={`relative border rounded-xl overflow-hidden transition-all bg-card flex flex-col ${mode.isHidden ? "opacity-50 grayscale bg-muted/30" : "hover:border-primary/30"}`}>
                            <div className="p-5 flex-1 flex flex-col gap-2">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-mono font-bold uppercase tracking-wider text-base mb-1 text-foreground">{mode.name}</h3>
                                        <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full uppercase tracking-widest font-mono">
                                            {mode.isBaseMode ? "Core Base" : "Custom"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setEditingMode(mode)}
                                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                            title="View / Edit Mode"
                                        >
                                            <Settings2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => toggleVisibility(mode)}
                                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                            title={mode.isHidden ? "Show in Workspace" : "Hide from Workspace"}
                                        >
                                            {mode.isHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                        {!mode.isBaseMode && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setModeToDelete(mode.id)}
                                                className="h-8 w-8 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                                                title="Delete Custom Mode"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed flex-1 whitespace-pre-line">
                                    {mode.description}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <AlertDialog open={!!modeToDelete} onOpenChange={(open) => !open && setModeToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this Prompt Mode from your database. You cannot undo this action.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteMode} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <ModeEditDialog
                mode={editingMode}
                isOpen={!!editingMode}
                onClose={() => setEditingMode(null)}
                onSave={handleSaveMode}
            />
        </div>
    );
}

function LayersIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 12 12 17 22 12" />
            <polyline points="2 17 12 22 22 17" />
        </svg>
    );
}
