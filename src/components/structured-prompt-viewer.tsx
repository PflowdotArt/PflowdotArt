"use client";

import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Edit2, Check, X, Info, Clapperboard, Sparkles } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface ScriptPanelProps {
    data: any; // FluxPromptStructure + metadata (category, thoughts, etc)
    previousData?: any;
    onSave?: (newData: any) => void;
}

const COMPONENT_TITLES: Record<string, string> = {
    hook: "1. The Hook (Subject & Action)",
    subject_details: "2. Subject Details",
    setting: "3. Spatial Setting",
    lighting_vibe: "4. Lighting & Atmosphere",
    cinematography: "5. Cinematography & Rendering",
    // Common mappings for other modes:
    medium_style: "1. Medium & Style",
    brushwork: "2. Brushwork & Technique",
    subject: "3. Core Subject",
    composition: "4. Composition",
    color_mood: "5. Color & Mood",
    influences: "6. Influences",
    render_type: "1. Render Type & Subject",
    cmf_materials: "2. CMF Materials",
    lighting: "Lighting Setup",
    engine_fx: "Engine & FX",
    artifact_type: "1. Artifact Definition",
    typography: "2. Layout & Typography",
    elements: "3. Core Elements",
    design_language: "4. Aesthetics",
    presentation: "5. Presentation",
};

const VAR_MAP_COLORS = [
    "var(--color-hook)",
    "var(--color-subject)",
    "var(--color-setting)",
    "var(--color-lighting)",
    "var(--color-cinema)"
];

export function StructuredPromptViewer({ data, previousData, onSave }: ScriptPanelProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<any>(null);
    const [copied, setCopied] = useState(false);

    if (!data || typeof data !== 'object') {
        return <div className="text-sm text-muted-foreground p-4">No script data available.</div>;
    }

    // Fallback support for older V4 structures during migration
    if (!data.final_paragraph && data.structured_prompt && typeof data.structured_prompt === 'object') {
        return (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-800 dark:text-yellow-200 text-sm">
                <p className="font-semibold mb-2 flex items-center gap-2"><Info className="h-4 w-4" /> Legacy V4 Prompt Detected</p>
                <p>This iteration was generated using the old JSON template architecture. Please generate a new iteration to upgrade to the V5 5-Sentence Script engine.</p>
                <pre className="mt-4 text-[10px] bg-black/5 p-2 rounded max-h-[300px] overflow-auto whitespace-pre-wrap break-words">{JSON.stringify(data.structured_prompt, null, 2)}</pre>
            </div>
        );
    }

    const { thoughts, final_paragraph, components, extracted_ui_params } = data;

    const handleEditStart = () => {
        setEditData(JSON.parse(JSON.stringify(components || {})));
        setIsEditing(true);
    };

    const handleEditCancel = () => {
        setIsEditing(false);
        setEditData(null);
    };

    const handleEditSave = () => {
        if (onSave) {
            // Reconstruct the final paragraph from the edited components dynamically
            const newFinalParagraph = Object.values(editData).filter(Boolean).join(" ");

            const newData = {
                ...data,
                final_paragraph: newFinalParagraph,
                components: editData
            };
            onSave(newData);
        }
        setIsEditing(false);
    };

    const handleCopy = () => {
        // Assemble in component (law) order so copy matches the displayed hero order
        const textToCopy = components
            ? Object.values(components).map(String).join(' ')
            : final_paragraph;
        if (!textToCopy) return;
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getDiffState = (key: string) => {
        if (!previousData || !previousData.components) return { isChanged: false };
        const oldVal = previousData.components[key];
        const newVal = components?.[key];
        if (oldVal !== undefined && newVal !== undefined && oldVal !== newVal) {
            return { isChanged: true, oldValue: oldVal };
        }
        return { isChanged: false };
    };

    const renderDiffText = (text: string, isChanged: boolean, oldValue: string) => {
        if (!isChanged) {
            return <p className="text-base text-foreground/90 leading-relaxed font-sans">{text}</p>;
        }
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <p className="text-base leading-relaxed font-sans bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-1.5 py-0.5 rounded-none border-b border-yellow-500/50 cursor-help inline-block">
                            {text}
                        </p>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs bg-muted/95 border-border shadow-xl">
                        <p className="font-semibold text-xs mb-1 text-muted-foreground flex items-center gap-1">
                            <Info className="h-3 w-3" /> Previous Version:
                        </p>
                        <p className="text-xs text-foreground/80 line-through opacity-80">{oldValue}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    };

    return (
        <div className="space-y-6">
            {/* Meta Info & Actions */}
            <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-2">
                        <Badge variant="outline" className="text-[10px] font-mono uppercase bg-transparent text-primary border-primary/30 w-fit flex items-center gap-1 rounded-none px-2 py-0.5">
                            <Clapperboard className="h-3 w-3" /> [SYS.DIRECTOR_SCRIPT]
                        </Badge>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        {isEditing ? (
                            <>
                                <Button size="sm" variant="ghost" onClick={handleEditCancel} className="h-8">
                                    <X className="h-4 w-4 mr-1" /> Cancel
                                </Button>
                                <Button size="sm" onClick={handleEditSave} className="h-8 bg-green-600 hover:bg-green-700 text-white">
                                    <Check className="h-4 w-4 mr-1" /> Save
                                </Button>
                            </>
                        ) : (
                            <>
                                {onSave && (
                                    <Button size="sm" variant="outline" onClick={handleEditStart} className="h-8">
                                        <Edit2 className="h-3 w-3 mr-2" /> Edit Components
                                    </Button>
                                )}
                                <Button size="sm" variant="secondary" onClick={handleCopy} className="h-8 transition-all w-[120px] bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20">
                                    {copied ? (
                                        <><Check className="h-3 w-3 mr-2 text-green-500" /> Copied Text</>
                                    ) : (
                                        <><Copy className="h-3 w-3 mr-2" /> Copy Script</>
                                    )}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
                {thoughts && (
                    <div className="w-full border-l-2 border-primary/40 pl-4 py-2 mt-2">
                        <span className="font-mono text-primary/70 block mb-1 text-[10px] uppercase tracking-widest">&gt;&gt; DIRECTOR'S_NOTE</span>
                        <p className="text-sm text-foreground/70 italic font-sans">
                            "{thoughts}"
                        </p>
                    </div>
                )}
            </div>

            {/* Final Paragraph Hero Display — rendered in component (law) order so colours match the breakdown below */}
            {!isEditing && (components || final_paragraph) && (
                <div className="bg-transparent border border-border/30 p-6 relative group">
                    <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                        <Sparkles className="h-3 w-3" /> [OUTPUT.FINAL_RENDER_PROMPT]
                    </h3>
                    <p className="text-lg font-sans leading-relaxed text-foreground/90 selection:bg-primary/20">
                        {components ? (
                            Object.entries(components).map(([key, value], index) => (
                                <span
                                    key={key}
                                    style={{ color: VAR_MAP_COLORS[index % VAR_MAP_COLORS.length] }}
                                    className="transition-all duration-300 hover:brightness-150 inline"
                                >
                                    {String(value)}{" "}
                                </span>
                            ))
                        ) : (
                            final_paragraph
                        )}
                    </p>
                </div>
            )}

            {components && (
                <div className="space-y-6 pt-6 border-t border-border/30">
                    <h4 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        [SYS.STRUCTURE_BREAKDOWN]
                    </h4>
                    <div className="grid gap-6">
                        {Object.entries(components).map(([key, value], index) => {
                            const diff = getDiffState(key);
                            const displayTitle = COMPONENT_TITLES[key] || key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                            const colorVar = VAR_MAP_COLORS[index % VAR_MAP_COLORS.length];

                            return (
                                <div key={key} className="relative pl-4 overflow-hidden group">
                                    <div
                                        className="absolute left-0 top-0 bottom-0 w-[2px] opacity-70 group-hover:opacity-100 transition-opacity"
                                        style={{ backgroundColor: colorVar }}
                                    />
                                    <div className="flex flex-col justify-start gap-1 pb-2">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="text-[10px] font-mono uppercase tracking-widest opacity-80"
                                                style={{ color: colorVar }}
                                            >
                                                {displayTitle}
                                            </span>
                                            {diff.isChanged && !isEditing && (
                                                <span className="text-[10px] font-mono text-yellow-500 bg-yellow-500/10 px-1 py-0.5 rounded-sm">MODIFIED</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="pt-1">
                                        {isEditing ? (
                                            <Textarea
                                                value={editData?.[key] || ''}
                                                onChange={(e) => setEditData({ ...editData, [key]: e.target.value })}
                                                className="min-h-[60px] text-base leading-relaxed font-sans bg-transparent border-border/50 rounded-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0"
                                            />
                                        ) : (
                                            renderDiffText(String(value), diff.isChanged, diff.oldValue)
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
