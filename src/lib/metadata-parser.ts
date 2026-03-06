export interface ComfyUIMetadata {
    prompt?: any; // The raw prompt JSON (what the actual execution used)
    workflow?: any; // The UI workflow JSON
    [key: string]: any;
}

export async function parseComfyUIPngMetadata(file: File): Promise<ComfyUIMetadata | null> {
    const buffer = await file.arrayBuffer();
    const view = new DataView(buffer);

    // Check PNG signature
    if (view.getUint32(0) !== 0x89504e47 || view.getUint32(4) !== 0x0d0a1a0a) {
        console.warn("Not a valid PNG file.");
        return null;
    }

    let offset = 8;
    const metadata: Record<string, string> = {};

    while (offset < view.byteLength) {
        const length = view.getUint32(offset);
        const type = String.fromCharCode(
            view.getUint8(offset + 4),
            view.getUint8(offset + 5),
            view.getUint8(offset + 6),
            view.getUint8(offset + 7)
        );

        if (type === "tEXt") {
            const chunkData = new Uint8Array(buffer, offset + 8, length);
            // tEXt chunk format: keyword (null terminated) + text string
            let nullIndex = 0;
            for (let i = 0; i < chunkData.length; i++) {
                if (chunkData[i] === 0) {
                    nullIndex = i;
                    break;
                }
            }

            const decoder = new TextDecoder();
            const keyword = decoder.decode(chunkData.slice(0, nullIndex));
            const text = decoder.decode(chunkData.slice(nullIndex + 1));

            metadata[keyword] = text;
        }

        // Move past length (4), type (4), data (length), CRC (4)
        offset += 12 + length;
    }

    const result: ComfyUIMetadata = {};

    if (metadata.prompt) {
        try {
            result.prompt = JSON.parse(metadata.prompt);
        } catch (e) {
            result.prompt = metadata.prompt;
        }
    }

    if (metadata.workflow) {
        try {
            result.workflow = JSON.parse(metadata.workflow);
        } catch (e) {
            result.workflow = metadata.workflow;
        }
    }

    // Fallback for Automatic1111/WebUI if the user drops one of those instead
    if (metadata.parameters) {
        result.parameters = metadata.parameters;
    }

    return Object.keys(result).length > 0 ? result : null;
}
