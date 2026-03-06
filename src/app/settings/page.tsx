"use client";

import { useLLMSettings, LLMSettings } from "@/hooks/use-llm-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { ArrowLeft, Save, Loader2, KeyRound, Bot, Zap, Cpu, CircleDollarSign } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Hardcoded pricing/capabilities for known popular Gemini models (per 1M tokens)
const GEMINI_PRICING: Record<string, { in: string; out: string; context: string }> = {
    "models/gemini-2.5-flash": { in: "$0.07", out: "$0.30", context: "1M+" },
    "models/gemini-2.5-pro": { in: "$1.25", out: "$5.00", context: "2M" },
    "models/gemini-2.0-flash": { in: "$0.10", out: "$0.40", context: "1M+" },
    "models/gemini-2.0-flash-lite": { in: "$0.07", out: "$0.30", context: "1M+" },
    "models/gemini-2.0-pro": { in: "$1.25", out: "$5.00", context: "2M" },
    "models/gemini-1.5-flash": { in: "$0.07", out: "$0.30", context: "1M" },
    "models/gemini-1.5-pro": { in: "$1.25", out: "$5.00", context: "2M" },
};

interface GeminiModel {
    name: string;
    version: string;
    displayName: string;
    description: string;
    inputTokenLimit: number;
    outputTokenLimit: number;
    supportedGenerationMethods: string[];
}

export default function SettingsPage() {
    const { settings, saveSettings, isLoaded } = useLLMSettings();
    const [formData, setFormData] = useState<LLMSettings>(settings);
    const [isSaved, setIsSaved] = useState(false);

    // Gemini Dynamic Models State
    const [availableGeminiModels, setAvailableGeminiModels] = useState<GeminiModel[]>([]);
    const [isFetchingModels, setIsFetchingModels] = useState(false);
    const [modelFetchError, setModelFetchError] = useState("");

    const router = useRouter();

    useEffect(() => {
        if (isLoaded) setFormData(settings);
    }, [settings, isLoaded]);

    // Auto-fetch Models when provider is Gemini and API Key looks somewhat valid
    useEffect(() => {
        async function fetchModels() {
            if (formData.provider !== "gemini" || formData.apiKey.length < 20) {
                setAvailableGeminiModels([]);
                setModelFetchError("");
                return;
            }
            setIsFetchingModels(true);
            setModelFetchError("");
            try {
                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${formData.apiKey}`);
                if (!res.ok) throw new Error("Invalid API Key or Network Error");

                const data = await res.json();
                if (data && data.models) {
                    // Filter down to chat-capable gemini models
                    const models = data.models.filter((m: any) =>
                        m.name.startsWith("models/gemini") &&
                        m.supportedGenerationMethods.includes("generateContent")
                    );
                    setAvailableGeminiModels(models);
                }
            } catch (err: any) {
                setModelFetchError("Failed to authenticate API Key and list models.");
                setAvailableGeminiModels([]);
            } finally {
                setIsFetchingModels(false);
            }
        }

        const debounce = setTimeout(() => {
            fetchModels();
        }, 800);
        return () => clearTimeout(debounce);
    }, [formData.apiKey, formData.provider]);

    const handleSave = () => {
        saveSettings(formData);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    if (!isLoaded) return null;

    return (
        <div className="container max-w-2xl mx-auto px-4 py-8">
            <div className="mb-8">
                <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Configure PromptFlow preferences and AI integrations.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>LLM Provider (BYOK)</CardTitle>
                    <CardDescription>
                        Bring Your Own Key. Your keys are stored locally in your browser and are never sent to our servers.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="provider">Provider</Label>
                        <select
                            id="provider"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={formData.provider}
                            onChange={(e) => setFormData({ ...formData, provider: e.target.value as any, model: e.target.value === 'gemini' ? 'gemini-2.5-flash' : 'gpt-4-turbo-preview' })}
                        >
                            <option value="openai">OpenAI</option>
                            <option value="anthropic">Anthropic</option>
                            <option value="gemini">Google Gemini</option>
                            <option value="custom">Custom (OpenAI Compatible API)</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="apiKey">API Key</Label>
                        <Input
                            id="apiKey"
                            type="password"
                            placeholder="sk-..."
                            value={formData.apiKey}
                            onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                        />
                    </div>

                    <div className="space-y-4">
                        <Label htmlFor="model">Model Name</Label>

                        {formData.provider === "gemini" ? (
                            <div className="space-y-3">
                                {!availableGeminiModels.length && isFetchingModels && (
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Authenticating key and discovering available models...
                                    </div>
                                )}
                                {!availableGeminiModels.length && modelFetchError && (
                                    <div className="text-sm text-red-500/80 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                                        {modelFetchError}
                                    </div>
                                )}
                                {!availableGeminiModels.length && !isFetchingModels && formData.apiKey.length < 20 && (
                                    <div className="text-sm text-muted-foreground flex items-center p-3 bg-muted/50 rounded-md border border-border">
                                        <KeyRound className="w-4 h-4 mr-2" />
                                        Enter a valid Gemini API Key to browse capabilities and models.
                                    </div>
                                )}

                                {availableGeminiModels.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto p-1 pr-2 custom-scrollbar">
                                        {availableGeminiModels.map((gem) => {
                                            const pricing = GEMINI_PRICING[gem.name] || { in: "?", out: "?", context: "?" };
                                            // Handle cases where the UI value strips "models/" 
                                            const isSelected = formData.model === gem.name.replace("models/", "");

                                            return (
                                                <button
                                                    key={gem.name}
                                                    onClick={() => setFormData({ ...formData, model: gem.name.replace("models/", "") })}
                                                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex flex-col gap-2 ${isSelected
                                                            ? "border-primary bg-primary/10 shadow-[inset_0_0_15px_rgba(var(--color-primary),0.1)] ring-1 ring-primary/50"
                                                            : "border-border bg-background hover:bg-muted/50 hover:border-primary/40"
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between w-full">
                                                        <span className={`font-semibold text-sm ${isSelected ? "text-primary" : "text-foreground"}`}>
                                                            {gem.displayName}
                                                        </span>
                                                        <span className="text-[10px] font-mono bg-background px-2 mx-1 py-0.5 rounded text-muted-foreground border border-border shadow-sm">
                                                            {gem.version}
                                                        </span>
                                                    </div>

                                                    <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 min-h-[33px]">
                                                        {gem.description}
                                                    </p>

                                                    <div className="border-t border-border/50 pt-2 mt-1 flex flex-wrap gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                                                        <div className="flex items-center" title="Input Cost per 1M Tokens">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50 mr-1" />
                                                            In: {pricing.in}
                                                        </div>
                                                        <div className="flex items-center" title="Output Cost per 1M Tokens">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500/50 mr-1" />
                                                            Out: {pricing.out}
                                                        </div>
                                                        <div className="flex items-center w-full mt-0.5">
                                                            <Cpu className="w-3 h-3 mr-1 opacity-70" />
                                                            Ctx: {pricing.context.padEnd(2, " ")} | Limit: {Math.round(gem.outputTokenLimit / 1000)}k
                                                        </div>
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}

                                <div className="mt-2 pt-2 border-t border-border/30">
                                    <Label htmlFor="model-manual" className="block text-xs text-muted-foreground mb-2">Fallback Manual Override</Label>
                                    <Input
                                        id="model-manual"
                                        placeholder="e.g. gemini-2.5-flash"
                                        value={formData.model}
                                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                        className="h-8 text-sm placeholder:opacity-50"
                                    />
                                </div>
                            </div>
                        ) : (
                            <Input
                                id="model"
                                placeholder="e.g. gpt-4-turbo-preview"
                                value={formData.model}
                                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                            />
                        )}
                    </div>

                    {formData.provider === "custom" && (
                        <div className="space-y-2">
                            <Label htmlFor="baseUrl">Base URL</Label>
                            <Input
                                id="baseUrl"
                                placeholder="https://api.openai.com/v1"
                                value={formData.baseUrl || ""}
                                onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                            />
                        </div>
                    )}

                    <Button onClick={handleSave} className="w-full">
                        <Save className="h-4 w-4 mr-2" />
                        {isSaved ? "Saved!" : "Save Settings"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
