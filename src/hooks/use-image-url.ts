import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Resolves an image ID to a displayable URL.
 * NEW FORMAT: imageId is "userId/filename.ext" (full path).
 * LEGACY FORMAT: imageId is just "filename.ext" (needs session).
 */
export function useImageUrl(imageId?: string) {
    const [url, setUrl] = useState<string | null>(null);

    useEffect(() => {
        console.log('[useImageUrl] imageId changed:', imageId);

        if (!imageId) {
            setUrl(null);
            return;
        }

        // Pass-through for already-resolved URLs
        if (imageId.startsWith('http') || imageId.startsWith('data:') || imageId.startsWith('blob:')) {
            setUrl(imageId);
            return;
        }

        // Legacy Dexie IDs have no extension — skip
        if (!imageId.includes('.')) {
            setUrl(null);
            return;
        }

        const supabase = createClient();

        const fetchUrl = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            console.log('[useImageUrl] session?.user?.id:', session?.user?.id);

            let filePath: string;

            // NEW FORMAT: "userId/filename.ext" → use as-is
            // LEGACY: "filename.ext" → prepend userId
            if (imageId.includes('/')) {
                filePath = imageId;
            } else {
                if (!session?.user) {
                    console.log('[useImageUrl] no session + no path = cannot resolve');
                    return;
                }
                filePath = `${session.user.id}/${imageId}`;
            }

            console.log('[useImageUrl] calling getPublicUrl with path:', filePath);
            const { data } = supabase.storage
                .from('prompt-images')
                .getPublicUrl(filePath);

            console.log('[useImageUrl] publicUrl result:', data?.publicUrl);
            setUrl(data?.publicUrl ?? null);
        };

        fetchUrl();
    }, [imageId]);

    return url;
}
