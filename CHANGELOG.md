# PromptFlow - Changelog

All notable changes to this project will be documented in this file.
This log is intended for users and follows major feature releases and milestones, rather than granular Git commits.

---

## [v0.3] - The Cloud Identity & Public Surface Update
**Date:** March 2026

*A complete overhaul of the public-facing surfaces, user identity system, and cloud infrastructure. PromptFlow moves from a local-first anonymous tool to a fully authenticated, cloud-synced creative platform with a polished brand identity.*

### 🌐 New Public Landing Page
- **Animated Text Matrix Background**: Full-screen 16×16 grid (256 cells), each running an independent character-by-character typewriter animation. 256 prompts span 10 languages (EN 30%, ZH 10%, JA 10%, KO 10%, FR 10%, EL/RU/AR/ES/IT/DE 5% each). Languages are shuffled client-side with Fisher-Yates to intersperse across cells.
- **Radial Vignette Overlay**: A tunable center-darkened gradient keeps the brand hero legible without fully obscuring the living background.
- **Brand Identity**: `PromptFlow.art` logo rendered with the same retro-futuristic mono typography used in the app header — bold `P`, 40%-opacity `rompt`, bold `Flow.`, accent-colored `art` that randomly cycles through 5 color palettes on each load.
- **CTA Buttons**: Clean "Sign In" (primary filled) and "Sign Up" (ghost border) entry points only. No navigation header on this page.

### 🔐 Complete Auth System Redesign
- **Retro-Futuristic Split-Screen Auth Page** (`/login`):
  - **Left brand panel** (desktop): Pixel-perfect grid lines (48px, 4% opacity), six diagonal accent stripes, corner bracket marks, animated node status indicator with UTC clock ticker.
  - **Right form panel**: SIGN IN / SIGN UP tab switcher (full-width, no-radius, inverted colors on active), bottom-border-only inputs with `px-1` breathing room, pure-white mono CTA button.
  - Shared auth logic — Google OAuth and email/password in one page, mode toggled via tab.
  - `autoComplete` attributes properly set: `username email` / `current-password` / `new-password`.
  - Browser autofill blue override via global CSS `inset box-shadow` trick (#151515 anthracite).
- **Header-Free Public Routes**: Landing page `/` and auth page `/login` are completely header-free. `ConditionalHeader` component routes based on `pathname`.
- **Auth Routing Walls** (Next.js Middleware): Unauthenticated users attempting `/gallery`, `/prompt`, `/modes`, `/settings` are redirected to `/login`. Authenticated users on `/login` are redirected to `/gallery`.
- **Sign Out Flow**: `LogoutButton` explicitly redirects to `/` (landing page) after destroying the Supabase session.

### ⚙️ Settings Page — Tabbed Redesign
- **Two-Tab Layout**: "Account" tab and "LLM Gateway" tab, switchable via clean top border-bottom tabs.
- **Account Tab**: Displays user email and authentication provider badge (Google OAuth or Email & Password). Password reset form for email users; hidden for Google OAuth users.
- **LLM Gateway Tab (BYOK)**: Full provider selector (OpenAI / Anthropic / Gemini / Custom), API key input, and model configuration.
- **Gemini Model Cards Restored**: Entering a Gemini API key triggers a live call to the Google `v1beta/models` endpoint. Available models are displayed as interactive cards showing display name, version badge, input/output cost per million tokens (from a local pricing table), and context window size. Clicking a card selects the model. Manual override input still available below.
- **Loading / Error States**: Spinner while fetching, red error box on invalid key, instructional placeholder when key is too short.

### 🖼️ Image & Gallery Fixes
- **Natural Aspect Ratios Restored**: Removed forced `aspect-[4/5]` from the Gallery thumbnail container and the Prompt Workspace image display. Images now render at their natural proportions.
- **Prompt Workspace Image**: Switched from `Image fill` + fixed container to intrinsic `width`/`height` with `max-h-[70vh]` responsive constraint.

### 🗄️ Cloud Storage & Data Migration
- **Supabase Storage Integration**: Images now uploaded to and served from Supabase Storage (`prompt-images` bucket) rather than IndexedDB blobs.
- **Data Rescue Tool** (`/rescue`): One-click migration wizard that scans legacy `PromptFlowDB_V2` IndexedDB for orphaned image blobs and bulk-uploads them to Supabase Storage using the authenticated user's ID as the path prefix.

### 🧠 Mode Architect Output Synchronization
- **Strict JSON Key Sync**: Added a new constraint to the Mode Architect's internal metaprompt (`CRITICAL SYNC`). The architect LLM is now forced to dynamically name its JSON template parameters using the exact titles it invents for the 5-sentence "Law". This fixes a UI mismatch bug where generated workspaces blindly displayed raw placeholder keys like `1. Technical Spec`.
- **Dynamic Mode Defaulting**: Creating a new Workspace now dynamically selects your *newest custom mode* instead of defaulting to the system `Photorealistic` mode. Custom modes are now heavily prioritized in the database fetch order.
- **UI Architect Overhaul**: Rewrote the "Draft Mode" input UI from a flat single-line `<input>` to a flexible multi-line `<textarea>`. Repositioned the generating button below the text frame to handle long user prompts smoothly, and fixed a CSS overflow clip that obscured the `@Image` mention dropdown.

### 🛠️ Developer & Infrastructure
- **`devIndicators: false`** in `next.config.ts`: Suppresses the Next.js dev toolbar "N" button so it doesn't appear to developers during local testing.
- **Hydration Fix**: Moved `Math.random()` shuffle of the prompt matrix from module-level (ran on both server and client, producing different results) to a client-only `useEffect` after mount, eliminating the SSR hydration mismatch error.
- **Global Autofill CSS Override**: Added `input:-webkit-autofill` rule in `globals.css` using the `inset box-shadow` technique to universally override the browser's blue autofill background across all inputs in the app.

---

## [v0.2] - The Visual Architecture & Data Integrity Update
**Date:** March 2026

*A massive overhaul of the gallery rendering engine, the custom mode editor layout, and the introduction of a robust multi-modal image referencing ecosystem.*

### 🖼️ The Multi-Modal Workspace
- **Image References**: Added full support for attaching up to 5 reference images per prompt iteration.
- **`@Image` Mentions**: Introduced a lightweight context menu. Users can now type `@` in the textarea to dynamically inject image tokens directly into the prompt body, anchoring images to specific contextual directives.
- **Vision Model Routing**: The LLM Engine now seamlessly packages base64 attachments into `gemini-2.5-flash` or `gemini-2.5-pro` multi-part payloads.

### 📐 Masonry Gallery 2.0
- **Algorithmic Chunking**: Replaced fragile CSS `columns` with a deterministic, math-based array-chunking algorithm for the home `/` gallery. Solves all hydration mismatches and visual tearing.
- **Dynamic Clamping Engine**: Text cards now measure their density via regex. Dense CJK languages (Chinese, Japanese) are clamped to 2 lines to prevent suffocation, while English expands elegantly to 3 lines.
- **Absolute Golden Ratios**: Images dynamically fill their tiles, but pure text cards now forcefully lock to an `aspect-[3/4]` golden ratio, mathematically slicing their interior into a 65% poetry block and 35% title footer.

### 🎛️ The Mode Editor (V10)
- **Floating Window Paradigm**: The Mode Editor was ripped out of the document flow and rebuilt as a massive, dual-pane `Dialog` overlay.
- **Isolated Scroll Zones**: The Persona/Law editors and the JSON output console now proudly feature independent `overflow-y-auto` scroll areas, locked behind a `h-[80vh]` viewport wall.
- **Structural Image Anchors**: Custom Modes can now embed default `referenceImageIds` deep into their DNA, guaranteeing that every prompt generated under that Mode inherits the source images.

### 🛡️ Core Data Migrations
- **Dexie V5**: Upgraded DB schemas to natively track `referenceImageIds` on multiple relational levels.
- **Dexie V6 (The Title Resurrecter)**: Wrote a deep retroactive migration to repair thousands of legacy Session titles that were historically corrupted by a white-space truncation bug.

---

## [v0.1] - The Mode Architect Engine
**Date:** March 2026

*A monumental leap from a static prompt generator to a dynamic ruleset builder.*

### 🧠 Mode Architect (AI Metaprompt)
- **Dynamic AI Modes**: Transitioned from 4 hardcoded aesthetic modes to an infinitely expanding IndexedDB-based library of `PromptModeDef` objects.
- **The "Draft Mode" Console**: Users can type a single sentence to have Gemini auto-generate a complex system prompt with domain-specific JSON keys.
- **Smart Semantic Extraction**: Strictly instructed JSON keys (e.g., `core_subject`, `lighting`, `cmf_materials`).

### 🎛️ The Stacked Mode Editor (V9.2)
- **Visual Split Architecture**: System prompt split into 3 logical vertical stacks: System Persona, Rules of Creation, JSON Structure.
- **Bulletproof Regex Parser**: `prompt-parser.ts` uses aggressive, forgiving fallbacks to parse modes even when the AI hallucinates markdown.

### 🛡️ UX & Infrastructure
- **Network Resilience**: Exponential backoff `fetchWithRetry` for Gemini 503/429 rate limit errors.
- **Active / Hidden Library**: Visibility toggles on `/modes`.
- **Safe Deletion**: Shadcn `AlertDialog` replaces native `confirm()` popups.

---

## [v0.0] - Initial MVP Release
**Date:** March 2026

*The foundation of the PromptFlow experience.*

### ✨ Key Features
- **4 Core Creative Modes**: Photo, Art, 3D, and Design specialized engines.
- **Intelligent Split-Pane Workspace**: Chat timeline + ScriptPanel + ParamInspector.
- **Dynamic Parameter Extraction**: AI-extracted scene parameters as clickable UI tags.
- **Privacy-First Local Gallery**: IndexedDB storage with Dexie.js.
- **Bring Your Own Key (BYOK)**: OpenAI and Google Gemini API keys stored locally.
