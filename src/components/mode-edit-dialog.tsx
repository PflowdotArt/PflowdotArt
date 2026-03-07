import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PromptModeDef } from "@/lib/api";

interface ModeEditDialogProps {
  mode: PromptModeDef | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedMode: PromptModeDef) => void;
}

export function ModeEditDialog({ mode, isOpen, onClose, onSave }: ModeEditDialogProps) {
  const [editedMode, setEditedMode] = useState<PromptModeDef | null>(null);

  useEffect(() => {
    if (mode && isOpen) {
      setEditedMode({ ...mode });
    }
  }, [mode, isOpen]);

  const handleSave = () => {
    if (!editedMode) return;
    onSave(editedMode);
  };

  if (!editedMode) return null;

  const isReadOnly = editedMode.isBaseMode;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-6">
        <DialogHeader className="shrink-0 mb-4">
          <DialogTitle className="flex items-center gap-2">
            <span className="text-xl font-mono">{editedMode.name}</span>
            {isReadOnly && <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full uppercase tracking-widest font-mono">Core Base (Read Only System Prompt)</span>}
          </DialogTitle>
          <DialogDescription>
            View and edit the 3 foundational blocks of this mode: Role, Law, and JSON Structure.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-muted-foreground uppercase text-xs tracking-widest">Mode Name</Label>
            <Input
              id="name"
              value={editedMode.name}
              onChange={(e) => setEditedMode({ ...editedMode, name: e.target.value })}
              disabled={isReadOnly}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description" className="text-muted-foreground uppercase text-xs tracking-widest">Short Description</Label>
            <Input
              id="description"
              value={editedMode.description}
              onChange={(e) => setEditedMode({ ...editedMode, description: e.target.value })}
            />
          </div>

          <hr className="border-border/50" />

          {/* Block 1: Role */}
          <div className="grid gap-2">
            <Label htmlFor="roleBlock" className="text-primary font-semibold flex flex-col gap-1">
              <span>1. System Persona (The Role)</span>
              <span className="text-xs font-normal text-muted-foreground">Define who the AI is and what its core goal is.</span>
            </Label>
            <Textarea
              id="roleBlock"
              className="font-mono text-sm min-h-[120px] bg-muted/10 leading-relaxed"
              value={editedMode.role}
              onChange={(e) => setEditedMode({ ...editedMode, role: e.target.value })}
              disabled={isReadOnly}
            />
          </div>

          {/* Block 2: Law */}
          <div className="grid gap-2">
            <Label htmlFor="lawBlock" className="text-primary font-semibold flex flex-col gap-1">
              <span>2. Rules of Creation (The Law)</span>
              <span className="text-xs font-normal text-muted-foreground">Define the strict chronological rules the AI must follow. Start with '# THE X-SENTENCE LAW'.</span>
            </Label>
            <Textarea
              id="lawBlock"
              className="font-mono text-sm min-h-[160px] bg-muted/10 leading-relaxed"
              value={editedMode.law}
              onChange={(e) => setEditedMode({ ...editedMode, law: e.target.value })}
              disabled={isReadOnly}
            />
          </div>

          {/* Block 3: JSON / Extracted Params */}
          <div className="grid gap-2">
            <Label htmlFor="jsonBlock" className="text-primary font-semibold flex flex-col gap-1">
              <span>3. JSON Structure & Output Rules</span>
              <span className="text-xs font-normal text-muted-foreground">Define the strict JSON format and critical system constraints.</span>
            </Label>
            <Textarea
              id="jsonBlock"
              className="font-mono text-[13px] min-h-[300px] bg-black/80 text-green-400 leading-relaxed font-semibold border-muted/30"
              value={editedMode.jsonTemplate}
              onChange={(e) => setEditedMode({ ...editedMode, jsonTemplate: e.target.value })}
              disabled={isReadOnly}
              spellCheck={false}
            />
          </div>
        </div>

        <DialogFooter className="mt-6 shrink-0 border-t pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          {!isReadOnly && <Button onClick={handleSave}>Save Meta-Architecture</Button>}
          {isReadOnly && <Button onClick={onClose}>Close</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
