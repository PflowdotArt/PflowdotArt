import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

/**
 * Resolves an image ID to a displayable URL.
 *
 * Supports three formats for imageId:
 *  1. Full path: "userId/filename.png"  → builds public storage URL directly (no session needed)
 *  2. Filename only: "filename.png"     → falls back to session-based URL construction (legacy)
 *  3. Already a URL / data URI          → pass through unchanged
 */
export function useImageUrl(imageId?: string) {
    const [url, setUrl] = useState<string | null>(null);

    useEffect(() => {
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

        // NEW FORMAT: "userId/filename.ext" — build public URL directly, no session needed
        if (imageId.includes('/')) {
            const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/prompt-images/${imageId}`;
            setUrl(publicUrl);
            return;
        }

        // LEGACY FORMAT: "filename.ext" only — need session to prepend userId
        let isMounted = true;
        const supabase = createClient();

        const fetchUrl = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            const filePath = `${session.user.id}/${imageId}`;
            const { data } = supabase.storage
                .from('prompt-images')
                .getPublicUrl(filePath);

            if (isMounted && data?.publicUrl) {
                setUrl(data.publicUrl);
            }
        };

        fetchUrl();

        return () => {
            isMounted = false;
        };
    }, [imageId]);

    return url;
}
