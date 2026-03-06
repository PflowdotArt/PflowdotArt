# PromptFlow - Changelog

All notable changes to this project will be documented in this file. 
This log is intended for users and follows major feature releases and milestones, rather than granular Git commits.

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
- **Dexie V6 (The Title Resurrecter)**: Wrote a deep retroactive migration to repair thousands of legacy Session titles that were historically corrupted by a white-space truncation bug. The migration digs into the first child iteration and extracts pristine user notes to rebuild the Gallery titles up to 200 characters.

---

## [v0.1] - The Mode Architect Engine
**Date:** March 2026

*A monumental leap from a static prompt generator to a dynamic ruleset builder. This version empowers users to create their own AI "Directors" using natural language and edit their DNA through a visual console.*

### 🧠 Mode Architect (AI Metaprompt)
- **Dynamic AI Modes**: Transitioned from 4 hardcoded aesthetic modes to an infinitely expanding IndexedDB-based library of `PromptModeDef` objects.
- **The "Draft Mode" Console**: Users can now type a single sentence describing an art style (e.g., "Neon Cyberpunk Sprites") and PromptMaster will invoke Gemini to write a highly complex, perfect JSON system prompt that adheres to the 5-sentence-law and extracts custom UI parameters.
- **Smart Semantic Extraction**: The LLM is now strictly instructed to use domain-specific JSON keys (e.g., `core_subject`, `lighting`, `cmf_materials`) for its internal breakdown, rather than lazy defaults like "sentence_1", yielding a highly professional UI.

### 🎛️ The Stacked Mode Editor (V9.2)
- **Visual Split Architecture**: Discarded raw, error-prone JSON string editing for custom modes. The new editor visually splits the system prompt into 3 logical, vertical stacks:
  1. `System Persona`: A free-form text area defining the AI's role.
  2. `Rules of Creation`: A free-form area for unlimited chronological rules.
  3. `JSON Structure`: A sleek, dark-themed, monospace console showing exactly how the AI will build the final payload.
- **Bulletproof Regex Parser**: The underlying engine `prompt-parser.ts` now uses aggressive, forgiving fallbacks (anchoring on the first `{` and scanning for `CRITICAL RULES`) to successfully parse user modes, even when the AI hallucinates its markdown formatting.

### 🛡️ UX & Infrastructure
- **Network Resilience**: Added an exponential backoff `fetchWithRetry` wrapper to the LLM client, seamlessly handling temporary Gemini 503/429 rate limit errors without throwing red error boxes at the user.
- **Active / Hidden Library**: Added visibility toggles to the `/modes` page so users can curate which active modes appear in their primary Prompt Workspace chat interface.
- **Safe Deletion**: Added a Shadcn `AlertDialog` wrapper around the deletion workflows, replacing jarring browser native `confirm()` popups.

---

## [v0.0] - Initial MVP Release
**Date:** March 2026

*The foundation of the PromptFlow experience. This release establishes the core workspace, privacy-first local storage, and the foundational AI "Director" engine.*

### ✨ Key Features
- **4 Core Creative Modes**: Introduced specialized structural engines for generating precise prompts tailored for Photo, Art, 3D, and Design.
- **Intelligent Split-Pane Workspace**: A brand new interface separating the conversational timeline on the left from the `ScriptPanel` and `ParamInspector` on the right.
- **Dynamic Parameter Extraction**: The AI isolates key parameters from the prompt, allowing users to tweak individual elements via the right sidebar.
- **Privacy-First Local Gallery**: All project iterations, prompts, and dropped images are stored entirely in IndexedDB.
- **Bring Your Own Key (BYOK)**: Support for OpenAI and Google Gemini API keys stored locally.
