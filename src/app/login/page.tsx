"use client";

import Link from "next/link";
import { Sparkles, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function LoginPage() {
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const supabase = createClient();

    const signInWithGoogle = async () => {
        setIsLoading(true);
        setError(null);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            setError(error.message);
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center bg-zinc-950 p-4">
            {/* Background elements */}
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/40 via-zinc-950 to-zinc-950 pointer-events-none" />

            <div className="w-full max-w-sm relative z-10 flex flex-col bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800/50 shadow-2xl backdrop-blur-xl">
                {/* Header */}
                <div className="flex flex-col items-center mb-6 text-center">
                    <div className="h-12 w-12 rounded-xl bg-black border border-zinc-800 flex items-center justify-center mb-6 shadow-inner">
                        <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight mb-2">Welcome Back</h1>
                    <p className="text-zinc-400 text-sm">Sign in to sync your prompt library</p>
                </div>

                {error && (
                    <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2 text-destructive text-sm">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                {/* OAuth Button */}
                <button
                    onClick={signInWithGoogle}
                    disabled={isLoading}
                    className="w-full relative flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-zinc-100 text-black font-medium rounded-lg transition-colors mb-4 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    type="button"
                >
                    {/* Simple SVG fallback for Google Icon to keep dependencies light initially */}
                    <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                        />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                        />
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                        />
                    </svg>
                    Continue with Google
                </button>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-zinc-800"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                        <span className="bg-zinc-900 px-2 text-zinc-500 font-mono uppercase tracking-widest">Or</span>
                    </div>
                </div>

                {/* Email Form Scaffold */}
                <form className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="email" className="text-sm font-medium text-zinc-300">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            placeholder="operator@promptflow.art"
                            className="px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all font-sans"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="password" className="text-sm font-medium text-zinc-300">Password</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            className="px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all font-mono"
                        />
                    </div>

                    <button
                        type="button"
                        className="mt-2 w-full flex items-center justify-center px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                        Sign In with Email
                    </button>
                </form>

                <p className="mt-8 text-center text-sm text-zinc-500">
                    Don&apos;t have an account?{" "}
                    <Link href="/login" className="text-primary hover:text-white transition-colors">
                        Contact Admin
                    </Link>
                </p>
            </div>
        </div>
    );
}
