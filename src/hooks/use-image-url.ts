import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

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

        let isMounted = true;
        const supabase = createClient();

        const fetchUrl = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            const filePath = `${session.user.id}/${imageId}`;

            // The bucket is PUBLIC — use getPublicUrl (no auth/expiry issues)
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
