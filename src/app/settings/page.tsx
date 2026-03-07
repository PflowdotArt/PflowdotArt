"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLLMSettings } from "@/hooks/use-llm-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    User, Mail, Shield, AlertCircle, CheckCircle2,
    Zap, Save, Cpu, KeyRound, Loader2
} from "lucide-react";

// Pricing data for known Gemini models (per 1M tokens)
const GEMINI_PRICING: Record<string, { in: string; out: string; context: string }> = {
    "models/gemini-2.5-pro-exp-03-25": { in: "$0.00", out: "$0.00", context: "1M" },
    "models/gemini-2.5-flash-preview-04-17": { in: "$0.125", out: "$0.50", context: "1M" },
    "models/gemini-2.0-pro-exp": { in: "$0.00", out: "$0.00", context: "2M" },
    "models/gemini-2.0-flash": { in: "$0.075", out: "$0.30", context: "1M" },
    "models/gemini-2.0-flash-thinking-exp": { in: "$0.00", out: "$0.00", context: "32K" },
    "models/gemini-2.0-flash-lite": { in: "$0.025", out: "$0.10", context: "1M" },
    "models/gemini-1.5-pro": { in: "$1.25", out: "$5.00", context: "2M" },
    "models/gemini-1.5-flash": { in: "$0.075", out: "$0.30", context: "1M" },
    "models/gemini-1.5-flash-8b": { in: "$0.038", out: "$0.15", context: "1M" },
};

type Tab = "account" | "llm";

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<Tab>("account");

    // --- Account tab state ---
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [authProvider, setAuthProvider] = useState<string | null>(null);
    const [isLoadingUser, setIsLoadingUser] = useState(true);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordStatus, setPasswordStatus] = useState<{ type: "success" | "error" | null; message: string }>({ type: null, message: "" });
    const [isUpdating, setIsUpdating] = useState(false);

    // --- LLM tab state ---
    const { settings, saveSettings, isLoaded: llmLoaded } = useLLMSettings();
    const [formData, setFormData] = useState(settings);
    const [isSaved, setIsSaved] = useState(false);
    const [availableGeminiModels, setAvailableGeminiModels] = useState<any[]>([]);
    const [isFetchingModels, setIsFetchingModels] = useState(false);
    const [modelFetchError, setModelFetchError] = useState("");

    // Sync formData whenever LLM settings load from localStorage
    useEffect(() => {
        if (llmLoaded) setFormData(settings);
    }, [llmLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

    // Load user from Supabase
    useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserEmail(user.email ?? null);
                setAuthProvider(user.app_metadata?.provider || "email");
            }
            setIsLoadingUser(false);
        };
        fetchUser();
    }, []);

    // Auto-fetch Gemini models when API key changes and provider is gemini
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
                const res = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models?key=${formData.apiKey}`
                );
                if (!res.ok) throw new Error("Invalid API Key or Network Error");
                const data = await res.json();
                if (data?.models) {
                    const models = data.models.filter(
                        (m: any) =>
                            m.name.startsWith("models/gemini") &&
                            m.supportedGenerationMethods?.includes("generateContent")
                    );
                    setAvailableGeminiModels(models);
                }
            } catch {
                setModelFetchError("Failed to authenticate API Key and list models.");
                setAvailableGeminiModels([]);
            } finally {
                setIsFetchingModels(false);
            }
        }
        const debounce = setTimeout(fetchModels, 800);
        return () => clearTimeout(debounce);
    }, [formData.apiKey, formData.provider]);

    // --- Handlers ---
    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordStatus({ type: null, message: "" });
        if (newPassword.length < 6) {
            setPasswordStatus({ type: "error", message: "Password must be at least 6 characters." });
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordStatus({ type: "error", message: "Passwords do not match." });
            return;
        }
        setIsUpdating(true);
        const supabase = createClient();
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
            setPasswordStatus({ type: "error", message: error.message });
        } else {
            setPasswordStatus({ type: "success", message: "Password updated successfully!" });
            setNewPassword("");
            setConfirmPassword("");
        }
        setIsUpdating(false);
    };

    const handleSaveLLM = () => {
        saveSettings(formData);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    if (isLoadingUser || !llmLoaded) {
        return (
            <div className="flex-1 flex items-center justify-center p-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    return (
        <div className="container max-w-2xl mx-auto md:py-12 py-6 px-4">
            {/* Tab switcher */}
            <div className="flex border-b border-border mb-8">
                {(["account", "llm"] as Tab[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-5 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${activeTab === tab
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        {tab === "llm" ? "LLM Gateway" : "Account"}
                    </button>
                ))}
            </div>

            {/* ── Account Tab ── */}
            {activeTab === "account" && (
                <div className="space-y-6">
                    {/* Profile Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <User className="h-4 w-4 text-primary" /> Account Profile
                            </CardTitle>
                            <CardDescription>Your personal information and authentication settings.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="space-y-1.5">
                                <Label className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
                                    <Mail className="h-3 w-3" /> Email Address
                                </Label>
                                <div className="font-mono text-sm bg-muted/30 p-2 rounded-md border text-foreground/80">
                                    {userEmail || "No email on file"}
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
                                    <Shield className="h-3 w-3" /> Authentication Provider
                                </Label>
                                <div className="text-sm px-3 py-1.5 bg-foreground text-background inline-flex items-center gap-2 rounded font-medium capitalize">
                                    {authProvider === "google" ? "Google OAuth" : "Email & Password"}
                                </div>
                                {authProvider === "google" && (
                                    <p className="text-xs text-muted-foreground italic mt-1">
                                        Your account is managed by Google. Password changes are disabled here.
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Password Card (email users only) */}
                    {authProvider !== "google" && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Shield className="h-4 w-4 text-primary" /> Security Settings
                                </CardTitle>
                                <CardDescription>Update your password to keep your account secure.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-md">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="new-password">New Password</Label>
                                        <Input
                                            id="new-password"
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Enter new password"
                                            disabled={isUpdating}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                                        <Input
                                            id="confirm-password"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Confirm new password"
                                            disabled={isUpdating}
                                        />
                                    </div>
                                    {passwordStatus.type && (
                                        <div
                                            className={`text-sm p-3 rounded-md flex items-start gap-2 ${passwordStatus.type === "error"
                                                    ? "bg-destructive/10 text-destructive"
                                                    : "bg-primary/10 text-primary"
                                                }`}
                                        >
                                            {passwordStatus.type === "error" ? (
                                                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                            ) : (
                                                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                                            )}
                                            <span>{passwordStatus.message}</span>
                                        </div>
                                    )}
                                    <Button type="submit" disabled={isUpdating || !newPassword || !confirmPassword}>
                                        {isUpdating ? "Updating Password..." : "Update Password"}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* ── LLM Gateway Tab ── */}
            {activeTab === "llm" && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Zap className="h-4 w-4 text-primary" /> LLM Provider (BYOK)
                        </CardTitle>
                        <CardDescription>
                            Bring Your Own Key. Your API keys are stored locally in browser storage and never sent to our servers.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Provider selector */}
                        <div className="space-y-2">
                            <Label htmlFor="provider">Provider</Label>
                            <select
                                id="provider"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={formData.provider}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        provider: e.target.value as any,
                                        model: e.target.value === "gemini" ? "gemini-2.0-flash" : "gpt-4-turbo-preview",
                                    })
                                }
                            >
                                <option value="openai">OpenAI</option>
                                <option value="anthropic">Anthropic</option>
                                <option value="gemini">Google Gemini</option>
                                <option value="custom">Custom (OpenAI Compatible)</option>
                            </select>
                        </div>

                        {/* API Key */}
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

                        {/* Model selection */}
                        <div className="space-y-3">
                            <Label>Model</Label>

                            {formData.provider === "gemini" ? (
                                <div className="space-y-3">
                                    {/* Gemini status states */}
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
                                            Enter a valid Gemini API Key above to browse models.
                                        </div>
                                    )}

                                    {/* Gemini model cards grid */}
                                    {availableGeminiModels.length > 0 && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
                                            {availableGeminiModels.map((gem) => {
                                                const pricing = GEMINI_PRICING[gem.name] || { in: "?", out: "?", context: "?" };
                                                const isSelected = formData.model === gem.name.replace("models/", "");
                                                return (
                                                    <button
                                                        key={gem.name}
                                                        onClick={() => setFormData({ ...formData, model: gem.name.replace("models/", "") })}
                                                        className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex flex-col gap-2 ${isSelected
                                                                ? "border-primary bg-primary/10 ring-1 ring-primary/50"
                                                                : "border-border bg-background hover:bg-muted/50 hover:border-primary/40"
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between w-full">
                                                            <span className={`font-semibold text-sm ${isSelected ? "text-primary" : "text-foreground"}`}>
                                                                {gem.displayName}
                                                            </span>
                                                            <span className="text-[10px] font-mono bg-background px-2 py-0.5 rounded text-muted-foreground border border-border shadow-sm ml-1 shrink-0">
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
                                                                Ctx: {pricing.context} | Limit: {Math.round((gem.outputTokenLimit ?? 0) / 1000)}k
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Manual override */}
                                    <div className="pt-2 border-t border-border/30">
                                        <Label htmlFor="model-manual" className="text-xs text-muted-foreground mb-1.5 block">
                                            Fallback Manual Override
                                        </Label>
                                        <Input
                                            id="model-manual"
                                            placeholder="e.g. gemini-2.0-flash"
                                            value={formData.model}
                                            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <Input
                                    id="model"
                                    placeholder="e.g. gpt-4o"
                                    value={formData.model}
                                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                />
                            )}
                        </div>

                        {/* Custom Base URL */}
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

                        <Button onClick={handleSaveLLM} className="w-full gap-2">
                            <Save className="h-4 w-4" />
                            {isSaved ? "Saved!" : "Save Settings"}
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
