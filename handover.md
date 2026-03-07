# Handover: PromptFlow v0.3

## Current State
The project has completed Phase 9. The app is now a fully cloud-authenticated platform with a polished public identity. The core prompt engineering workflow is stable and production-ready. All data is migrated from pure local IndexedDB to a hybrid model: IndexedDB for structured data (sessions, iterations, modes), Supabase Auth for identity, and Supabase Storage for images.

---

## Completed Major Capabilities

### Authentication & Identity (New in v0.3)
- **Supabase Auth**: Google OAuth and Email/Password. Session managed via `@supabase/ssr` with cookie-based tokens.
- **Next.js Middleware** (`src/lib/supabase/middleware.ts`): Protects `/gallery`, `/prompt`, `/modes`, `/settings` from unauthenticated access. Redirects logged-in users away from `/login`.
- **`ConditionalHeader`** (`src/components/layout/conditional-header.tsx`): Renders the topbar only on post-auth pages (not on `/` or `/login`). Uses `usePathname()`.
- **`LogoutButton`** (`src/components/logout-button.tsx`): Signs out via `supabase.auth.signOut()`, then `router.push("/")` + `router.refresh()`.

### Public Landing Page (New in v0.3)
- **File**: `src/app/page.tsx`
- **Mechanics**: 256 prompts across 10 languages in a 16×16 CSS Grid. Single RAF loop at ~20fps drives a `typing → pausing → erasing` state machine per cell. `Math.random()` shuffle runs in `useEffect` only (post-mount, client-only) to avoid SSR hydration mismatch. `useState` counter forces re-renders from the RAF callback.
- **Logo**: `artColor` randomly selected from 5 palette classes in a `useEffect`, matching header style.

### Auth Page (New in v0.3)
- **File**: `src/app/login/page.tsx`
- **Structure**: Split-screen layout. Left brand panel (grid lines, diagonal accents, UTC clock). Right form panel (SIGN IN / SIGN UP tab switcher, bottom-border inputs, white CTA). Single component `AuthForm` wrapped in `<Suspense>` for `useSearchParams` compatibility in Next.js 16.
- **`autoComplete` attributes**: `username email` / `current-password` / `new-password` depending on mode.

### Settings Page — Tabbed (New in v0.3)
- **File**: `src/app/settings/page.tsx`
- **Account tab**: Supabase user email + provider badge. Password reset form (hidden for Google users).
- **LLM Gateway tab**: Provider selector, API key, and Gemini model cards. Cards fetched live from `https://generativelanguage.googleapis.com/v1beta/models?key=...` with 800ms debounce.

### Supabase Storage & Image Pipeline
- **Bucket**: `prompt-images` (public bucket in your Supabase project).
- **Path convention**: `{user.id}/{image_uuid}` — no file extension stored (extension inferred at upload time from blob MIME type).
- **`useImageUrl` hook** (`src/hooks/use-image-url.ts`): Resolves image IDs to signed/public URLs. Handles legacy IDs gracefully by returning `null` if not found.
- **Data Rescue** (`src/app/rescue/page.tsx`): One-time migration tool. Opens `PromptFlowDB_V2` IndexedDB, finds all image records (blob stored in `.data` field of `ImageRecord`), and bulk-uploads them to Supabase Storage using the authenticated user's ID. File name = original image UUID (no extension) for Postgres foreign key compatibility.

### LLM Engine (Unchanged from v0.2)
- **File**: `src/lib/llm-client.ts`
- Uses `@google/genai` SDK. Dynamically constructs system prompts from `PromptModeDef`. Handles text + multi-image payloads.

### Local Database (Unchanged from v0.2)
- **File**: `src/lib/db.ts`
- Dexie.js V6. Stores `sessions`, `iterations`, `modes`, `images`. V6 migration retroactively fixes corrupted session titles.

---

## Critical Implementation Details for Next Agent

1. **Hydration-safe randomness**: Never call `Math.random()` at module level in `"use client"` components used by the App Router. Always put random initialization inside `useEffect` (client-only, post-mount). This affects the landing page matrix animation.

2. **`ConditionalHeader` must stay updated**: Any new public routes (e.g., `/about`, `/pricing`) should be added to the `pathname` exclusion list in `src/components/layout/conditional-header.tsx`.

3. **Supabase image path convention**: Image uploads use `session.user.id + "/" + imageId` as the storage path. The `imageId` is the raw UUID from Dexie (no file extension). `useImageUrl` constructs the public URL using `supabase.storage.from("prompt-images").getPublicUrl(path)`.

4. **Gemini model fetching**: The Settings page fetches from `v1beta/models` on Gemini. Filtering is: must start with `models/gemini` AND must include `generateContent` in `supportedGenerationMethods`. The `GEMINI_PRICING` map in `settings/page.tsx` is manually maintained — update when Google changes pricing.

5. **Browser autofill**: A global CSS override in `globals.css` uses `inset box-shadow: 0 0 0 1000px #151515` to suppress browser blue autofill backgrounds. This applies to ALL inputs in the app globally.

6. **Masonry Gallery**: Never revert to CSS `columns`. Always use the deterministic mathematical array-chunking algorithm in `src/app/gallery/page.tsx` via `useResponsiveColumns`.

7. **`devIndicators: false`** is set in `next.config.ts` — this hides the Next.js dev toolbar "N" button during local development.

---

## Potential Future Work (Phase 10+)

1. **Direct Image Generation**: Connect generated prompts to Replicate (Flux / SDXL) via server actions — user clicks "Generate" and the image renders in the workspace without copy-pasting.
2. **Cloud Session Sync**: Migrate Dexie sessions/iterations to Supabase PostgreSQL for multi-device access.
3. **Public Prompt Gallery**: Opt-in sharing of sessions via short link with a read-only viewer.
4. **Full-Text Search**: Token-filter index across `session.title` and `iteration.userNotes` via a top nav search bar.
5. **Version History**: Git-like branching within a session to explore alternative prompt trajectories.
