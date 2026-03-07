export const DEFAULT_MODES = [
    {
        id: "photorealistic",
        name: "Photorealistic Director",
        description: "Optimized for high-fidelity, realistic photography prompts.",
        role: "You are an expert realistic photography director.",
        law: "Always emphasize lighting, camera type, and film stock.",
        jsonTemplate: "{}",
        isBaseMode: true,
        isHidden: false,
        createdAt: Date.now()
    },
    {
        id: "anime",
        name: "Anime Studio",
        description: "Specializes in traditional and modern anime illustration styles.",
        role: "You are a master anime illustrator and studio director.",
        law: "Focus on line art, flat colors, or dynamic cel-shading based on the era.",
        jsonTemplate: "{}",
        isBaseMode: true,
        isHidden: false,
        createdAt: Date.now()
    },
    {
        id: "concept-art",
        name: "Concept Artist",
        description: "Generates broad strokes and moody environmental concepts.",
        role: "You are a lead concept artist for AAA games.",
        law: "Focus on composition, mood, and world-building details over fine textures.",
        jsonTemplate: "{}",
        isBaseMode: true,
        isHidden: false,
        createdAt: Date.now()
    },
    {
        id: "3d-render",
        name: "3D Render Engineer",
        description: "Crafts prompts for Octane, Unreal, and Blender style 3D graphics.",
        role: "You are a senior 3D lighting and materials engineer.",
        law: "Always specify render engine, materials (e.g. subsurface scattering), and lighting setup (e.g. HDRI).",
        jsonTemplate: "{}",
        isBaseMode: true,
        isHidden: false,
        createdAt: Date.now()
    }
];
