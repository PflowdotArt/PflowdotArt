import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useImageUrl(imageId?: string) {
    const [url, setUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!imageId) {
            setUrl(null);
            return;
        }

        if (imageId.startsWith('http') || imageId.startsWith('data:') || imageId.startsWith('blob:')) {
            setUrl(imageId);
            return;
        }

        let isMounted = true;
        const supabase = createClient();

        const fetchUrl = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            const filePath = `${session.user.id}/${imageId}`;

            // If the imageId doesn't have an extension (legacy Dexie ID format synced to cloud but no file), 
            // or if it fails, fail gracefully without spamming the console
            try {
                const { data, error } = await supabase.storage
                    .from('prompt-images')
                    .createSignedUrl(filePath, 3600); // Valid for 1 hour locally

                if (error) {
                    if (isMounted) setUrl(null);
                    return;
                }

                if (isMounted && data) {
                    setUrl(data.signedUrl);
                }
            } catch (e) {
                if (isMounted) setUrl(null);
                return;
            }
        };

        fetchUrl();

        return () => {
            isMounted = false;
        };
    }, [imageId]);

    return url;
}
