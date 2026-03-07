"use client";

import Link from "next/link";
import { AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

// Google SVG icon
function GoogleIcon() {
    return (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden>
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    );
}

function AuthForm() {
    const searchParams = useSearchParams();
    const [isSignUp, setIsSignUp] = useState(searchParams.get("tab") === "register");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Clock ticker for the animated node ID
    const [tick, setTick] = useState(0);
    useEffect(() => {
        const t = setInterval(() => setTick((n) => n + 1), 2000);
        return () => clearInterval(t);
    }, []);

    const supabase = createClient();

    const signInWithGoogle = async () => {
        setIsLoading(true);
        setError(null);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) { setError(error.message); setIsLoading(false); }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setMessage(null);

        if (isSignUp) {
            const { error, data } = await supabase.auth.signUp({
                email,
                password,
                options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
            });
            if (error) setError(error.message);
            else if (data?.user?.identities?.length === 0) setError("Account already exists. Please sign in.");
            else setMessage("Check your email to verify your account.");
        } else {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) setError(error.message);
            else window.location.href = "/gallery";
        }
        setIsLoading(false);
    };

    const switchMode = () => {
        setIsSignUp((v) => !v);
        setError(null);
        setMessage(null);
    };

    return (
        <div className="min-h-screen bg-black flex overflow-hidden">

            {/* ── LEFT BRAND PANEL ── */}
            <div className="hidden lg:flex w-[52%] relative flex-col justify-between p-14 overflow-hidden border-r border-white/5">

                {/* Grid lines */}
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
                        backgroundSize: "48px 48px",
                    }}
                />

                {/* Diagonal accent lines */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute h-px bg-gradient-to-r from-transparent via-white/8 to-transparent"
                            style={{
                                width: "160%", left: "-30%",
                                top: `${15 + i * 16}%`,
                                transform: `rotate(-${8 + i * 0.5}deg)`,
                            }}
                        />
                    ))}
                </div>

                {/* Corner marks */}
                {(["top-8 left-8", "top-8 right-8", "bottom-8 left-8", "bottom-8 right-8"] as const).map((pos, i) => (
                    <div key={i} className={`absolute ${pos} w-6 h-6`}>
                        <div className={`absolute ${i < 2 ? "top-0" : "bottom-0"} left-0 right-0 h-px bg-white/20`} />
                        <div className={`absolute ${i % 2 === 0 ? "left-0" : "right-0"} top-0 bottom-0 w-px bg-white/20`} />
                    </div>
                ))}

                {/* Back to home */}
                <Link
                    href="/"
                    className="relative z-10 inline-flex items-center gap-2 text-xs font-mono text-white/30 hover:text-white/70 transition-colors"
                >
                    <ArrowLeft className="h-3 w-3" />
                    RETURN
                </Link>

                {/* Main brand block */}
                <div className="relative z-10">
                    <div className="font-mono text-[11px] text-white/25 uppercase tracking-[0.25em] mb-8">
                        SYSTEM / AUTH / {isSignUp ? "REGISTER" : "ACCESS"}
                    </div>

                    <h1 className="font-mono text-6xl xl:text-7xl font-bold text-white leading-[0.9] tracking-tight mb-6 select-none">
                        <span className="block">P<span className="font-normal opacity-40">rompt</span></span>
                        <span className="block">Flow</span>
                        <span className="block text-white/20">.<span className="text-white">art</span></span>
                    </h1>

                    <p className="font-sans text-sm text-white/40 leading-relaxed max-w-[280px]">
                        Craft, iterate, and track your AI generation concepts using structured expert templates.
                    </p>

                    {/* Animated status indicator */}
                    <div className="mt-12 flex items-center gap-3 font-mono text-[10px] text-white/25">
                        <div className="relative w-1.5 h-1.5">
                            <div className="absolute inset-0 rounded-full bg-emerald-500/60 animate-ping" />
                            <div className="relative rounded-full bg-emerald-500/80 w-full h-full" />
                        </div>
                        ENCRYPTED_SESSION · NODE {String(tick % 16).padStart(2, "0")}
                    </div>
                </div>

                {/* Bottom timestamp */}
                <div className="relative z-10 font-mono text-[10px] text-white/15 uppercase tracking-widest">
                    {new Date().toISOString().slice(0, 19).replace("T", " ")} UTC
                </div>
            </div>

            {/* ── RIGHT FORM PANEL ── */}
            <div className="flex-1 flex items-center justify-center p-8 relative">

                {/* Subtle radial glow */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_40%,rgba(255,255,255,0.03)_0%,transparent_100%)] pointer-events-none" />

                <div className="w-full max-w-[360px] relative z-10">

                    {/* Mobile back link */}
                    <Link href="/" className="lg:hidden inline-flex items-center gap-2 text-xs font-mono text-white/30 hover:text-white/60 transition-colors mb-8">
                        <ArrowLeft className="h-3 w-3" /> RETURN
                    </Link>

                    {/* Mode label */}
                    <div className="flex items-center gap-3 mb-8">
                        <div className="h-px flex-1 bg-white/8" />
                        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/25">
                            {isSignUp ? "NEW OPERATOR" : "OPERATOR ACCESS"}
                        </span>
                        <div className="h-px flex-1 bg-white/8" />
                    </div>

                    {/* Tab switcher */}
                    <div className="flex border border-white/10 rounded-none mb-8 overflow-hidden">
                        {(["SIGN IN", "SIGN UP"] as const).map((label, i) => {
                            const active = i === 0 ? !isSignUp : isSignUp;
                            return (
                                <button
                                    key={label}
                                    type="button"
                                    onClick={() => { setIsSignUp(i === 1); setError(null); setMessage(null); }}
                                    className={`flex-1 py-2.5 font-mono text-[10px] tracking-[0.2em] transition-all ${active ? "bg-white text-black" : "text-white/30 hover:text-white/60"
                                        }`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Error / success messages */}
                    {error && (
                        <div className="mb-5 p-3 border border-red-500/20 bg-red-500/5 flex items-start gap-2 text-red-400/80 text-xs font-mono">
                            <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                            {error}
                        </div>
                    )}
                    {message && (
                        <div className="mb-5 p-3 border border-emerald-500/20 bg-emerald-500/5 flex items-start gap-2 text-emerald-400/80 text-xs font-mono">
                            <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                            {message}
                        </div>
                    )}

                    {/* Google OAuth */}
                    <button
                        onClick={signInWithGoogle}
                        disabled={isLoading}
                        type="button"
                        className="w-full flex items-center justify-center gap-2.5 py-3 border border-white/12 text-white/60 hover:text-white hover:border-white/25 hover:bg-white/4 text-sm font-sans rounded-none transition-all mb-5 focus:outline-none disabled:opacity-40"
                    >
                        <GoogleIcon />
                        Continue with Google
                    </button>

                    {/* Divider */}
                    <div className="relative mb-5">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/8" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-black px-3 font-mono text-[10px] uppercase tracking-[0.25em] text-white/20">OR</span>
                        </div>
                    </div>

                    {/* Email form */}
                    <form onSubmit={handleEmailAuth} className="flex flex-col gap-5">
                        <div>
                            <label className="block font-mono text-[10px] uppercase tracking-[0.2em] text-white/30 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="operator@promptflow.art"
                                autoComplete="username email"
                                required
                                className="w-full bg-white/[0.04] border-b border-white/12 hover:border-white/25 focus:border-white/50 px-1 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none transition-colors font-sans autofill:bg-white/[0.04] [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_rgba(255,255,255,0.06)] [&:-webkit-autofill]:[-webkit-text-fill-color:rgba(255,255,255,0.9)]"
                            />
                        </div>

                        <div>
                            <label className="block font-mono text-[10px] uppercase tracking-[0.2em] text-white/30 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                autoComplete={isSignUp ? "new-password" : "current-password"}
                                required
                                minLength={6}
                                className="w-full bg-white/[0.04] border-b border-white/12 hover:border-white/25 focus:border-white/50 px-1 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none transition-colors font-mono autofill:bg-white/[0.04] [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_rgba(255,255,255,0.06)] [&:-webkit-autofill]:[-webkit-text-fill-color:rgba(255,255,255,0.9)]"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !email || !password}
                            className="mt-2 w-full py-3 bg-white text-black font-mono text-xs uppercase tracking-[0.2em] hover:bg-white/90 transition-all focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            {isLoading ? "PROCESSING..." : isSignUp ? "CREATE ACCOUNT" : "ACCESS SYSTEM"}
                        </button>
                    </form>

                    {/* Switch mode */}
                    <p className="mt-8 text-center font-mono text-[10px] text-white/20">
                        {isSignUp ? "ALREADY REGISTERED?" : "NO ACCOUNT YET?"}{" "}
                        <button
                            type="button"
                            onClick={switchMode}
                            className="text-white/50 hover:text-white transition-colors underline underline-offset-2"
                        >
                            {isSignUp ? "SIGN IN" : "SIGN UP"}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense>
            <AuthForm />
        </Suspense>
    );
}
