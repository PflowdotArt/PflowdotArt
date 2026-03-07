"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Database, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useLLMSettings } from "@/hooks/use-llm-settings"; // Just to force client boundary if needed

export default function RescuePage() {
    const [status, setStatus] = useState<string>("Initializing...");
    const [imagesFound, setImagesFound] = useState<{ id: string, data: Blob, type?: string }[]>([]);
    const [isRecovering, setIsRecovering] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        findLegacyImages();
    }, []);

    const findLegacyImages = async () => {
        setStatus("Searching browser's IndexedDB for legacy databases...");
        try {
            // Modern browsers support indexedDB.databases()
            const dbs = await window.indexedDB.databases();
            let dbName = "PromptFlowDB_V2"; // The verified original Dexie DB name

            // If we find one that looks like ours, prioritize it
            if (dbs.find(d => d.name?.includes("PromptFlow"))) {
                dbName = dbs.find(d => d.name?.includes("PromptFlow"))!.name!;
            }

            setStatus(`Opening database: ${dbName}`);
            const request = window.indexedDB.open(dbName);

            request.onerror = (e) => {
                setStatus(`Failed to open IndexedDB: ${(e.target as any).error?.message || "Unknown error"}`);
            };

            request.onsuccess = (e) => {
                const db = (e.target as any).result as IDBDatabase;
                if (!db.objectStoreNames.contains("images")) {
                    setStatus(`Database ${dbName} does not contain an 'images' table. No legacy images found.`);
                    return;
                }

                setStatus("Scanning legacy images table...");
                const tx = db.transaction("images", "readonly");
                const store = tx.objectStore("images");
                const getAllRequest = store.getAll();

                getAllRequest.onsuccess = () => {
                    const result = getAllRequest.result;
                    if (result && result.length > 0) {
                        setImagesFound(result);
                        setStatus(`Found ${result.length} orphaned images in local storage! Ready to rescue.`);
                    } else {
                        setStatus("The 'images' table is empty. No local images to recover.");
                    }
                };

                getAllRequest.onerror = () => {
                    setStatus("Error reading images from local database.");
                };
            };

            // If the DB didn't exist, this might trigger an upgrade needed which we don't want to handle
            request.onupgradeneeded = (e) => {
                const db = (e.target as any).result as IDBDatabase;
                db.close(); // Abort creating a new one
                setStatus("Legacy database not found on this device.");
            };
        } catch (err: any) {
            setStatus(`Browser API error: ${err.message}`);
        }
    };

    const handleRecover = async () => {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
            setStatus("ERROR: You must be logged in to rescue images to your cloud account.");
            return;
        }

        setIsRecovering(true);
        setStatus(`Starting upload of ${imagesFound.length} images to Supabase...`);
        let successCount = 0;

        for (let i = 0; i < imagesFound.length; i++) {
            const item = imagesFound[i];
            const itemBlob = item.data;
            const ext = (itemBlob?.type || item.type || 'image/jpeg').split('/')[1] || 'jpeg';
            // We MUST upload it exactly as the legacy ID so Postgres constraints match without updating DB
            const fileName = item.id;
            const filePath = `${session.user.id}/${fileName}`;

            try {
                // If the blob is raw, it might be heavily unoptimized, but we'll upload as-is to ensure data safety
                const { error } = await supabase.storage
                    .from('prompt-images')
                    .upload(filePath, itemBlob, {
                        contentType: itemBlob?.type || item.type || `image/${ext}`,
                        upsert: true
                    });

                if (error) {
                    console.error("Upload error for", fileName, error);
                } else {
                    successCount++;
                }
            } catch (err) {
                console.error("Upload crash for", fileName, err);
            }
            setProgress(Math.round(((i + 1) / imagesFound.length) * 100));
        }

        setStatus(`Rescue complete! Successfully uploaded ${successCount} out of ${imagesFound.length} images. You can now safely leave this page.`);
        setIsRecovering(false);
    };

    return (
        <div className="container mx-auto px-4 py-12 max-w-2xl">
            <Link href="/gallery" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Safety
            </Link>

            <div className="bg-card border shadow-lg rounded-xl overflow-hidden">
                <div className="p-6 border-b bg-muted/20 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Database className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Data Rescue Protocol</h1>
                        <p className="text-sm text-muted-foreground">Recovering stranded local images to the cloud</p>
                    </div>
                </div>

                <div className="p-6">
                    <p className="text-sm text-foreground/80 mb-6 leading-relaxed">
                        During the migration to a cloud-native architecture, your image files remained securely stored
                        inside your browser's local IndexedDB. This utility will extract them and manually sync them
                        into your Supabase Storage bucket.
                    </p>

                    <div className={`p-4 rounded-lg mb-6 flex items-start gap-3 border ${imagesFound.length > 0 ? 'bg-primary/5 border-primary/20' : 'bg-muted/50 border-muted'}`}>
                        {imagesFound.length > 0 ? (
                            <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                        ) : (
                            <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                        )}
                        <div>
                            <h3 className="font-semibold text-sm mb-1">Status Report</h3>
                            <p className="text-sm font-mono text-muted-foreground">{status}</p>
                        </div>
                    </div>

                    {imagesFound.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm">
                                <span>Images to Upload:</span>
                                <span className="font-mono font-bold">{imagesFound.length} files</span>
                            </div>

                            {isRecovering && (
                                <div className="space-y-2">
                                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-right text-muted-foreground">{progress}% Complete</p>
                                </div>
                            )}

                            <Button
                                onClick={handleRecover}
                                disabled={isRecovering}
                                className="w-full gap-2 mt-4"
                                size="lg"
                            >
                                <Save className="h-4 w-4" />
                                {isRecovering ? 'Uploading to Supabase...' : 'Execute Rescue Protocol'}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
