# PromptFlow (PromptMaster) - v0.3 Architecture

## 1. Requirements & Core Entities
PromptFlow is an advanced AI Prompt Engineering Workspace designed to structure latent diffusion model prompts (Midjourney, Flux, ComfyUI, DALL-E) using specialized AI directorial modes. As of v0.3, the platform is fully cloud-authenticated via Supabase with a polished public-facing identity.

### Core Data Models
#### Cloud (Supabase)
- **Auth**: User accounts via Supabase Auth (Google OAuth + Email/Password).
- **Storage**: `prompt-images` bucket in Supabase Storage. Image paths follow `{user_id}/{image_id}` convention.

#### Local (IndexedDB via Dexie.js)
- **Gallery Session (`Project`)**: A creative exploration session representing a core idea, shown in the gallery.
- **Iteration Node (`Node/Step`)**: Each specific generation within a session.
  - **Input Idea**: The user's raw conversational request.
  - **Generated Prompt (`structuredPrompt`)**: Strict JSON object parsed into 4–6 components depending on the mode.
  - **Extracted Params**: Key/Value UI tags natively parsed from the prompt.
  - **Attached Media (`referenceImageIds`)**: UUIDs pointing to Supabase Storage objects (up to 5 per node).

---

## 2. Infrastructure & Technical Stack

### 2.1 Front-End Presentation Layer
- **Framework**: React.js / Next.js 16 (App Router, Turbopack).
- **Styling**: TailwindCSS + Shadcn UI. Design language: minimalist retro-futuristic (Space Grotesk / Space Mono typography, near-black backgrounds, razor-thin borders).
- **Core Views**:

| Route | Description |
|---|---|
| `/` | Public landing page — animated 16×16 multilingual prompt text matrix, no header |
| `/login` | Split-screen retro-futuristic auth page (Sign In + Sign Up tabs), no header |
| `/gallery` | Masonry gallery of sessions (auth-protected) |
| `/prompt/[id]` | Split-pane prompt workspace (auth-protected) |
| `/modes` | AI Mode manager (auth-protected) |
| `/settings` | Tabbed settings: Account + LLM Gateway (auth-protected) |
| `/rescue` | Legacy data migration wizard |

### 2.2 Authentication & Routing
- **Supabase Auth**: Email/Password and Google OAuth providers.
- **Next.js Middleware** (`src/middleware.ts` + `src/lib/supabase/middleware.ts`):
  - Unauthenticated requests to protected routes → redirected to `/login`.
  - Authenticated requests to `/login` → redirected to `/gallery`.
- **`ConditionalHeader`** (`src/components/layout/conditional-header.tsx`): Client component that suppresses the topbar on `/` and `/login` using `usePathname()`.
- **`LogoutButton`**: Signs out via Supabase, then redirects to `/` (landing page).

### 2.3 Business Logic & LLM Engine
- **State Management**: Zustand handles the active workspace iteration state.
- **The AI Director Engine** (`lib/llm-client.ts`):
  - Dynamically generated `PromptModeDef` system prompts (Role/Law/JSON Template).
  - Auto-injects `@Image N` anchors into multi-modal payloads.
  - Aggregates base64 image data into `@google/genai` native payloads.
- **Metadata Lifecycle**: 100% client-side. Dexie V6 migration scripts retroactively fix legacy payload trees.

### 2.4 BYOK (Bring Your Own Key) Strategy
- API Keys (OpenAI, Gemini, Anthropic) held in browser `localStorage`, never sent to server.
- **Gemini Model Discovery**: Live `GET /v1beta/models?key=...` call populates interactive model selection cards in Settings, showing cost/context metrics per model.

### 2.5 Landing Page Animation Engine
- **256 Prompts** across 10 languages, Fisher-Yates shuffled client-side only (post-mount `useEffect`) to avoid SSR hydration mismatch.
- **Single RAF loop** (`requestAnimationFrame`) drives all 256 cells at ~20fps. Each cell independently advances through `typing → pausing → erasing` phases with staggered timing.
- **1px cursor** rendered as a `<span>` with inline `width: 1px; height: 0.85em` to avoid the visual weight of block-cursor characters.

---

## 3. Storage Layer

| Store | Used For | Notes |
|---|---|---|
| Supabase Storage (`prompt-images`) | User-uploaded reference images | Path: `{user_id}/{image_id}` |
| Dexie.js (IndexedDB) | Sessions, iterations, modes, image metadata | V6 schema; blob data migrated to Supabase |
| `localStorage` | LLM API keys, provider preferences | BYOK; never leaves browser |

---

## 4. Key File Map

| File | Role |
|---|---|
| `src/app/page.tsx` | Animated landing page |
| `src/app/login/page.tsx` | Auth page (Sign In / Sign Up) |
| `src/app/settings/page.tsx` | Tabbed settings (Account + LLM Gateway) |
| `src/app/rescue/page.tsx` | Legacy IndexedDB → Supabase migration tool |
| `src/app/gallery/page.tsx` | Masonry gallery |
| `src/app/prompt/[id]/page.tsx` | Prompt workspace |
| `src/components/layout/conditional-header.tsx` | Suppresses header on `/` and `/login` |
| `src/components/logout-button.tsx` | Signs out + redirects to `/` |
| `src/lib/supabase/middleware.ts` | Auth routing walls |
| `src/hooks/use-llm-settings.ts` | localStorage persistence for LLM config |
| `src/lib/llm-client.ts` | Gemini/OpenAI/Anthropic abstraction |
| `src/lib/db.ts` | Dexie schema V6 |

---

## 5. Roadmap (Phase 10+)
- **Direct Image Generation**: Integrate Replicate / ComfyUI webhooks to render prompts into actual diffusion images within the workspace.
- **Full-Text Search**: Token-filter index across `userNotes` and JSON parameters for querying creative history.
- **Cloud Session Sync**: Migrate Dexie sessions/iterations to Supabase PostgreSQL for multi-device access.
- **Public Prompt Gallery**: Opt-in sharing of sessions via short link with read-only viewer.
