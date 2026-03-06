"use client";

import { useState, useEffect } from "react";

export interface LLMSettings {
    provider: "openai" | "anthropic" | "custom" | "gemini";
    apiKey: string;
    model: string;
    baseUrl?: string;
}

const defaultSettings: LLMSettings = {
    provider: "openai",
    apiKey: "",
    model: "gpt-4-turbo-preview",
};

export function useLLMSettings() {
    const [settings, setSettings] = useState<LLMSettings>(defaultSettings);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("promptflow_llm_settings");
        if (saved) {
            try {
                setSettings({ ...defaultSettings, ...JSON.parse(saved) });
            } catch (e) {
                console.error("Failed to parse LLM settings", e);
            }
        }
        setIsLoaded(true);
    }, []);

    const saveSettings = (newSettings: LLMSettings) => {
        setSettings(newSettings);
        localStorage.setItem("promptflow_llm_settings", JSON.stringify(newSettings));
    };

    return { settings, saveSettings, isLoaded };
}
