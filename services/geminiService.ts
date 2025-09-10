
import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const editImage = async (base64Image: string, mimeType: string, prompt: string): Promise<{imageUrl: string, text: string}> => {
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
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: [imagePart, textPart],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
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
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: [
                    { text: "The first image is the source. The second image is for reference." },
                    sourceImagePart,
                    refImagePart,
                    textPart,
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
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
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: [
                    instructionPart,
                    refImagePart,
                    textPart,
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
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


export const generateImage = async (prompt: string): Promise<{imageUrl: string}> => {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/png',
            },
        });

        if (!response.generatedImages || response.generatedImages.length === 0) {
            throw new Error("API did not return an image.");
        }

        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
        return { imageUrl };

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
            model: 'gemini-2.5-flash',
            contents: {
                parts: [imagePart, textPart],
            },
        });

        return response.text;

    } catch (error) {
        console.error("Error describing image with Gemini API:", error);
        throw new Error("Failed to describe image. Please check the console for details.");
    }
};