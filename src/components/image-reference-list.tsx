import { useImageUrl } from "@/hooks/use-image-url";
import { X, Maximize2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

interface ImageReferenceChipProps {
    imageId: string;
    index: number;
    onRemove?: (id: string) => void;
}

function ImageReferenceChip({ imageId, index, onRemove }: ImageReferenceChipProps) {
    const imageUrl = useImageUrl(imageId);

    const [isOpen, setIsOpen] = useState(false);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <div className={`group relative h-12 w-12 flex-shrink-0 animate-in fade-in zoom-in-95 duration-200 ${!onRemove ? 'cursor-pointer hover:ring-2 hover:ring-primary/50 rounded-md transition-all' : ''}`}>
                    {imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={imageUrl}
                            alt="Reference"
                            className="h-full w-full object-cover rounded-md border border-border/50 shadow-sm"
                        />
                    ) : (
                        <div className="h-full w-full bg-muted animate-pulse rounded-md border border-border/50" />
                    )}

                    {!onRemove && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-md pointer-events-none">
                            <Maximize2 className="h-4 w-4 text-white drop-shadow-md" />
                        </div>
                    )}

                    <div className="absolute -bottom-1.5 -right-1.5 bg-foreground text-background text-[9px] font-bold font-mono h-[18px] w-[18px] rounded-full flex items-center justify-center border-2 border-background shadow-sm pointer-events-none z-10">
                        {index + 1}
                    </div>

                    {onRemove && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onRemove(imageId);
                            }}
                            className="absolute -top-2 -right-2 bg-background border rounded-full p-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground hover:border-foreground/50 hover:bg-muted shadow-sm z-20"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    )}
                </div>
            </DialogTrigger>

            {/* Full Screen Image Preview Modal */}
            <DialogContent showCloseButton={false} className="max-w-[80vw] max-h-[80vh] md:max-w-[90vw] md:max-h-[90vh] w-fit p-0 border-none bg-transparent shadow-2xl flex items-center justify-center">
                <DialogTitle className="sr-only">Image Reference Preview</DialogTitle>
                {imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={imageUrl}
                        alt="Enlarged Reference"
                        onClick={() => setIsOpen(false)}
                        className="max-w-[80vw] max-h-[80vh] md:max-w-[90vw] md:max-h-[90vh] object-contain rounded-md cursor-pointer"
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}

interface ImageReferenceListProps {
    imageIds: string[];
    onRemove?: (id: string) => void;
}

export function ImageReferenceList({ imageIds, onRemove }: ImageReferenceListProps) {
    if (!imageIds || imageIds.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-3 pb-3">
            {imageIds.map((id, index) => (
                <ImageReferenceChip key={id} imageId={id} index={index} onRemove={onRemove} />
            ))}
        </div>
    );
}
