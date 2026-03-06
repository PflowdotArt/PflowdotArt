# PromptFlow (PromptMaster) - v0.2

PromptFlow is an advanced, AI-powered "Prompt Engineering Workspace & Gallery" built to assist creators using latent diffusion models (like Midjourney, Flux, ComfyUI, DALL-E) and LLMs. 

Instead of typing unstructured prompts, PromptFlow acts as your **Creative Director**, taking your raw ideas and structuring them into sophisticated, highly-detailed prompts customized for specific creative mediums.

## v0.2 Major Features

### 1. The Multi-Modal Vision Workspace
- **Image References**: Attach up to 5 visual references via drag-and-drop or the localized Paperclip uploader.
- **@Mentions**: Seamlessly integrate explicit image directives right into the text stream by typing `@Image 1`. 
- **Vision Payloads**: PromptMaster automatically synthesizes the textual narrative and base64 binaries, dispatching them smoothly to Gemini's multi-part vision endpoints.

### 2. The Mode Architect (AI Metaprompt Engine)
PromptFlow is no longer limited to hardcoded prompts. It features a powerful **Mode Architect** that uses natural language to generate custom AI Directors.
- **Dynamic AI Modes**: Create an infinite library of localized `PromptModeDef` instructions.
- **Auto-Structured DNA**: Type "Neon Cyberpunk Sprites" and the architect natively writes the system prompt.
- **The Floating Editor (V10)**: A massive visual, dual-scroll split editor (Persona/Law on the left, JSON Console on the right) allows you to meticulously tweak the underlying bones of any custom mode. Allows injection of default structural image references.

### 3. Masonry Gallery 2.0
- **Math-Chunked Masonry Algorithm**: Instead of tearing flex-boxes with CSS `columns`, the Gallery dynamically maps your viewport width down into N logical columns (using a `useResponsiveColumns` React hook) and distributes arrays cleanly, achieving pixel-perfect deterministic masonry layouts.
- **Dynamic Typographic Clamping**: The Gallery intelligently reads string density. CJK scripts max out at 2 lines, English expands to 3, and raw CSS `-webkit-line-clamp` calculates all genuine ellipses to prevent UI noise.

### 4. Intelligent Split-Pane UI & Local DB
- **Param Inspector**: The AI extracts structural parameters (e.g., Lighting Style, Camera Lens, Typography) into discrete, clickable tags on the right panel.
- **Local Gallery System (IndexedDB/Dexie)**: All project iterations, prompts, and multi-modal attachments are stored invisibly inside your browser using IndexedDB. No cloud configurations necessary. Fully capable of infinite internal migrations (V6 Database Resurrecter).

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS + Shadcn UI
- **Icons**: Lucide React
- **Icons & Animations**: Framer Motion
- **State Management**: Zustand
- **Local Database**: Dexie.js (IndexedDB wrapper)

## Getting Started

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
4. Go to **Settings** (top right), select your LLM Provider (e.g., Gemini), input your API Key, and save.
5. Create a **New Prompt** and start exploring!
