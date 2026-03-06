# PromptFlow (PromptMaster) - v0.2 Architecture

## 1. Requirements & Core Entities
PromptFlow is an advanced AI Prompt Engineering Workspace designed to structure latent diffusion model prompts (like Midjourney V6, Flux, and ComfyUI) using specialized AI directorial modes. 

### Core Data Models (IndexedDB via Dexie.js)
* **Gallery Session (`Project`)**: A creative exploration session representing a core idea, shown in the home gallery.
* **Iteration Node (`Node/Step`)**: Each specific generation within a session.
  * **Input Idea**: The user's raw conversational request (e.g., "Make it cyberpunk").
  * **Generated Prompt (`structuredPrompt`)**: Instead of raw text strings, the AI generates a strict JSON object parsing the script into 4/5/6 components (depending on the mode).
  * **Extracted Params**: Key/Value UI tags natively parsed from the prompt to allow manual tweaking (e.g., `camera_lens`, `lighting_style`, `art_medium`).
  * **Attached Media (`referenceImageIds`)**: Base64 encoded blobs connected intimately up to 5 per node.

---

## 2. Infrastructure & Technical Stack

### 2.1 Front-End Presentation Layer
* **Framework**: React.js / Next.js 16 (App Router).
* **Styling**: TailwindCSS heavily prioritized for structural layout combined with minimalist, terminal-inspired aesthetics (Space Grotesk typography) and dark mode.
* **Core Views**:
  1. **Masonry Gallery Home 2.0**: Cascading grid layout powered by a strict custom mathematical deterministic array-chunking algorithm rather than raw CSS columns. Employs mathematically absolute container boundaries `aspect-[3/4]` for pure text fallbacks.
  2. **Prompt Workspace (Split-Pane)**: 
     * **Left Pane**: Chat timeline, Active Mode Selector, and universal `@Image` mention text console.
     * **Central Pane**: `ScriptPanel`, formatting the strict JSON prompt breakdown dynamically based on the selected mode's custom structural keys.
     * **Right Pane**: `ParamInspector`, rendering dynamically generated input fields for extracted scene values.
  3. **Floating Mode Manager** (`/modes`): Management interface for viewing, editing, and creating new `PromptModeDef`s utilizing a massive overlaid multi-pane `Dialog` component.

### 2.2 Business Logic & LLM Engine
* **State Management**: Zustand handles the active workspace iteration and handles jumping between different branch points in history.
* **The AI Director Engine (`llm-client.ts`)**:
  * Employs dynamically generated `PromptModeDef` system prompts spanning `Role/Law/JSON Template` columns from IndexedDB.
  * Auto-injects `@Image N` anchors deep into the payload format immediately preceding the `image_url` data buffer ensuring perfect multi-modal cross-attention.
  * Seamlessly aggregates base64 image data structures into native `@google/genai` payloads payload definitions.
* **Metadata Lifecycle**: 100% Client-side. Uses aggressive Dexie V-Bump migration scripts (`v6`) to retroactively sweep and correct UI errors deep within the legacy payload trees.

### 2.3 Bring Your Own Key (BYOK) Strategy
To keep infrastructure light and privacy high during MVP stages, back-end LLM processing is fully decentralized:
* API Keys (OpenAI, Gemini, Anthropic) are held in browser `localStorage`.
* **Google Gemini Integration**: Implements a dedicated dynamic model handshake auto-fetching real-time capability metrics, context limits, and cost maps across `gemini-2.5-flash` or `gemini-2.5-pro`.

## 3. Storage Layer
Currently entirely client-side for absolute privacy and instantaneous data speed.
* **Dexie.js (IndexedDB)** is the core database natively housing the complex iterative nodes.
* Images are stored as `Blob` data fully within the user's browser storage. 
* Implements robust cursor pagination and infinite lazy-loading algorithms to prevent massive local DBs from crushing browser thread limits.

---

## 4. Next Phase Roadmap (Phase 9+)
* **Cloud Sync (Supabase/PostgreSQL)**: Transition IndexedDB syncing to cloud database for multi-device access.
* **Direct Image Generation APIs**: Integrate Replicate or ComfyUI workflows natively to let users compile the raw prompts immediately inside the IDE into actual diffusion renderings over webhooks.
* **Full-text Local Search**: Execute high speed token-filters indexing the `userNotes` and JSON parameters so creators can query raw inspiration from their history.
