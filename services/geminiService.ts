import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Default models
const DEFAULT_TEXT_MODEL = 'gemini-3-flash-preview';
const DEFAULT_IMAGE_MODEL = 'gemini-2.5-flash-image';

export const getActiveModels = () => {
    return {
        textModel: localStorage.getItem('gemini_node_text_model') || DEFAULT_TEXT_MODEL,
        imageModel: localStorage.getItem('gemini_node_image_model') || DEFAULT_IMAGE_MODEL
    };
};

export const setActiveModels = (textModel: string, imageModel: string) => {
    localStorage.setItem('gemini_node_text_model', textModel);
    localStorage.setItem('gemini_node_image_model', imageModel);
};

export const getEngineSettings = () => {
    return {
        useCache: localStorage.getItem('gemini_node_use_cache') === 'true' // Default is false (regenerate)
    };
};

export const setEngineSettings = (useCache: boolean) => {
    localStorage.setItem('gemini_node_use_cache', String(useCache));
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
            throw new Error("API returned an invalid or empty response. This could be due to content safety filters.");
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

    } catch (error) {
        console.error("Error editing image with Gemini API:", error);
        throw new Error("Failed to edit image. Please check the console for details.");
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
            throw new Error("API returned an invalid or empty response. This could be due to content safety filters.");
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

    } catch (error) {
        console.error("Error mixing images with Gemini API:", error);
        throw new Error("Failed to mix images. Please check the console for details.");
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
            throw new Error("API returned an invalid or empty response. This could be due to content safety filters.");
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

    } catch (error) {
        console.error("Error generating with style using Gemini API:", error);
        throw new Error("Failed to generate with style. Please check the console for details.");
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
            throw new Error("API returned an invalid or empty response. This could be due to content safety filters.");
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

    } catch (error) {
        console.error("Error generating with reference using Gemini API:", error);
        throw new Error("Failed to generate with reference. Please check the console for details.");
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
            throw new Error("API returned an invalid or empty response. This could be due to content safety filters.");
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

    } catch (error) {
        console.error("Error generating image with Gemini API:", error);
        throw new Error("Failed to generate image. Please check the console for details.");
    }
};

export type DescribeMode = 'short' | 'normal' | 'detailed' | 'as_prompt';

const getDescribePrompt = (mode: DescribeMode): string => {
    switch (mode) {
        case 'short':
            return "Describe this image concisely in one sentence.";
        case 'detailed':
            return "Provide a highly detailed, exhaustive description of this image, covering every visual aspect like subjects, background, colors, lighting, composition, and artistic style.";
        case 'as_prompt':
            return "Analyze this image and generate a detailed, high-quality image generation prompt that could be used to create a similar image. The prompt should be a single block of text and focus on concrete visual details: subject, appearance, clothing, actions, environment, lighting, colors, and art style (e.g., 'photorealistic', 'fantasy art', 'anime').";
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

        // The property .text returns string | undefined
        return response.text || '';

    } catch (error) {
        console.error("Error describing image with Gemini API:", error);
        throw new Error("Failed to describe image. Please check the console for details.");
    }
};