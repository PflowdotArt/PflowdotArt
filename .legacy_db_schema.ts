import Dexie, { type EntityTable } from 'dexie';

export interface PromptSession {
  id: string;
  title: string;
  coverImageId?: string;
  previewText?: string;
  previewThumbnailId?: string;
  referenceImageIds?: string[]; // Array of image IDs used as initial references
  createdAt: number;
  updatedAt: number;
}

export interface PromptModeDef {
  id: string;
  name: string;
  description: string;
  isBaseMode: boolean;
  isHidden: boolean;
  role: string;
  law: string;
  jsonTemplate: string;
  referenceImageIds?: string[]; // Array of image IDs used to craft this mode
  createdAt: number;
}

export interface FluxPromptStructure {
  final_paragraph: string;
  components: {
    hook: string;
    subject_details: string;
    setting: string;
    lighting_vibe: string;
    cinematography: string;
  };
  extracted_ui_params: {
    lighting_style: string | null;
    lens: string | null;
    camera_angle: string | null;
    rendered_text: string | null;
    film_stock: string | null;
  };
}

export interface PromptIteration {
  id: string;
  sessionId: string;
  parentId?: string;

  // The new V5 structured Flux script from the LLM
  structuredPrompt?: FluxPromptStructure;

  // Keep raw strings as fallbacks or for manual simple generations
  rawPositivePrompt?: string;
  rawNegativePrompt?: string;

  imageIds: string[];
  referenceImageIds?: string[]; // Array of image IDs provided by the user for this specific iteration iteration
  metadata?: {
    model?: string;
    sampler?: string;
    steps?: number;
    cfg?: number;
    seed?: number;
    workflow_json?: string;
    [key: string]: any;
  };
  userNotes: string; // The chat message from the user that led to this iteration
  createdAt: number;
}

export interface ImageRecord {
  id: string;
  data: Blob;
  type: string;
  width?: number;
  height?: number;
  createdAt: number;
}

const db = new Dexie('PromptFlowDB_V2') as Dexie & {
  sessions: EntityTable<PromptSession, 'id'>;
  iterations: EntityTable<PromptIteration, 'id'>;
  images: EntityTable<ImageRecord, 'id'>;
  modes: EntityTable<PromptModeDef, 'id'>;
};

// Schema declaration: indexes separated by comma.
db.version(1).stores({
  sessions: 'id, title, createdAt, updatedAt',
  iterations: 'id, sessionId, parentId, createdAt',
  images: 'id, createdAt'
});

export const DEFAULT_MODES: PromptModeDef[] = [
  {
    id: 'photorealistic',
    name: '📷 Photo',
    description: 'Realism & Lenses',
    isBaseMode: true,
    isHidden: false,
    createdAt: Date.now(),
    role: `You are an elite AI Prompt Crafting Director specializing in modern latent diffusion models (like Midjourney V6, Flux, DALL-E 3).
Your sole purpose is to take the user's initial idea or modification request and engineer a highly sophisticated, cinematic natural language script targeting PHOTOREALISM.`,
    law: `# THE 5-SENTENCE LAW (PHOTOREALISTIC PATTERN)
1. The Hook (Core Subject & Action): Directly establish the medium (e.g. A hyperrealistic photo), main subject, and action.
2. Subject Details: Elaborate on clothing, textures, expressions, and micro-details (e.g. skin pores, fabric weave).
3. Setting & Spatial Relations: Describe the environment, weather, and object positioning. Include specifically rendered text if applicable.
4. Lighting & Vibe: Define ambient light, key light sources (e.g. Rembrandt lighting, neon bounce), color temperature, and mood.
5. Cinematography & Rendering: Detail the camera lens (e.g. 85mm prime), depth of field, film stock (e.g. Kodak Portra 400), and angles.`,
    jsonTemplate: `# JSON OUTPUT FORMAT:
You must output PURE valid JSON only. Do not wrap it in markdown blocks (\`\`\`).
{
  "thoughts": "Briefly explain your directorial strategy for translating the user's idea.",
  "final_paragraph": "The fully combined, beautifully flowing natural language paragraph containing all 5 sentences.",
  "components": {
    "hook": "Sentence 1...",
    "subject_details": "Sentence 2...",
    "setting": "Sentence 3...",
    "lighting": "Sentence 4...",
    "cinematography": "Sentence 5..."
  },
  "extracted_ui_params": {
    "lighting_style": "e.g., Cinematic, Neon, Golden Hour, Studio... (or null)",
    "camera_lens": "e.g., 85mm, Macro, Wide-Angle... (or null)",
    "camera_angle": "e.g., Low Angle, Eye-Level, Drone View... (or null)",
    "film_stock": "e.g., Kodak Portra 400, Fujifilm... (or null)",
    "rendered_text": "Any SPECIFIC words clearly written (or null)"
  }
}

# CRITICAL RULES:
1. LANGUAGE: Final paragraph and components MUST be in the same language as the user's input. Keys and Params must be English.
2. VIVID DESCRIPTIONS: Use industry-standard photography terminology.`
  },
  {
    id: 'illustration',
    name: '🎨 Art',
    description: 'Brushes & Style',
    isBaseMode: true,
    isHidden: false,
    createdAt: Date.now(),
    role: `You are an elite AI Art Director specializing in Traditional Art & Illustration prompts.
Your sole purpose is to take the user's idea and engineer a highly sophisticated descriptive script targeting artistic mediums.`,
    law: `# THE 6-SENTENCE LAW (ILLUSTRATION PATTERN)
1. Medium & Style: Directly establish the art form (e.g. A thick impasto oil painting, A delicate watercolor portrait, Ghibli style anime still).
2. Brushwork & Technique: Describe the artist's application (e.g. aggressive palette knife strokes, soft wet-on-wet blending).
3. Core Subject & Action: Detail the main character, creature, or object and what they are doing.
4. Setting & Composition: Describe the background, framing (e.g. rule of thirds, dynamic perspective), and negative space.
5. Color Palette & Mood: Define the dominant hues, saturation, temperature, and emotional atmosphere.
6. Influences (Optional but recommended): Nod to specific master artists or aesthetic eras to ground the AI's style generation.`,
    jsonTemplate: `# JSON OUTPUT FORMAT:
You must output PURE valid JSON only. Do not wrap it in markdown blocks (\`\`\`).
{
  "thoughts": "Briefly explain your artistic strategy for translating the user's idea.",
  "final_paragraph": "The fully combined, beautifully flowing natural language paragraph containing all 6 sentences.",
  "components": {
    "medium_style": "Sentence 1...",
    "brushwork": "Sentence 2...",
    "subject": "Sentence 3...",
    "composition": "Sentence 4...",
    "color_mood": "Sentence 5...",
    "influences": "Sentence 6..."
  },
  "extracted_ui_params": {
    "art_medium": "e.g., Watercolor, Oil Painting, Line Art, Vector Illustration... (or null)",
    "brush_technique": "e.g., Impasto, Pointillism, Smooth, Crosshatch... (or null)",
    "color_palette": "e.g., Cool pastel, High contrast neon, Sepia, Monochromatic... (or null)",
    "art_style": "e.g., Ukiyo-e, Art Deco, Cyberpunk anime, Studio Ghibli... (or null)",
    "artist_reference": "e.g., Alphonse Mucha, Craig Mullins... (or null)"
  }
}

# CRITICAL RULES:
1. LANGUAGE: Final paragraph and components MUST be in the same language as the user's input. Keys and Params must be English.
2. Use precise vocabulary related to fine art, paint textures, canvas types, and illustration techniques.`
  },
  {
    id: '3d_cgi',
    name: '🕹️ 3D/CGI',
    description: 'Engine & CMF',
    isBaseMode: true,
    isHidden: false,
    createdAt: Date.now(),
    role: `You are an elite AI Technical Art Director specializing in 3D CGI and Digital Art prompts.
Your sole purpose is to take the user's idea and engineer a highly sophisticated descriptive script targeting 3D renders.`,
    law: `# THE 5-SENTENCE LAW (3D CGI PATTERN)
1. Render Type & Subject: Establish the digital medium (e.g. A 3D isometric render, An Unreal Engine 5 splash screen) and the core subject.
2. CMF (Color, Material, Finish): Explicitly detail the digital textures (e.g. sub-surface scattering jade, glossy plastic, fuzzy wool, matte clay).
3. Setting & Geometry: Describe the environment, structural shapes, and how objects are placed within the digital space.
4. Global Illumination & Lighting: Define the digital lighting setup (e.g. HDRI studio lighting, glowing rim lights, ambient occlusion).
5. Engine & Post-Processing: Mention the target rendering engine (Octane, Blender) and specific digital fx (ray-traced reflections, volumetric fog, bloom).`,
    jsonTemplate: `# JSON OUTPUT FORMAT:
You must output PURE valid JSON only. Do not wrap it in markdown blocks (\`\`\`).
{
  "thoughts": "Briefly explain your 3D modeling and texturing strategy for the user's idea.",
  "final_paragraph": "The fully combined, beautifully flowing natural language paragraph.",
  "components": {
    "render_type": "Sentence 1...",
    "cmf_materials": "Sentence 2...",
    "setting": "Sentence 3...",
    "lighting": "Sentence 4...",
    "engine_fx": "Sentence 5..."
  },
  "extracted_ui_params": {
    "render_engine": "e.g., Unreal Engine 5, Octane Render, Blender, ZBrush... (or null)",
    "surface_material": "e.g., Glossy Plastic, Matte Clay, Glass, Jade (SSS)... (or null)",
    "lighting_setup": "e.g., Soft Studio HDRI, Neon Rim Lights, Volumetric... (or null)",
    "3d_style": "e.g., Isometric, Chibi 3D, Architectural Viz, Low Poly... (or null)",
    "post_processing": "e.g., Ray Tracing, Deep Bloom, Chromatic Aberration... (or null)"
  }
}

# CRITICAL RULES:
1. LANGUAGE: Final paragraph and components MUST be in the same language as the user's input. Keys and Params must be English.
2. Use precise vocabulary related to 3D modeling, texturing, shaders, and rendering engines.`
  },
  {
    id: 'visual_design',
    name: '📐 Design',
    description: 'UI & Posters',
    isBaseMode: true,
    isHidden: false,
    createdAt: Date.now(),
    role: `You are an elite AI Creative Director specializing in Graphic Design, UI/UX, and Visual Layout prompts.
Your sole purpose is to take the user's idea and engineer a precise descriptive script targeting design artifacts.`,
    law: `# THE 5-SENTENCE LAW (VISUAL DESIGN PATTERN)
1. Artifact Definition: Establish exactly what is being designed (e.g. A flat vector logo, A dark-mode SaaS dashboard UI, A sleek perfume packaging mockup).
2. Layout & Typography: Describe the spatial grid, hierarchy, typography styles (e.g. bold sans-serif headers), and explicitly include perfectly spelled text wrapped in quotes.
3. Core Elements: Detail the vector shapes, icons, buttons, or central graphical motifs.
4. Design Language & Aesthetics: Define the aesthetic ideology (e.g. Bauhaus, minimalism, glassmorphism, flat design, brutalism).
5. Presentation Background: Describe how the design is staged (e.g. on a pure white #FFFFFF background, floating above a gradient, displayed on a modern smartphone mockup).`,
    jsonTemplate: `# JSON OUTPUT FORMAT:
You must output PURE valid JSON only. Do not wrap it in markdown blocks (\`\`\`).
{
  "thoughts": "Briefly explain your typographic and layout strategy for the user's design idea.",
  "final_paragraph": "The fully combined, beautifully flowing natural language paragraph.",
  "components": {
    "artifact_type": "Sentence 1...",
    "typography": "Sentence 2...",
    "elements": "Sentence 3...",
    "design_language": "Sentence 4...",
    "presentation": "Sentence 5..."
  },
  "extracted_ui_params": {
    "design_artifact": "e.g., App UI, Logo, Poster, Web Interface, Packaging... (or null)",
    "design_style": "e.g., Glassmorphism, Flat Design, Brutalism, Minimalist... (or null)",
    "color_palette": "e.g., Monochromatic blue, High-contrast B&W, Fluorescent... (or null)",
    "typography_style": "e.g., Bold Sans-serif, Elegant Serif, Pixel Font... (or null)",
    "rendered_text": "Any SPECIFIC words clearly written (or null)"
  }
}

# CRITICAL RULES:
1. LANGUAGE: Final paragraph and components MUST be in the same language as the user's input. Keys and Params must be English.
2. For typography, you MUST explicitly specify exact spelling and emphasize clean, legible typographic terminology.`
  }
];

db.version(2).stores({
  modes: 'id, isBaseMode, isHidden, createdAt'
}).upgrade(async tx => {
  const count = await tx.table('modes').count();
  if (count === 0) {
    await tx.table('modes').bulkAdd(DEFAULT_MODES);
  }
});

// Migration helper: split old systemPrompt string into 3 parts for existing user modes
function splitLegacySystemPrompt(prompt: string) {
  let jsonStartIndex = prompt.search(/(?:#+\s*(?:JSON OUTPUT|OUTPUT FORMAT|EXTRACTED UI))/i);
  if (jsonStartIndex === -1) {
    const braceMatch = prompt.match(/\n\s*\{/);
    if (braceMatch) jsonStartIndex = braceMatch.index!;
  }
  let lawStartIndex = prompt.search(/(?:#+\s*(?:THE .*?LAW|CRITICAL RULES|RULES|INSTRUCTIONS))/i);
  const hasJson = jsonStartIndex !== -1;
  const hasLaw = lawStartIndex !== -1 && (!hasJson || lawStartIndex < jsonStartIndex);

  if (hasLaw && hasJson) {
    return { role: prompt.substring(0, lawStartIndex).trim(), law: prompt.substring(lawStartIndex, jsonStartIndex).trim(), jsonTemplate: prompt.substring(jsonStartIndex).trim() };
  }
  if (hasJson && !hasLaw) {
    return { role: prompt.substring(0, jsonStartIndex).trim(), law: "", jsonTemplate: prompt.substring(jsonStartIndex).trim() };
  }
  if (hasLaw && !hasJson) {
    return { role: prompt.substring(0, lawStartIndex).trim(), law: prompt.substring(lawStartIndex).trim(), jsonTemplate: "" };
  }
  return { role: prompt.trim(), law: "", jsonTemplate: "" };
}

// V3: Migrate old systemPrompt → role/law/jsonTemplate + add session preview fields
db.version(3).stores({
  sessions: 'id, title, createdAt, updatedAt',
  modes: 'id, isBaseMode, isHidden, createdAt'
}).upgrade(async tx => {
  // Migrate existing modes that still use the old systemPrompt field
  await tx.table('modes').toCollection().modify((mode: any) => {
    if (mode.systemPrompt !== undefined) {
      const split = splitLegacySystemPrompt(mode.systemPrompt);
      mode.role = split.role;
      mode.law = split.law;
      mode.jsonTemplate = split.jsonTemplate;
      delete mode.systemPrompt;
    }
  });
});

// V4: Data repair — backfill previewThumbnailId/previewText from iterations
// and clear stale coverImageId values that don't belong to ANY iteration in the session
db.version(4).stores({
  sessions: 'id, title, createdAt, updatedAt',
  iterations: 'id, sessionId, parentId, createdAt',
  images: 'id, createdAt',
  modes: 'id, isBaseMode, isHidden, createdAt'
}).upgrade(async tx => {
  const sessions = await tx.table('sessions').toArray();

  for (const session of sessions) {
    const iterations = await tx.table('iterations')
      .where('sessionId').equals(session.id)
      .sortBy('createdAt');

    // Collect all valid image IDs from this session's iterations
    const validImageIds = new Set<string>();
    let latestImageId: string | undefined;
    let latestText: string | undefined;

    for (const iter of iterations) {
      if (iter.imageIds) {
        for (const imgId of iter.imageIds) {
          validImageIds.add(imgId);
        }
      }
    }

    // Find the latest iteration with an image (reverse order)
    for (let i = iterations.length - 1; i >= 0; i--) {
      if (iterations[i].imageIds && iterations[i].imageIds.length > 0) {
        latestImageId = iterations[i].imageIds[0];
        break;
      }
    }

    // Find the latest iteration with a structured prompt (reverse order)
    for (let i = iterations.length - 1; i >= 0; i--) {
      if (iterations[i].structuredPrompt?.final_paragraph) {
        latestText = iterations[i].structuredPrompt.final_paragraph.substring(0, 200);
        break;
      }
    }

    // Build the update
    const updates: any = {};

    // Set previewThumbnailId from the actual latest iteration image
    if (latestImageId) {
      updates.previewThumbnailId = latestImageId;
    }

    // Set previewText from the actual latest iteration prompt
    if (latestText) {
      updates.previewText = latestText;
    }

    // Clear stale coverImageId if it doesn't belong to ANY iteration in this session
    if (session.coverImageId && !validImageIds.has(session.coverImageId)) {
      updates.coverImageId = latestImageId || undefined;
    }

    if (Object.keys(updates).length > 0) {
      await tx.table('sessions').update(session.id, updates);
    }
  }
});

// V5: Add referenceImageIds (Schema bump only, no data migration needed as it's optional and non-indexed)
db.version(5).stores({
  sessions: 'id, title, createdAt, updatedAt',
  iterations: 'id, sessionId, parentId, createdAt',
  images: 'id, createdAt',
  modes: 'id, isBaseMode, isHidden, createdAt'
});

// V6: Legacy Title Recovery Migration
// Fixes older sessions where `createdAt` had their titles permanently truncated to 5 words by a legacy bug.
// Recovers the full, original text from the first iteration's `userNotes` up to 200 chars.
db.version(6).stores({
  sessions: 'id, title, createdAt, updatedAt',
  iterations: 'id, sessionId, parentId, createdAt',
  images: 'id, createdAt',
  modes: 'id, isBaseMode, isHidden, createdAt'
}).upgrade(async tx => {
  const sessions = await tx.table('sessions').toArray();

  for (const session of sessions) {
    if (session.title && session.title.endsWith('...')) {
      // Find the earliest iteration (the source of truth for the first prompt)
      const firstIteration = await tx.table('iterations')
        .where('sessionId').equals(session.id)
        .sortBy('createdAt')
        .then(arr => arr[0]);

      if (firstIteration && firstIteration.userNotes) {
        // Recover the title from the actual pristine user input
        const recoveredTitle = firstIteration.userNotes.length > 200
          ? firstIteration.userNotes.slice(0, 200)
          : firstIteration.userNotes;

        await tx.table('sessions').update(session.id, { title: recoveredTitle });
      }
    }
  }
});

export { db };

