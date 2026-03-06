import Link from "next/link";
import { Sparkles, ArrowRight, Layers, LayoutTemplate, Workflow } from "lucide-react";

export default function LandingPage() {
    return (
        <div className="flex flex-col min-h-[calc(100vh-3.5rem)] bg-zinc-950 text-white selection:bg-primary/30 font-sans">
            {/* Hero Section */}
            <section className="relative px-6 py-24 flex-1 flex flex-col items-center justify-center text-center overflow-hidden">
                {/* Background glow and grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full pointer-events-none opacity-50" />

                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono uppercase tracking-widest text-zinc-400 mb-8 z-10 shadow-lg">
                    <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                    <span>v0.3 Cloud Sync Edition</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 z-10 max-w-4xl leading-tight text-white">
                    The Workspace for <br className="hidden md:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-400 to-primary/80 drop-shadow-sm">
                        AI Prompt Engineering
                    </span>
                </h1>

                <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mb-12 z-10 font-sans leading-relaxed">
                    Transform your raw ideas into masterfully structured prompts for Midjourney, ComfyUI, and Flux. Organize your visual iterations in a private, deterministic gallery.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 z-10">
                    <Link
                        href="/login"
                        className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-medium rounded-lg overflow-hidden transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.2)]"
                    >
                        <span className="relative z-10">Start Creating Free</span>
                        <ArrowRight className="relative z-10 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
                    </Link>
                    <Link
                        href="/gallery"
                        className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-zinc-900/80 backdrop-blur-sm text-zinc-300 font-medium rounded-lg border border-zinc-800 hover:bg-zinc-800 hover:text-white transition-all shadow-lg"
                    >
                        <Layers className="h-4 w-4" />
                        View Demo Gallery
                    </Link>
                </div>
            </section>

            {/* Feature Section */}
            <section className="px-6 py-24 bg-zinc-950 relative z-10 border-t border-zinc-900/50">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
                        <FeatureCard
                            icon={<Layers className="h-6 w-6 text-primary" />}
                            title="Multi-Modal Vision"
                            description="Drop up to 5 reference images into your prompt. Type @Image to strictly direct the AI's cross-attention exactly where you want it."
                        />
                        <FeatureCard
                            icon={<LayoutTemplate className="h-6 w-6 text-indigo-400" />}
                            title="Mode Architect"
                            description="Build infinite custom AI Directors. Define its personality, structural constraints, and complex JSON schemas using natural language."
                        />
                        <FeatureCard
                            icon={<Workflow className="h-6 w-6 text-emerald-400" />}
                            title="Deterministic Canvas"
                            description="Review your creations in a flawless Masonry Gallery powered by a mathematical array-chunking algorithm—no CSS column tearing."
                        />
                    </div>
                </div>
            </section>
        </div>
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="group flex flex-col p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800/50 hover:bg-zinc-900 hover:border-zinc-700/50 transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-xl">
            <div className="h-14 w-14 rounded-xl bg-black border border-zinc-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-3 text-white tracking-tight">{title}</h3>
            <p className="text-zinc-500 leading-relaxed font-sans">{description}</p>
        </div>
    );
}
