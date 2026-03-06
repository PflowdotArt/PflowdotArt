# Handover: PromptMaster v0.1.0

## Current State
The project has reached the end of Phase 8. All UI and UX stability goals for the Prompt Generation flow, Gallery Masonry layout, and Custom Mode editor have been completely realized. The app is robust, handles multi-modal inputs, and perfectly balances layout aesthetics.

## Completed Major Capabilities
- **LLM Abstraction**: `lib/llm-client.ts` uses the `@google/genai` SDK to dynamically route prompts to `gemini-2.5-flash` or `gemini-2.5-pro` based on user settings. Parses complex JSON outputs natively.
- **Image References (Multi-modal)**: Users can attach up to 5 images per Session/Iteration. The UI supports drag-and-drop, inline `@Image` mentions within the textarea, and automatic base64 bundling into the LLM payload.
- **Custom AI Modes**: The `Mode Editor` now supports overriding the System Prompt (Role/Law/JSON Template) and injecting structural `referenceImageIds` that ground every prompt generated under that mode.
- **Robust Local Database**: Dexie.js (V6) powers the local-first storage (`sessions`, `iterations`, `modes`, `images`). Includes complex cursor pagination (`offset/limit`) for scalable infinite scrolling and retroactive migration logic to repair corrupted legacy titles.
- **Masonry Gallery**: The home page `/` uses a deterministic mathematical array-chunking algorithm (reacting to a `useResponsiveColumns` resize hook) to pack infinite-scroll cards flawlessly without CSS column-break bleeding.
- **Typography & Clamping**: Gallery cards execute language-aware line clamping (English: 3 lines, CJK: 2 lines) and mathematically safe layout boundaries for cards lacking generated image previews (65% text / 35% footer strict splitting).

## Critical Implementation Details for Next Agent
1. **Never use standard CSS `columns` for Masonry**: It breaks Next.js hydration and tears React elements. Always use the deterministic mathematical sub-array chunking currently implemented in `src/app/page.tsx` (`const columnsData = Array.from({ length: cols }, () => [])`).
2. **Ellipsis Source of Truth**: The database NEVER stores `...` at the end of strings anymore (since V6 Migration). It stores raw text up to 200 chars. 100% of truncation indicators (`...`) are generated dynamically by the browser via Tailwind's `line-clamp-X`.
3. **Empty Card Strict Dimensions**: Empty cards in the gallery use `aspect-[3/4]` and are internally restricted with absolute percentage heights (`h-[65%]` / `h-[35%]`) to prevent structural overlap. Do not change this to flex-grow unless you redesign the boundary constraints.

## Potential Future Work (Phase 9+)
1. **Cloud Sync**: Integrating Supabase or Firebase to back up the Dexie.js local indexedDB.
2. **Direct Image Generation API**: Hooking up the generated Prompt texts directly to Replicate (Flux/Midjourney API) via server actions so the user doesn't have to copy-paste.
3. **Search & Tagging**: Implementing full-text search across all `session.title` and `iteration.userNotes` via a top-level nav search bar.
