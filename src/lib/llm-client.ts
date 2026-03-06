import { LLMSettings } from "@/hooks/use-llm-settings";

export type LLMMessageContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string | LLMMessageContentPart[];
}

// Modes are now dynamically managed in the database (PromptModeDef)

async function fetchWithRetry(url: string, options: RequestInit, retries = 2): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.status === 503 || response.status === 502 || response.status === 429) {
        // wait before retry (exponential backoff)
        console.warn(`LLM API returned ${response.status}. Retrying in ${1000 * (i + 1)}ms...`);
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        continue;
      }
      return response;
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  return fetch(url, options); // final attempt
}

export async function generatePrompt(messages: LLMMessage[], settings: LLMSettings, systemPrompt: string) {
  if (!settings.apiKey) {
    throw new Error("API Key is missing. Please configure it in settings.");
  }

  const isAnthropic = settings.provider === "anthropic";
  if (isAnthropic) {
    throw new Error("Anthropic direct browser requests are restricted by CORS. Please use OpenAI or a compatible custom endpoint.");
  }

  const endpoint = settings.provider === "gemini"
    ? "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
    : (settings.provider === "custom" && settings.baseUrl
      ? `${settings.baseUrl.replace(/\/$/, '')}/chat/completions`
      : "https://api.openai.com/v1/chat/completions");

  try {
    const response = await fetchWithRetry(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model: settings.model,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      if (response.status === 503 || response.status === 502) {
        throw new Error(`Provider API is temporarily unavailable (${response.status}). Please try again in a few moments.`);
      }
      throw new Error(err.error?.message || `API Error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    return JSON.parse(content);
  } catch (err: any) {
    console.error("LLM Generation Error:", err);
    throw new Error(err.message || "Failed to generate prompt.");
  }
}

const MODE_ARCHITECT_METAPROMPT = `
You are an expert AI Prompt Architect. Your job is to design a new Prompt Generation Mode for a multi-modal latent diffusion workspace.
The user will describe the medium or aesthetic they want to target.
You must return PURE valid JSON outlining the mode's metadata and its intricate instructions (System Prompt).

# DESIGNING THE SYSTEM PROMPT
The 'systemPrompt' you write MUST follow this advanced pattern to ensure deterministic JSON outputs from future AIs:
1. Define the AI's role (e.g., "You are an elite AI Director...").
2. Define "THE X-SENTENCE LAW" for the requested medium (e.g., 1. Medium Hook, 2. Details, 3. Lighting, etc.). Strict 4 to 6 sentences.
3. Define the strict JSON Output Format the AI must use. It MUST include "thoughts", "final_paragraph", "components" (breaking down the sentences into DESCRIPTIVE keys like "core_subject", "environment", "camera_lens", "typography" - NEVER use generic keys like "sentence_1" or "sentence_2"), and "extracted_ui_params" (3-5 key parameters users can tweak, like 'color_palette', 'camera_lens').
4. Include CRITICAL RULES requiring the final paragraph to match the user's language while keys stay English.

# YOUR JSON OUTPUT FORMAT
{
  "name": "Short, catchy name with an emoji prefix (e.g., '👾 Pixel Art', '📝 Storyboard')",
  "description": "Short 2-4 word description (e.g., 'Retro & Rules', 'Scenes & Motion')",
  "role": "The Role/Persona definition string you designed.",
  "law": "The N-Sentence Law definition string you designed.",
  "jsonTemplate": "The exact JSON output format string you designed, including the # JSON OUTPUT FORMAT header and # CRITICAL RULES."
}
`;

export async function generateNewModeArchitect(concept: string, settings: LLMSettings) {
  if (!settings.apiKey) {
    throw new Error("API Key is missing. Please configure it in settings.");
  }

  const endpoint = settings.provider === "gemini"
    ? "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
    : (settings.provider === "custom" && settings.baseUrl
      ? `${settings.baseUrl.replace(/\/$/, '')}/chat/completions`
      : "https://api.openai.com/v1/chat/completions");

  try {
    const response = await fetchWithRetry(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model: settings.model,
        messages: [
          { role: "system", content: MODE_ARCHITECT_METAPROMPT },
          { role: "user", content: `Design a new generation mode optimized for this concept: ${concept}` }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      if (response.status === 503 || response.status === 502 || response.status === 429) {
        throw new Error(`Provider API is temporarily unavailable (${response.status}). Please try again in a few moments.`);
      }
      throw new Error(err.error?.message || `API Error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    return JSON.parse(content) as { name: string; description: string; role: string; law: string; jsonTemplate: string };
  } catch (err: any) {
    console.error("LLM Generation Error:", err);
    throw new Error(err.message || "Failed to draft new mode.");
  }
}
