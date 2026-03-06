"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase/client";
import { LogoutButton } from "@/components/logout-button";
import { User } from "@supabase/supabase-js";

export function Header() {
    const pathname = usePathname();
    const [artColor, setArtColor] = useState("text-primary");
    const [user, setUser] = useState<User | null>(null);
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);

            const { data: { subscription } } = supabase.auth.onAuthStateChange(
                (_event, session) => {
                    setUser(session?.user ?? null);
                }
            );
            return () => subscription.unsubscribe();
        };
        getUser();
    }, [supabase.auth]);

    useEffect(() => {
        const colors = [
            "text-blue-500 dark:text-blue-400",
            "text-emerald-500 dark:text-emerald-400",
            "text-amber-500 dark:text-amber-400",
            "text-purple-500 dark:text-purple-400",
            "text-rose-500 dark:text-rose-400"
        ];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        setArtColor(randomColor);
    }, []);

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-14 items-center gap-4 px-4 sm:px-6">
                <Link href="/" className="flex items-baseline font-mono text-lg tracking-tight select-none cursor-pointer">
                    <span className="font-bold">P</span>
                    <span className={`opacity-40 font-normal transition-colors duration-1000 ${artColor}`}>rompt</span>
                    <span className="font-bold">Flow.</span>
                    <span className={`font-bold transition-colors duration-1000 ${artColor}`}>art</span>
                </Link>
                <div className="flex flex-1 items-center justify-end space-x-4">
                    <nav className="flex items-center gap-4 text-sm font-medium">
                        <Link
                            href="/gallery"
                            className={`transition-colors hover:text-foreground ${pathname === "/gallery" ? "text-primary font-semibold" : "text-muted-foreground"}`}
                        >
                            Gallery
                        </Link>
                        <Link
                            href="/modes"
                            className={`transition-colors hover:text-foreground ${pathname === "/modes" ? "text-primary font-semibold" : "text-muted-foreground"}`}
                        >
                            Modes
                        </Link>
                        <Link
                            href="/settings"
                            className={`transition-colors hover:text-foreground ${pathname === "/settings" ? "text-primary font-semibold" : "text-muted-foreground"}`}
                        >
                            Settings
                        </Link>

                        <div className="mx-2 h-4 w-px bg-border max-sm:hidden" />

                        {user ? (
                            <div className="flex items-center gap-4">
                                {user.user_metadata?.avatar_url && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={user.user_metadata.avatar_url}
                                        alt="Avatar"
                                        className="w-8 h-8 rounded-full border border-zinc-800"
                                    />
                                )}
                                <LogoutButton />
                            </div>
                        ) : (
                            <Link
                                href="/login"
                                className={`transition-colors hover:text-foreground ${pathname === "/login" ? "text-primary font-semibold" : "text-muted-foreground"}`}
                            >
                                Sign In
                            </Link>
                        )}

                        <ThemeToggle />
                    </nav>
                </div>
            </div>
        </header>
    );
}
