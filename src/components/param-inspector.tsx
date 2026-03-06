import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles, SlidersHorizontal, ArrowRight, X } from "lucide-react";

interface ParamInspectorProps {
    params: Record<string, string | null>;
    onParamChangeRequest: (overrideInstruction: string) => void;
    isGenerating: boolean;
    isChatInputActive: boolean;
    onOverrideActiveChange: (isActive: boolean) => void;
}

// Formats "lighting_style" to "Lighting Style"
function formatLabel(key: string): string {
    return key
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export function ParamInspector({ params, onParamChangeRequest, isGenerating, isChatInputActive, onOverrideActiveChange }: ParamInspectorProps) {
    const [localParams, setLocalParams] = React.useState(params);

    React.useEffect(() => {
        setLocalParams(params);
    }, [params]);

    const handleChange = (field: string, val: string) => {
        setLocalParams(prev => ({ ...prev, [field]: val }));
    };

    const keys = Object.keys(params);

    const dirtyKeys = keys.filter((key) =>
        (localParams[key] || "") !== (params[key] || "")
    );

    const isDirty = dirtyKeys.length > 0;

    React.useEffect(() => {
        onOverrideActiveChange(isDirty);
    }, [isDirty, onOverrideActiveChange]);

    const handleApplyAll = () => {
        if (dirtyKeys.length === 0) return;
        const changes = dirtyKeys.map(k => `[${formatLabel(k)}] strictly to "${localParams[k]}"`).join(", ");
        onParamChangeRequest(`DIRECTOR OVERRIDE: Change ${changes}. Do NOT alter the core subject or non-related components. Rewrite the script harmoniously to accommodate these new parameters.`);
    };

    const handleCancel = () => {
        setLocalParams(params);
    };

    return (
        <div className="border border-border/30 bg-background/50 backdrop-blur-sm p-5 relative overflow-hidden group">
            {/* Minimalist Top Accent */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-primary/40"></div>

            <div className="mb-6 flex items-center justify-between border-b border-border/30 pb-3">
                <h2 className="text-[10px] font-mono uppercase tracking-widest text-primary flex items-center gap-2">
                    <SlidersHorizontal className="h-3 w-3" />
                    [SYS.DIRECTOR_CONTROLS]
                </h2>
            </div>

            <div className="space-y-6">
                {keys.map((key) => {
                    const value = localParams[key] || "";
                    const label = formatLabel(key);

                    return (
                        <div key={key} className="space-y-1 relative group/input">
                            <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</Label>
                            <Input
                                value={value}
                                placeholder={`...`}
                                onChange={(e) => handleChange(key, e.target.value)}
                                className={`h-auto py-2 px-3 text-sm font-mono bg-black/20 border border-border/20 border-b-border/50 rounded-none focus-visible:ring-0 focus-visible:border-b-primary placeholder:text-muted-foreground/30 transition-colors ${isChatInputActive ? 'opacity-40 cursor-not-allowed text-muted-foreground' : ''}`}
                                disabled={isGenerating || isChatInputActive}
                            />
                            <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-primary transition-all duration-300 group-hover/input:w-full"></div>
                        </div>
                    );
                })}

                {dirtyKeys.length > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                        <Button
                            size="sm"
                            className="flex-1 h-8 transition-all bg-primary text-primary-foreground flex gap-2"
                            onClick={handleApplyAll}
                            disabled={isGenerating}
                        >
                            <Sparkles className="h-4 w-4" />
                            Apply {dirtyKeys.length} Override{dirtyKeys.length > 1 ? 's' : ''}
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted shrink-0 transition-colors"
                            onClick={handleCancel}
                            disabled={isGenerating}
                            title="Cancel overrides"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}

                <div className="pt-4 border-t border-border/30 mt-6">
                    <p className="text-[10px] font-mono text-muted-foreground/60 italic leading-relaxed uppercase tracking-wide">
                        // Editing a parameter will instruct the AI to seamlessly rewrite the active iteration's script.
                    </p>
                </div>
            </div>
        </div>
    );
}
