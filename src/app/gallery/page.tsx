"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { db, PromptSession } from "@/lib/db";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Sparkles, Plus, Layers, Trash2 } from "lucide-react";
import { useImageUrl } from "@/hooks/use-image-url";
import { useResponsiveColumns } from "@/hooks/use-responsive-columns";
import Link from "next/link";

const PAGE_SIZE = 20;

const isCJK = (text: string) => /[\u4e00-\u9fa5]/.test(text);

function SessionCard({ session, onDeletePrompt }: { session: PromptSession, onDeletePrompt: (e: React.MouseEvent) => void }) {
  // Use the denormalized preview fields directly from the session — no extra queries needed
  const imageUrl = useImageUrl(session.previewThumbnailId || session.coverImageId);
  const poetryText = session.previewText;

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDeletePrompt(e);
  };

  return (
    <Link
      href={`/prompt/${session.id}`}
      className="group block overflow-hidden relative bg-card text-card-foreground transition-all hover:ring-2 hover:ring-primary/50 z-0 hover:z-10 mb-1"
    >
      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 z-10 p-1.5 bg-black/50 hover:bg-destructive text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
        title="Delete Prompt"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {imageUrl ? (
        <>
          <div className="relative w-full overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={session.title}
              className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
          <div className="absolute inset-x-0 bottom-0 p-4 pt-16 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
            <h3 className={`text-white/90 font-sans text-xs font-medium leading-snug break-words ${isCJK(session.title) ? 'line-clamp-2' : 'line-clamp-3'}`}>
              {session.title}
            </h3>
            <p className="text-white/50 font-mono text-[9px] mt-2 uppercase tracking-widest">
              {new Date(session.updatedAt).toLocaleDateString()}
            </p>
          </div>
        </>
      ) : (
        <div className="relative w-full aspect-[3/4] flex flex-col bg-zinc-950 text-zinc-100">
          {/* Top 65% for Poetry */}
          <div className="relative h-[65%] flex flex-col justify-center p-6 pb-2">
            <div className="absolute top-4 left-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="h-3 w-3" />
              [ SYS.INIT ]
            </div>

            <div className="w-full mt-4">
              {poetryText ? (
                <p className="text-sm md:text-base font-sans leading-relaxed text-zinc-300 line-clamp-4 text-left w-full relative z-10 selection:bg-primary/30 break-words">
                  {poetryText}
                </p>
              ) : (
                <p className="text-sm md:text-base font-sans leading-relaxed text-zinc-500 line-clamp-4 text-left w-full italic break-words">
                  Blank canvas waiting for input...
                </p>
              )}
            </div>
          </div>

          {/* Bottom 35% for Footer */}
          <div className="h-[35%] w-full p-4 flex flex-col justify-center border-t border-zinc-800/50 bg-background/50">
            <h3 className={`text-white/90 font-sans text-xs font-medium leading-snug break-words ${isCJK(session.title) ? 'line-clamp-2' : 'line-clamp-3'}`}>
              {session.title}
            </h3>
            <p className="text-white/50 font-mono text-[9px] mt-2 uppercase tracking-widest text-white/40">
              {new Date(session.updatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}
    </Link>
  );
}

export default function Home() {
  const router = useRouter();
  const [sessions, setSessions] = useState<PromptSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const observerRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const columns = useResponsiveColumns();

  // Distribute sessions evenly left-to-right across active columns
  const colArrays = Array.from({ length: columns }, () => [] as PromptSession[]);
  sessions.forEach((session, i) => {
    colArrays[i % columns].push(session);
  });

  // Load a page of sessions
  const loadMore = useCallback(async () => {
    if (!hasMore) return;
    setIsLoading(true);
    try {
      const page = await db.sessions
        .orderBy('updatedAt')
        .reverse()
        .offset(offsetRef.current)
        .limit(PAGE_SIZE)
        .toArray();

      if (page.length < PAGE_SIZE) {
        setHasMore(false);
      }

      setSessions(prev => {
        // Deduplicate by ID in case of concurrent loads
        const existingIds = new Set(prev.map(s => s.id));
        const newItems = page.filter(s => !existingIds.has(s.id));
        return [...prev, ...newItems];
      });
      offsetRef.current += page.length;
    } catch (err) {
      console.error("Failed to load sessions", err);
    } finally {
      setIsLoading(false);
    }
  }, [hasMore]);

  // Initial load
  useEffect(() => {
    loadMore();
  }, [loadMore]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const currentRef = observerRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(currentRef);
    return () => observer.disconnect();
  }, [hasMore, isLoading, loadMore]);

  const handleCreateSession = async () => {
    try {
      const id = await api.createSession("New Prompt Idea");
      router.push(`/prompt/${id}`);
    } catch (err) {
      console.error("Failed to create session", err);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    await api.deleteSession(sessionId);
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    setSessionToDelete(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prompt Iterations</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Craft, iterate, and track your AI generation concepts using structured expert templates.
          </p>
        </div>
        <button
          onClick={handleCreateSession}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-4 py-2"
        >
          <Plus className="h-4 w-4" />
          New Prompt
        </button>
      </div>

      {isLoading && sessions.length === 0 ? (
        <div className="flex w-full gap-2">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="flex flex-col flex-1 gap-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className={`bg-muted w-full animate-pulse transition-all ${Math.random() > 0.5 ? 'aspect-[3/4]' : 'aspect-square'}`}></div>
              ))}
            </div>
          ))}
        </div>
      ) : !isLoading && sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed rounded-xl">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Layers className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight mb-2">No active prompts yet</h2>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Start by telling the AI your first idea to generate an expert-level structured prompt format.
          </p>
          <button
            onClick={handleCreateSession}
            className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-4 py-2"
          >
            <Plus className="h-4 w-4" />
            Create First Prompt
          </button>
        </div>
      ) : (
        <>
          <div className="flex w-full gap-1 items-start">
            {colArrays.map((colSessions, colIndex) => (
              <div key={colIndex} className="flex flex-col flex-1 gap-1">
                {colSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onDeletePrompt={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSessionToDelete(session.id);
                    }}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Infinite Scroll Sentinel */}
          <div ref={observerRef} className="h-20 flex items-center justify-center">
            {isLoading && (
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            )}
            {!hasMore && sessions.length > PAGE_SIZE && (
              <p className="text-muted-foreground text-xs font-mono uppercase tracking-widest">// End of Gallery</p>
            )}
          </div>
        </>
      )}

      {/* Retro Terminal Delete Modal */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-950 border border-destructive/50 w-full max-w-md p-6 relative overflow-hidden flex flex-col items-center text-center shadow-2xl">
            {/* Minimal Accents */}
            <div className="absolute top-0 left-0 w-full h-1 bg-destructive/80"></div>
            <div className="absolute top-2 left-2 text-[10px] font-mono text-destructive/50 uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="h-3 w-3" />
              [ SYS.WARN ]
            </div>

            <Trash2 className="h-12 w-12 text-destructive mb-4 mt-8 opacity-80" />

            <h2 className="text-xl font-mono text-zinc-100 mb-2 tracking-tight uppercase">Delete_Session?</h2>
            <p className="text-zinc-500 font-sans text-sm mb-8 leading-relaxed max-w-[280px]">
              This action cannot be undone. All prompt iterations, variations, and history will be permanently erased.
            </p>

            <div className="flex w-full gap-4">
              <button
                onClick={() => setSessionToDelete(null)}
                className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-border/50 py-3 font-mono text-xs uppercase tracking-widest transition-colors rounded-none"
              >
                Abort
              </button>
              <button
                onClick={() => handleDeleteSession(sessionToDelete)}
                className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground py-3 font-mono text-xs uppercase tracking-widest transition-colors rounded-none shadow-[0_0_15px_rgba(220,38,38,0.4)]"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
