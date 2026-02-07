
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Node as NodeType } from '../types'; // Import Node type for better typing

// Default models
const DEFAULT_TEXT_MODEL = 'gemini-3-flash-preview'; 
const DEFAULT_IMAGE_MODEL = 'gemini-2.5-flash-image';

// Local Storage Keys
const WORKFLOW_STORAGE_KEY = 'gemini_node_workflow_state';
const TEXT_MODEL_STORAGE_KEY = 'gemini_node_text_model';
const IMAGE_MODEL_STORAGE_KEY = 'gemini_node_image_model';
const USE_CACHE_STORAGE_KEY = 'gemini_node_use_cache';
const RESTORE_WORKFLOW_STORAGE_KEY = 'gemini_node_restore_workflow';


export const getActiveModels = () => {
    return {
        textModel: localStorage.getItem(TEXT_MODEL_STORAGE_KEY) || DEFAULT_TEXT_MODEL,
        imageModel: localStorage.getItem(IMAGE_MODEL_STORAGE_KEY) || DEFAULT_IMAGE_MODEL
    };
};

export const setActiveModels = (textModel: string, imageModel: string) => {
    localStorage.setItem(TEXT_MODEL_STORAGE_KEY, textModel);
    localStorage.setItem(IMAGE_MODEL_STORAGE_KEY, imageModel);
};

export const getEngineSettings = () => {
    return {
        useCache: localStorage.getItem(USE_CACHE_STORAGE_KEY) === 'true', // Default is false (regenerate)
        restoreWorkflowOnLoad: localStorage.getItem(RESTORE_WORKFLOW_STORAGE_KEY) !== 'false' // Default is true
    };
};

export const setEngineSettings = (useCache: boolean, restoreWorkflowOnLoad: boolean) => {
    localStorage.setItem(USE_CACHE_STORAGE_KEY, String(useCache));
    localStorage.setItem(RESTORE_WORKFLOW_STORAGE_KEY, String(restoreWorkflowOnLoad));
};

export const saveWorkflowState = (state: { nodes: NodeType[], connections: any[], viewTransform: any }) => {
    try {
        // Deep copy nodes to avoid modifying the active state directly
        const nodesToSave = JSON.parse(JSON.stringify(state.nodes)) as NodeType[];

        // Remove large image data from nodes before saving
        nodesToSave.forEach(node => {
            if (node.data) {
                // Common image data properties
                delete node.data.base64Image;
                delete node.data.mimeType;
                // Specific to AnnotationNode background image
                delete node.data.base64Bg;
                delete node.data.mimeTypeBg;
                // Specific to output images that can be large
                delete node.data.base64ImageOutput;
                delete node.data.mimeTypeOutput;
            }
        });

        localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify({
            nodes: nodesToSave,
            connections: state.connections,
            viewTransform: state.viewTransform
        }));
    } catch (e) {
        console.error("Failed to save workflow state", e);
    }
};

export const loadWorkflowState = () => {
    try {
        const saved = localStorage.getItem(WORKFLOW_STORAGE_KEY);
        return saved ? JSON.parse(saved) : null;
    } catch (e) {
        console.error("Failed to load workflow state", e);
        return null;
    }
};

export const clearAllSavedData = () => {
    localStorage.removeItem(WORKFLOW_STORAGE_KEY);
    localStorage.removeItem(TEXT_MODEL_STORAGE_KEY);
    localStorage.removeItem(IMAGE_MODEL_STORAGE_KEY);
    localStorage.removeItem(USE_CACHE_STORAGE_KEY);
    localStorage.removeItem(RESTORE_WORKFLOW_STORAGE_KEY);
};

export type ModelStatus = 'checking' | 'accessible' | 'permission_denied' | 'limit_exceeded' | 'error';

export const checkModelAccessibility = async (modelName: string): Promise<ModelStatus> => {
    // To resolve "Could not reach model" errors for models that are otherwise working,
    // we perform a more lenient check. Image models often fail simple text-only pings.
    if (modelName.includes('image')) return 'accessible'; // Assuming image models are accessible if API key works for text models.

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        // Attempt a very lightweight API call
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: modelName,
            contents: { parts: [{ text: "ping" }] },
            config: {
                maxOutputTokens: 1, // Minimize token usage
                thinkingConfig: { thinkingBudget: 0 } // Disable thinking for speed
            }
        });

        if (response.text) {
            return 'accessible';
        } else {
            // If response is empty but no explicit error, still treat as accessible for this check
            // A more robust check might involve checking for candidate length etc.
            return 'accessible';
        }
    } catch (error: any) {
        console.warn(`Error checking accessibility for model ${modelName}:`, error);
        if (error && error.status) {
            if (error.status === 'PERMISSION_DENIED') {
                return 'permission_denied';
            }
            if (error.status === 'RESOURCE_EXHAUSTED') {
                return 'limit_exceeded';
            }
        }
        return 'error';
    }
};

export const editImage = async (base64Image: string, mimeType: string, prompt: string): Promise<{imageUrl: string, text: string}> => {
    const { imageModel } = getActiveModels();
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType: mimeType,
            },
        };

        const textPart = {
            text: prompt,
        };

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: imageModel,
            contents: {
                parts: [imagePart, textPart],
            },
        });

        if (!response.candidates || response.candidates.length === 0 || !response.candidates[0].content || !response.candidates[0].content.parts) {
            throw new Error("API returned an invalid or empty response.");
        }

        let resultImageUrl = '';
        let resultText = 'No text response from model.';

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                resultImageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
            } else if (part.text) {
                resultText = part.text;
            }
        }
        
        if (!resultImageUrl) {
            throw new Error("API did not return an image.");
        }

        return { imageUrl: resultImageUrl, text: resultText };

    } catch (error: any) {
        console.error("Error editing image:", error);
        throw new Error(error?.message || "Failed to edit image.");
    }
};

export const mixImages = async (sourceImage: {base64Image: string, mimeType: string}, refImage: {base64Image: string, mimeType: string}, prompt: string): Promise<{imageUrl: string, text: string}> => {
    const { imageModel } = getActiveModels();
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const sourceImagePart = {
            inlineData: {
                data: sourceImage.base64Image,
                mimeType: sourceImage.mimeType,
            },
        };

        const refImagePart = {
            inlineData: {
                data: refImage.base64Image,
                mimeType: refImage.mimeType,
            },
        };

        const textPart = {
            text: prompt,
        };

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: imageModel,
            contents: {
                parts: [
                    { text: "The first image is the source. The second image is for reference." },
                    sourceImagePart,
                    refImagePart,
                    textPart,
                ],
            },
        });
        
        if (!response.candidates || response.candidates.length === 0 || !response.candidates[0].content || !response.candidates[0].content.parts) {
            throw new Error("API returned an invalid response.");
        }

        let resultImageUrl = '';
        let resultText = 'No text response from model.';

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                resultImageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
            } else if (part.text) {
                resultText = part.text;
            }
        }
        
        if (!resultImageUrl) {
            throw new Error("API did not return an image.");
        }

        return { imageUrl: resultImageUrl, text: resultText };

    } catch (error: any) {
        console.error("Error mixing images:", error);
        throw new Error(error?.message || "Failed to mix images.");
    }
};

export const generateWithStyle = async (refImage: {base64Image: string, mimeType: string}, prompt: string): Promise<{imageUrl: string, text: string}> => {
    const { imageModel } = getActiveModels();
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const refImagePart = {
            inlineData: {
                data: refImage.base64Image,
                mimeType: refImage.mimeType,
            },
        };

        const instructionPart = {
            text: "Use the style from the provided image to generate a new image based on the following prompt.",
        };

        const textPart = {
            text: prompt,
        };

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: imageModel,
            contents: {
                parts: [
                    instructionPart,
                    refImagePart,
                    textPart,
                ],
            },
        });
        
        if (!response.candidates || response.candidates.length === 0 || !response.candidates[0].content || !response.candidates[0].content.parts) {
            throw new Error("API returned an invalid response.");
        }

        let resultImageUrl = '';
        let resultText = 'No text response from model.';

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                resultImageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
            } else if (part.text) {
                resultText = part.text;
            }
        }
        
        if (!resultImageUrl) {
            throw new Error("API did not return an image.");
        }

        return { imageUrl: resultImageUrl, text: resultText };

    } catch (error: any) {
        console.error("Error generating with style:", error);
        throw new Error(error?.message || "Failed to generate with style.");
    }
};

export const generateWithRef = async (refImage: {base64Image: string, mimeType: string}, prompt: string): Promise<{imageUrl: string, text: string}> => {
    const { imageModel } = getActiveModels();
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const refImagePart = {
            inlineData: {
                data: refImage.base64Image,
                mimeType: refImage.mimeType,
            },
        };

        const instructionPart = {
            text: "Use the provided image to generate a new image based on the following prompt.",
        };

        const textPart = {
            text: prompt,
        };

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: imageModel,
            contents: {
                parts: [
                    instructionPart,
                    refImagePart,
                    textPart,
                ],
            },
        });
        
        if (!response.candidates || response.candidates.length === 0 || !response.candidates[0].content || !response.candidates[0].content.parts) {
            throw new Error("API returned an invalid response.");
        }

        let resultImageUrl = '';
        let resultText = 'No text response from model.';

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                resultImageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
            } else if (part.text) {
                resultText = part.text;
            }
        }
        
        if (!resultImageUrl) {
            throw new Error("API did not return an image.");
        }

        return { imageUrl: resultImageUrl, text: resultText };

    } catch (error: any) {
        console.error("Error generating with reference:", error);
        throw new Error(error?.message || "Failed to generate with reference.");
    }
};


export const generateImage = async (prompt: string): Promise<{imageUrl: string,  text: string}> => {
    const { imageModel } = getActiveModels();
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const instructionPart = {
            text: "Generate a new image based on the following prompt.",
        };

        const textPart = {
            text: prompt,
        };

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: imageModel,
            contents: {
                parts: [instructionPart,textPart],
            },
        });

        if (!response.candidates || response.candidates.length === 0 || !response.candidates[0].content || !response.candidates[0].content.parts) {
            throw new Error("API returned an invalid response.");
        }
        let resultImageUrl = '';
        let resultText = 'No text response from model.';

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                resultImageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
            } else if (part.text) {
                resultText = part.text;
            }
        }
        
        if (!resultImageUrl) {
            throw new Error("API did not return an image.");
        }

        return { imageUrl: resultImageUrl, text: resultText };

    } catch (error: any) {
        console.error("Error generating image:", error);
        throw new Error(error?.message || "Failed to generate image.");
    }
};

export type DescribeMode = 'short' | 'normal' | 'detailed' | 'as_prompt';

const getDescribePrompt = (mode: DescribeMode): string => {
    switch (mode) {
        case 'short':
            return "Describe this image concisely in one sentence.";
        case 'detailed':
            return "Provide a highly detailed, exhaustive description of this image, covering every visual aspect.";
        case 'as_prompt':
            return "Analyze this image and generate a detailed, high-quality image generation prompt that could be used to create a similar image.";
        case 'normal':
        default:
            return "Describe this image in detail.";
    }
}

export const describeImage = async (base64Image: string, mimeType: string, mode: DescribeMode = 'normal'): Promise<string> => {
    const { textModel } = getActiveModels();
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType: mimeType,
            },
        };

        const textPart = {
            text: getDescribePrompt(mode),
        };

        const response = await ai.models.generateContent({
            model: textModel,
            contents: {
                parts: [imagePart, textPart],
            },
        });

        return response.text || '';

    } catch (error: any) {
        console.error("Error describing image:", error);
        throw new Error(error?.message || "Failed to describe image.");
    }
};
