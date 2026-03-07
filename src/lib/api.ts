import { v4 as uuidv4 } from 'uuid';
import { createClient } from './supabase/client';
import { DEFAULT_MODES } from './default-modes';

export interface PromptModeDef {
    id: string;
    name: string;
    description: string;
    role?: string;
    law?: string;
    jsonTemplate?: string;
    referenceImageIds?: string[];
    isBaseMode: boolean;
    isHidden: boolean;
    createdAt: number;
}

// Keep interfaces minimal for frontend mapping from snake_case backend
export interface PromptSession {
    id: string;
    title: string;
    coverImageId?: string;
    previewText?: string;
    previewThumbnailId?: string;
    referenceImageIds?: string[];
    createdAt: number;
    updatedAt: number;
}

export interface PromptIteration {
    id: string;
    sessionId: string;
    parentId?: string;
    structuredPrompt?: any;
    rawPositivePrompt?: string;
    rawNegativePrompt?: string;
    imageIds: string[];
    referenceImageIds?: string[];
    metadata?: any;
    userNotes: string;
    createdAt: number;
}

export const api = {
    // Session APIs
    async createSession(title: string): Promise<string> {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) throw new Error("Must be logged in to create a session");

        const id = uuidv4();
        const nowIso = new Date().toISOString();

        const { error } = await supabase.from('sessions').insert({
            id,
            user_id: session.user.id,
            title,
            created_at: nowIso,
            updated_at: nowIso,
        });

        if (error) throw new Error(error.message);
        return id;
    },

    async updateSession(id: string, updates: Partial<PromptSession>): Promise<void> {
        const supabase = createClient();
        const mappedUpdates: any = { updated_at: new Date().toISOString() };

        if (updates.title !== undefined) mappedUpdates.title = updates.title;
        if (updates.previewText !== undefined) mappedUpdates.preview_text = updates.previewText;
        if (updates.previewThumbnailId !== undefined) mappedUpdates.preview_thumbnail_id = updates.previewThumbnailId;
        if (updates.coverImageId !== undefined) mappedUpdates.cover_image_id = updates.coverImageId;

        const { error } = await supabase.from('sessions').update(mappedUpdates).eq('id', id);
        if (error) throw new Error(error.message);
    },

    async getSession(id: string): Promise<PromptSession | undefined> {
        const supabase = createClient();
        const { data, error } = await supabase.from('sessions').select('*').eq('id', id).single();
        if (error || !data) return undefined;

        return {
            id: data.id,
            title: data.title,
            coverImageId: data.cover_image_id,
            previewText: data.preview_text,
            previewThumbnailId: data.preview_thumbnail_id,
            createdAt: new Date(data.created_at).getTime(),
            updatedAt: new Date(data.updated_at).getTime(),
        };
    },

    async deleteSession(id: string): Promise<void> {
        const supabase = createClient();
        // Because of "on delete cascade" on iterations table, this will automatically delete child iterations
        const { error } = await supabase.from('sessions').delete().eq('id', id);
        if (error) throw new Error(error.message);
    },

    async deleteIteration(id: string): Promise<void> {
        const supabase = createClient();
        const { error } = await supabase.from('iterations').delete().eq('id', id);
        if (error) throw new Error(error.message);
    },

    // Iteration APIs
    async createIteration(
        sessionId: string,
        data: Omit<PromptIteration, 'id' | 'sessionId' | 'createdAt'>
    ): Promise<string> {
        const supabase = createClient();
        const id = uuidv4();
        const nowIso = new Date().toISOString();

        const { error } = await supabase.from('iterations').insert({
            id,
            session_id: sessionId,
            parent_id: data.parentId || null,
            user_notes: data.userNotes,
            structured_prompt: data.structuredPrompt || null,
            mode_id: data.metadata?.mode || 'photorealistic',
            reference_image_ids: data.referenceImageIds || [],
            image_ids: data.imageIds || [],
            metadata: data.metadata || null,
            created_at: nowIso,
        });

        if (error) throw new Error(error.message);

        // Denormalize preview data into the parent session for fast gallery rendering
        const sessionUpdates: Partial<PromptSession> = {};
        if (data.structuredPrompt) {
            let longestString = '';
            for (const key in data.structuredPrompt) {
                if (typeof data.structuredPrompt[key] === 'string') {
                    if (data.structuredPrompt[key].length > longestString.length) {
                        longestString = data.structuredPrompt[key];
                    }
                }
            }
            if (longestString) {
                sessionUpdates.previewText = longestString.substring(0, 300);
            }
        }
        if (data.imageIds && data.imageIds.length > 0) {
            sessionUpdates.previewThumbnailId = data.imageIds[0];
        }
        await this.updateSession(sessionId, sessionUpdates);
        return id;
    },

    async updateIteration(id: string, updates: Partial<PromptIteration>): Promise<void> {
        const supabase = createClient();
        const mappedUpdates: any = {};

        if (updates.structuredPrompt !== undefined) mappedUpdates.structured_prompt = updates.structuredPrompt;
        if (updates.imageIds !== undefined) mappedUpdates.image_ids = updates.imageIds;
        if (updates.metadata !== undefined) mappedUpdates.metadata = updates.metadata;

        const { data: existingIter, error: getError } = await supabase.from('iterations').select('session_id').eq('id', id).single();
        if (getError) throw new Error(getError.message);

        const { error } = await supabase.from('iterations').update(mappedUpdates).eq('id', id);
        if (error) throw new Error(error.message);

        // If images or prompt were updated, sync to the parent session's preview
        const sessionUpdates: Partial<PromptSession> = {};
        if (updates.imageIds && updates.imageIds.length > 0) {
            sessionUpdates.previewThumbnailId = updates.imageIds[0];
        }
        if (updates.structuredPrompt) {
            let longestString = '';
            for (const key in updates.structuredPrompt) {
                if (typeof updates.structuredPrompt[key] === 'string') {
                    if (updates.structuredPrompt[key].length > longestString.length) {
                        longestString = updates.structuredPrompt[key];
                    }
                }
            }
            if (longestString) {
                sessionUpdates.previewText = longestString.substring(0, 300);
            }
        }

        if (Object.keys(sessionUpdates).length > 0) {
            await this.updateSession(existingIter.session_id, sessionUpdates);
        }
    },

    async getIteration(id: string): Promise<PromptIteration | undefined> {
        const supabase = createClient();
        const { data, error } = await supabase.from('iterations').select('*').eq('id', id).single();
        if (error || !data) return undefined;

        return {
            id: data.id,
            sessionId: data.session_id,
            parentId: data.parent_id,
            userNotes: data.user_notes,
            structuredPrompt: data.structured_prompt,
            imageIds: data.image_ids || [],
            referenceImageIds: data.reference_image_ids || [],
            metadata: data.metadata,
            createdAt: new Date(data.created_at).getTime()
        };
    },

    async getSessionIterations(sessionId: string): Promise<PromptIteration[]> {
        const supabase = createClient();
        const { data, error } = await supabase.from('iterations').select('*').eq('session_id', sessionId).order('created_at', { ascending: true });
        if (error || !data) return [];

        return data.map(i => ({
            id: i.id,
            sessionId: i.session_id,
            parentId: i.parent_id,
            userNotes: i.user_notes,
            structuredPrompt: i.structured_prompt,
            imageIds: i.image_ids || [],
            referenceImageIds: i.reference_image_ids || [],
            metadata: i.metadata,
            createdAt: new Date(i.created_at).getTime()
        }));
    },

    // Image APIs - Supabase Storage
    // saveImage now returns the full storage path (userId/filename) so that
    // useImageUrl can build the public URL without needing the session.
    async saveImage(blob: Blob, type: string): Promise<string> {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) throw new Error("Must be logged in to upload images");

        const id = uuidv4();
        const ext = type.split('/')[1] || 'jpg';
        const fileName = `${id}.${ext}`;
        const filePath = `${session.user.id}/${fileName}`;

        const { error } = await supabase.storage
            .from('prompt-images')
            .upload(filePath, blob, {
                contentType: type,
                upsert: true
            });

        if (error) throw new Error(error.message);
        // Return FULL PATH so useImageUrl can build public URL without needing session
        return filePath;
    },

    async getImage(id: string): Promise<any | undefined> {

        // Obsolete in cloud architecture, use URLs directly
        return undefined;
    },

    async getImageAsBase64(fileName: string): Promise<string | null> {
        // If it's a legacy Dexie ID (doesn't have an extension like .jpg or .webp)
        if (!fileName.includes('.')) {
            return null;
        }

        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return null;

        const filePath = `${session.user.id}/${fileName}`;

        try {
            // Create a short-lived signed URL to fetch the image securely
            const { data, error } = await supabase.storage.from('prompt-images').createSignedUrl(filePath, 60); // 1 min
            if (error || !data) return null;

            const res = await fetch(data.signedUrl);
            const blob = await res.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (typeof reader.result === 'string') {
                        resolve(reader.result);
                    } else {
                        reject(new Error("Failed to read blob as Base64"));
                    }
                };
                reader.onerror = () => reject(reader.error);
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            console.error("Failed to fetch image for base64 conversion", e);
            return null;
        }
    },

    // Modes APIs
    async getModes(): Promise<PromptModeDef[]> {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        try {
            const { data, error } = await supabase.from('modes').select('*').or(`is_base_mode.eq.true,user_id.eq.${session?.user?.id || '00000000-0000-0000-0000-000000000000'}`);
            if (error || !data || data.length === 0) {
                return DEFAULT_MODES as PromptModeDef[];
            }
            return data.map((m: any) => ({
                id: m.id,
                name: m.name,
                description: m.description,
                role: m.role,
                law: m.law,
                jsonTemplate: m.json_template,
                referenceImageIds: m.reference_image_ids,
                isBaseMode: m.is_base_mode,
                isHidden: m.is_hidden,
                createdAt: new Date(m.created_at).getTime()
            }));
        } catch (e) {
            return DEFAULT_MODES as PromptModeDef[];
        }
    },

    async createMode(mode: PromptModeDef): Promise<void> {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) throw new Error("Must be logged in");

        await supabase.from('modes').insert({
            id: mode.id,
            user_id: session.user.id,
            name: mode.name,
            description: mode.description,
            role: mode.role,
            law: mode.law,
            json_template: mode.jsonTemplate,
            reference_image_ids: mode.referenceImageIds,
            is_base_mode: false,
            is_hidden: mode.isHidden,
        });
    },

    async updateMode(id: string, updates: Partial<PromptModeDef>): Promise<void> {
        const supabase = createClient();
        const mappedUpdates: any = { updated_at: new Date().toISOString() };
        if (updates.name !== undefined) mappedUpdates.name = updates.name;
        if (updates.description !== undefined) mappedUpdates.description = updates.description;
        if (updates.role !== undefined) mappedUpdates.role = updates.role;
        if (updates.law !== undefined) mappedUpdates.law = updates.law;
        if (updates.jsonTemplate !== undefined) mappedUpdates.json_template = updates.jsonTemplate;
        if (updates.isHidden !== undefined) mappedUpdates.is_hidden = updates.isHidden;

        await supabase.from('modes').update(mappedUpdates).eq('id', id);
    },

    async deleteMode(id: string): Promise<void> {
        const supabase = createClient();
        await supabase.from('modes').delete().eq('id', id);
    }
};
