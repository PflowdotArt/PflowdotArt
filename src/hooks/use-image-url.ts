import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export function useImageUrl(imageId?: string) {
    const [url, setUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!imageId) {
            setUrl(null);
            return;
        }

        let objectUrl: string | null = null;
        let isMounted = true;

        api.getImage(imageId).then((imageRecord) => {
            if (!isMounted) return;
            if (imageRecord && imageRecord.data) {
                objectUrl = URL.createObjectURL(imageRecord.data);
                setUrl(objectUrl);
            } else {
                setUrl(null);
            }
        });

        return () => {
            isMounted = false;
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [imageId]);

    return url;
}
