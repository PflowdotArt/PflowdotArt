import { db, PromptSession, PromptIteration, ImageRecord } from './db';
import { v4 as uuidv4 } from 'uuid';

export const api = {
    // Session APIs
    async createSession(title: string): Promise<string> {
        const id = uuidv4();
        const now = Date.now();
        await db.sessions.add({
            id,
            title,
            createdAt: now,
            updatedAt: now,
        });
        return id;
    },

    async updateSession(id: string, updates: Partial<PromptSession>): Promise<void> {
        await db.sessions.update(id, { ...updates, updatedAt: Date.now() });
    },

    async getSession(id: string): Promise<PromptSession | undefined> {
        return db.sessions.get(id);
    },

    async deleteSession(id: string): Promise<void> {
        // Delete associated iterations and images too
        const iterations = await db.iterations.where({ sessionId: id }).toArray();
        for (const iteration of iterations) {
            if (iteration.imageIds) {
                await db.images.bulkDelete(iteration.imageIds);
            }
        }
        await db.iterations.where({ sessionId: id }).delete();
        await db.sessions.delete(id);
    },

    async deleteIteration(id: string): Promise<void> {
        const iteration = await db.iterations.get(id);
        if (iteration?.imageIds?.length) {
            await db.images.bulkDelete(iteration.imageIds);
        }
        await db.iterations.delete(id);
    },

    // Iteration APIs
    async createIteration(
        sessionId: string,
        data: Omit<PromptIteration, 'id' | 'sessionId' | 'createdAt'>
    ): Promise<string> {
        const id = uuidv4();
        await db.iterations.add({
            id,
            sessionId,
            ...data,
            createdAt: Date.now(),
        });

        // Denormalize preview data into the parent session for fast gallery rendering
        const sessionUpdates: Partial<PromptSession> = {};
        if (data.structuredPrompt?.final_paragraph) {
            sessionUpdates.previewText = data.structuredPrompt.final_paragraph.substring(0, 200);
        }
        if (data.imageIds && data.imageIds.length > 0) {
            sessionUpdates.previewThumbnailId = data.imageIds[0];
        }
        await this.updateSession(sessionId, sessionUpdates);
        return id;
    },

    async updateIteration(id: string, updates: Partial<PromptIteration>): Promise<void> {
        await db.iterations.update(id, updates);

        // If images were updated, sync to the parent session's preview
        if (updates.imageIds && updates.imageIds.length > 0) {
            const iteration = await db.iterations.get(id);
            if (iteration) {
                await this.updateSession(iteration.sessionId, {
                    previewThumbnailId: updates.imageIds[0]
                });
            }
        }
    },

    async getIteration(id: string): Promise<PromptIteration | undefined> {
        return db.iterations.get(id);
    },

    async getSessionIterations(sessionId: string): Promise<PromptIteration[]> {
        return db.iterations.where({ sessionId }).sortBy('createdAt');
    },

    // Image APIs
    async saveImage(blob: Blob, type: string): Promise<string> {
        const id = uuidv4();
        await db.images.add({
            id,
            data: blob,
            type,
            createdAt: Date.now(),
        });
        return id;
    },

    async getImage(id: string): Promise<ImageRecord | undefined> {
        return db.images.get(id);
    },

    async getImageAsBase64(id: string): Promise<string | null> {
        const record = await this.getImage(id);
        if (!record) return null;

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
            reader.readAsDataURL(record.data);
        });
    }
};
