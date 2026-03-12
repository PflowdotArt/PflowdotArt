# PromptFlow (PromptMaster) - v0.3

PromptFlow is an advanced, AI-powered **Prompt Engineering Workspace & Gallery** built to assist creators using latent diffusion models (Midjourney, Flux, ComfyUI, DALL-E) and LLMs.

Instead of typing unstructured prompts, PromptFlow acts as your **Creative Director** — taking raw ideas and structuring them into sophisticated, highly-detailed prompts customized for specific creative mediums.

As of v0.3, PromptFlow is a fully cloud-authenticated platform with a polished public identity, powered by Supabase.

---

## ✨ v0.3 Highlights

### 🌐 Animated Landing Page
A cinematic public homepage with a living 16×16 grid of 256 AI prompts in 10 languages, each cell independently running a character-by-character typewriter animation. A radial gradient vignette frames the centered brand hero with Sign In / Sign Up entry points. No navigation header — fully public surface.

### 🔐 Retro-Futuristic Auth Pages
Sign In and Sign Up consolidated into a single split-screen page (`/login`):
- **Left**: Brand panel with grid lines, diagonal accents, corner marks, and an animated encrypted-session status ticker.
- **Right**: Minimal mono form — tab switcher, bottom-border inputs, white CTA button.
- Google OAuth and email/password both supported.
- Header-free: `ConditionalHeader` suppresses the topbar on `/` and `/login`.

### ⚙️ Tabbed Settings Page
- **Account Tab**: Email, auth provider badge, and password reset (email users only).
- **LLM Gateway Tab**: Provider selector (OpenAI / Anthropic / Gemini / Custom), API key, and model config.
- **Gemini Model Cards**: Live API discovery renders interactive cards per model showing version, cost/1M tokens (in/out), and context window. Click to select. Manual override input below.

### 🗄️ Cloud Storage (Supabase)
- Reference images uploaded to and served from Supabase Storage (`prompt-images` bucket).
- **Data Rescue Tool** (`/rescue`): Bulk-migrates legacy IndexedDB image blobs to Supabase Storage for users upgrading from v0.1/v0.2.

### 🧠 Mode Architect Sync
- **Strict JSON Template Enforcement**: The auto-generated prompt modes now strictly sync their underlying JSON data keys to the aesthetic titles of their rules (e.g. `1. The Noble Subject` strictly mounts to `"the_noble_subject"`).
- **Dynamic Defaulting**: Workspaces auto-select your newest custom mode first.
- **UI Polish**: Multi-line textarea architect prompt input with unclipped `@Image` dropdowns.

---

## Previous Features (v0.0–v0.2)

### The Multi-Modal Vision Workspace
- Attach up to 5 visual references via drag-and-drop or the Paperclip uploader.
- Type `@Image 1` to inject image directives directly into the prompt stream.
- Auto-synthesizes base64 binaries into Gemini multi-part vision payloads.

### The Mode Architect (AI Metaprompt Engine)
- Create infinite custom AI Director modes with a single natural-language sentence.
- The **Floating Mode Editor (V10)**: dual-scroll split editor (Persona/Law + JSON Console).
- Inject default `referenceImageIds` into custom mode DNA.

### Masonry Gallery 2.0
- Deterministic math-chunked masonry (no CSS `columns`).
- Language-aware line clamping: CJK scripts → 2 lines, English → 3 lines.

### Split-Pane Prompt Workspace
- **Left**: Chat timeline + Active Mode Selector + `@Image` mention console.
- **Center**: `ScriptPanel` — structured JSON prompt breakdown per mode.
- **Right**: `ParamInspector` — AI-extracted scene parameters as clickable tags.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Styling | Tailwind CSS + Shadcn UI |
| Typography | Space Grotesk + Space Mono (Google Fonts) |
| Icons | Lucide React |
| State | Zustand |
| Local DB | Dexie.js (IndexedDB) |
| Cloud Auth | Supabase Auth (Google OAuth + Email) |
| Cloud Storage | Supabase Storage |
| LLM | Google Gemini (BYOK) / OpenAI / Anthropic |

---

## Getting Started

```bash
# 1. Clone and install
npm install

# 2. Configure environment
cp .env.example .env.local
# Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

# 3. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll land on the public homepage.

1. Click **Sign Up** to create an account.
2. After login, go to **Settings** → **LLM Gateway** tab.
3. Select your provider (e.g., Gemini), paste your API key, and pick a model from the cards.
4. Open **Gallery** → **New Session** to start crafting prompts!

> **BYOK**: Your API keys are stored only in your browser's `localStorage` and are never sent to any server other than the LLM provider directly.
