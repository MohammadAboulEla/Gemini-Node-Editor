import { useState, useCallback } from 'react';
import { Node as NodeType, Connection as ConnectionType, NodeType as EnumNodeType } from '../types';
import { editImage, generateImage, describeImage, DescribeMode, mixImages, generateWithStyle, generateWithRef } from '../services/geminiService';
import { getStylesForFile } from '../services/styleService';

const normalizeImageInput = (input: any): { base64Image: string; mimeType: string } | null => {
    if (!input) return null;
    if (input.base64Image && input.mimeType) {
        return { base64Image: input.base64Image, mimeType: input.mimeType };
    }
    if (input.imageUrl && typeof input.imageUrl === 'string' && input.imageUrl.startsWith('data:')) {
        const parts = input.imageUrl.split(',');
        if (parts.length !== 2) return null;
        const header = parts[0];
        const data = parts[1];
        const mimeMatch = header.match(/data:(.*);base64/);
        if (!mimeMatch || mimeMatch.length < 2) return null;
        return { base64Image: data, mimeType: mimeMatch[1] };
    }
    return null;
}

const JOINT_CONNECTIONS: [string, string, string][] = [
    ['head', 'neck', '#ff0000'],
    ['neck', 'leftShoulder', '#00ff00'],
    ['neck', 'rightShoulder', '#00ff00'],
    ['leftShoulder', 'leftElbow', '#00ff00'],
    ['rightShoulder', 'rightElbow', '#00ff00'],
    ['leftElbow', 'leftWrist', '#00ff00'],
    ['rightElbow', 'rightWrist', '#00ff00'],
    ['neck', 'torso', '#0000ff'],
    ['torso', 'leftHip', '#ffff00'],
    ['torso', 'rightHip', '#ffff00'],
    ['leftHip', 'leftKnee', '#ffff00'],
    ['rightHip', 'rightKnee', '#ffff00'],
    ['leftKnee', 'leftAnkle', '#ffff00'],
    ['rightKnee', 'rightAnkle', '#ffff00']
];

export const useWorkflow = (
    nodes: NodeType[],
    connections: ConnectionType[],
    updateNodeData: (nodeId: string, data: Record<string, any>) => void,
    addToHistory: (imageUrl: string) => void
) => {
    const [isWorkflowRunning, setIsWorkflowRunning] = useState(false);

    const runWorkflow = useCallback(async () => {
        setIsWorkflowRunning(true);
    
        // 1. Topological Sort
        const inDegree: Record<string, number> = {};
        const adjList: Record<string, string[]> = {};
        for (const node of nodes) {
            inDegree[node.id] = 0;
            adjList[node.id] = [];
        }
        for (const conn of connections) {
            inDegree[conn.toNodeId]++;
            adjList[conn.fromNodeId].push(conn.toNodeId);
        }
    
        const queue = nodes.filter(n => inDegree[n.id] === 0);
        const sortedNodes: NodeType[] = [];
        while (queue.length > 0) {
            const node = queue.shift()!;
            sortedNodes.push(node);
            for (const neighborId of adjList[node.id]) {
                inDegree[neighborId]--;
                if (inDegree[neighborId] === 0) {
                    const neighborNode = nodes.find(n => n.id === neighborId);
                    if (neighborNode) queue.push(neighborNode);
                }
            }
        }
    
        // 2. Execute nodes in order
        const nodeOutputs: Record<string, Record<string, any>> = {};
    
        for (const node of sortedNodes) {
            // Gather inputs for the current node
            const inputs: Record<string, any> = {};
            const inputConnections = connections.filter(c => c.toNodeId === node.id);
            for (const conn of inputConnections) {
                const sourceOutput = nodeOutputs[conn.fromNodeId]?.[conn.fromPortId];
                if (sourceOutput) {
                    inputs[conn.toPortId] = sourceOutput;
                }
            }
    
            // Execute node logic
            updateNodeData(node.id, { status: 'loading', error: null });
            try {
                let output: Record<string, any> = {};
                switch (node.type) {
                    case EnumNodeType.ImageLoader:
                    case EnumNodeType.Prompt:
                        output = { [node.outputs[0].id]: node.data };
                        break;
                    
                    case EnumNodeType.PromptStyler:
                        const { userPrompt, selectedFile, selectedStyleName } = node.data;
                        const availableStyles = getStylesForFile(selectedFile);
                        
                        let stylizedText = userPrompt;
                        
                        if (selectedStyleName === 'random') {
                            const filteredStyles = availableStyles.filter(s => 
                                s.name.toLowerCase() !== 'none' && 
                                s.name.toLowerCase() !== 'random'
                            );
                            if (filteredStyles.length > 0) {
                                const randomIndex = Math.floor(Math.random() * filteredStyles.length);
                                const style = filteredStyles[randomIndex];
                                if (style.prompt && style.prompt.includes('{prompt}')) {
                                    stylizedText = style.prompt.replace('{prompt}', userPrompt);
                                } else if (style.prompt) {
                                    stylizedText = `${userPrompt}, ${style.prompt}`;
                                }
                            }
                        } else if (selectedStyleName !== 'none') {
                            const selectedStyle = availableStyles.find(s => s.name === selectedStyleName);
                            if (selectedStyle && selectedStyle.prompt) {
                                if (selectedStyle.prompt.includes('{prompt}')) {
                                    stylizedText = selectedStyle.prompt.replace('{prompt}', userPrompt);
                                } else {
                                    stylizedText = `${userPrompt}, ${selectedStyle.prompt}`;
                                }
                            }
                        }
                        
                        const stylerResult = { text: stylizedText };
                        updateNodeData(node.id, stylerResult);
                        output = { 'styler-output': stylerResult };
                        break;
    
                    case EnumNodeType.SolidColor:
                        const { color = '#06b6d4', aspectRatio = '1:1' } = node.data;
                        const [wRatio, hRatio] = aspectRatio.split(':').map(Number);
                        const baseSize = 512;
                        const width = wRatio >= hRatio ? baseSize : (baseSize * wRatio) / hRatio;
                        const height = hRatio >= wRatio ? baseSize : (baseSize * hRatio) / wRatio;
                        const canvas = document.createElement('canvas');
                        canvas.width = width; canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        if (!ctx) throw new Error("Canvas context failed.");
                        ctx.fillStyle = color; ctx.fillRect(0, 0, width, height);
                        const dataUrl = canvas.toDataURL('image/png');
                        const [header, base64] = dataUrl.split(',');
                        const mime = header.match(/data:(.*);base64/)?.[1] || 'image/png';
                        const solidResult = { base64Image: base64, mimeType: mime };
                        updateNodeData(node.id, solidResult);
                        output = { 'image-output': solidResult };
                        break;

                    case EnumNodeType.Pose:
                        const joints = node.data.joints;
                        const poseCanvas = document.createElement('canvas');
                        poseCanvas.width = 1024; poseCanvas.height = 1024;
                        const pCtx = poseCanvas.getContext('2d');
                        if (!pCtx) throw new Error("Canvas context failed.");
                        
                        pCtx.fillStyle = 'black';
                        pCtx.fillRect(0, 0, 1024, 1024);
                        pCtx.lineWidth = 8;
                        pCtx.lineCap = 'round';

                        JOINT_CONNECTIONS.forEach(([from, to, color]) => {
                            const jFrom = joints[from];
                            const jTo = joints[to];
                            if (jFrom && jTo) {
                                pCtx.beginPath();
                                pCtx.strokeStyle = color;
                                pCtx.moveTo(jFrom.x * 10.24, jFrom.y * 10.24);
                                pCtx.lineTo(jTo.x * 10.24, jTo.y * 10.24);
                                pCtx.stroke();
                            }
                        });
                        
                        // Draw joint dots
                        pCtx.fillStyle = 'white';
                        Object.values(joints).forEach((j: any) => {
                            pCtx.beginPath();
                            pCtx.arc(j.x * 10.24, j.y * 10.24, 5, 0, Math.PI * 2);
                            pCtx.fill();
                        });

                        const pDataUrl = poseCanvas.toDataURL('image/png');
                        const [pHeader, pBase64] = pDataUrl.split(',');
                        const poseResult = { base64Image: pBase64, mimeType: 'image/png' };
                        updateNodeData(node.id, poseResult);
                        output = { 'image-output': poseResult };
                        break;

                    case EnumNodeType.CropImage:
                        const cropImgData = normalizeImageInput(inputs['image-input']);
                        if (!cropImgData) throw new Error("Missing image input.");
                        const { aspectRatio: cropRatio = '1:1', direction: cropDir = 'center' } = node.data;
                        const [crW, crH] = cropRatio.split(':').map(Number);
                        const targetRatio = crW / crH;
                        const imgToCrop = new Image();
                        await new Promise((res, rej) => {
                            imgToCrop.onload = res; imgToCrop.onerror = rej;
                            imgToCrop.src = `data:${cropImgData.mimeType};base64,${cropImgData.base64Image}`;
                        });
                        const srcW = imgToCrop.width; const srcH = imgToCrop.height; const srcRatio = srcW / srcH;
                        let cropW, cropH;
                        if (srcRatio > targetRatio) { cropH = srcH; cropW = srcH * targetRatio; } else { cropW = srcW; cropH = srcW / targetRatio; }
                        let srcX = (srcW - cropW) / 2; let srcY = (srcH - cropH) / 2;
                        if (cropDir === 'top') srcY = 0; if (cropDir === 'bottom') srcY = srcH - cropH;
                        if (cropDir === 'left') srcX = 0; if (cropDir === 'right') srcX = srcW - cropW;
                        const cropCanvas = document.createElement('canvas');
                        cropCanvas.width = cropW; cropCanvas.height = cropH;
                        const cropCtx = cropCanvas.getContext('2d');
                        if (!cropCtx) throw new Error("Canvas context failed.");
                        cropCtx.drawImage(imgToCrop, srcX, srcY, cropW, cropH, 0, 0, cropW, cropH);
                        const cropDataUrl = cropCanvas.toDataURL('image/png');
                        const [cropHeader, cropBase64] = cropDataUrl.split(',');
                        const cropResult = { base64Image: cropBase64, mimeType: 'image/png' };
                        updateNodeData(node.id, cropResult);
                        output = { 'image-output': cropResult };
                        break;

                    case EnumNodeType.Padding:
                        const padImgData = normalizeImageInput(inputs['image-input']);
                        if (!padImgData) throw new Error("Missing image input.");
                        const { aspectRatio: padRatioStr = '1:1', direction: padDir = 'center', color: padColor = '#000000' } = node.data;
                        const [pR_W, pR_H] = padRatioStr.split(':').map(Number);
                        const padTargetRatio = pR_W / pR_H;
                        const imgToPad = new Image();
                        await new Promise((res, rej) => {
                            imgToPad.onload = res; imgToPad.onerror = rej;
                            imgToPad.src = `data:${padImgData.mimeType};base64,${padImgData.base64Image}`;
                        });
                        const pSrcW = imgToPad.width; const pSrcH = imgToPad.height; const pSrcRatio = pSrcW / pSrcH;
                        let targetW, targetH;
                        if (pSrcRatio > padTargetRatio) { targetW = pSrcW; targetH = pSrcW / padTargetRatio; } else { targetH = pSrcH; targetW = pSrcH * padTargetRatio; }
                        let destX = (targetW - pSrcW) / 2; let destY = (targetH - pSrcH) / 2;
                        if (padDir === 'top') destY = 0; if (padDir === 'bottom') destY = targetH - pSrcH;
                        if (padDir === 'left') destX = 0; if (padDir === 'right') destX = targetW - pSrcW;
                        const padCanvas = document.createElement('canvas');
                        padCanvas.width = targetW; padCanvas.height = targetH;
                        const padCtx = padCanvas.getContext('2d');
                        if (!padCtx) throw new Error("Canvas context failed.");
                        padCtx.fillStyle = padColor; padCtx.fillRect(0, 0, targetW, targetH);
                        padCtx.drawImage(imgToPad, destX, destY);
                        const padDataUrl = padCanvas.toDataURL('image/png');
                        const [padHeader, padBase64] = padDataUrl.split(',');
                        const padResult = { base64Image: padBase64, mimeType: 'image/png' };
                        updateNodeData(node.id, padResult);
                        output = { 'image-output': padResult };
                        break;

                    case EnumNodeType.ImageGenerator:
                        const mode = node.data.mode || 'edit';
                        const promptInput = inputs['prompt-input'];
                        if (!promptInput?.text) throw new Error("Missing prompt input.");
                        if (mode === 'edit') {
                            const imageInput = normalizeImageInput(inputs['image-input']);
                            if (!imageInput) throw new Error("Missing or invalid image input for edit mode.");
                            const cacheKey = `edit-${promptInput.text}-${imageInput.base64Image}`;
                            const cachedResult = node.data.cache?.[cacheKey];
                            if (cachedResult) { output = { 'result-output': cachedResult }; } else {
                                const result = await editImage(imageInput.base64Image, imageInput.mimeType, promptInput.text);
                                const newCache = { ...(node.data.cache || {}), [cacheKey]: result };
                                updateNodeData(node.id, { cache: newCache });
                                output = { 'result-output': result };
                            }
                        } else if (mode === 'mix') {
                            const sourceImageInput = normalizeImageInput(inputs['image-input']);
                            const refImageInput = normalizeImageInput(inputs['ref-image-input']);
                            if (!sourceImageInput || !refImageInput) throw new Error("Missing or invalid image inputs for mix mode.");
                            const cacheKey = `mix-${promptInput.text}-${sourceImageInput.base64Image}-${refImageInput.base64Image}`;
                            const cachedResult = node.data.cache?.[cacheKey];
                            if (cachedResult) { output = { 'result-output': cachedResult }; } else {
                                const result = await mixImages(sourceImageInput, refImageInput, promptInput.text);
                                const newCache = { ...(node.data.cache || {}), [cacheKey]: result };
                                updateNodeData(node.id, { cache: newCache });
                                output = { 'result-output': result };
                            }
                        } else if (mode === 'style') {
                            const refImageInput = normalizeImageInput(inputs['ref-image-input']);
                            if (!refImageInput) throw new Error("Missing or invalid reference image input for style mode.");
                            const cacheKey = `style-${promptInput.text}-${refImageInput.base64Image}`;
                            const cachedResult = node.data.cache?.[cacheKey];
                            if (cachedResult) { output = { 'result-output': cachedResult }; } else {
                                const result = await generateWithStyle(refImageInput, promptInput.text);
                                const newCache = { ...(node.data.cache || {}), [cacheKey]: result };
                                updateNodeData(node.id, { cache: newCache });
                                output = { 'result-output': result };
                            }
                        } else if (mode === 'reference') {
                            const refImageInput = normalizeImageInput(inputs['ref-image-input']);
                            if (!refImageInput) throw new Error("Missing or invalid reference image input for reference mode.");
                            const cacheKey = `ref-${promptInput.text}-${refImageInput.base64Image}`;
                            const cachedResult = node.data.cache?.[cacheKey];
                            if (cachedResult) { output = { 'result-output': cachedResult }; } else {
                                const result = await generateWithRef(refImageInput, promptInput.text);
                                const newCache = { ...(node.data.cache || {}), [cacheKey]: result };
                                updateNodeData(node.id, { cache: newCache });
                                output = { 'result-output': result };
                            }
                        } else { 
                            const cacheKey = `generate-${promptInput.text}`;
                            const cachedResult = node.data.cache?.[cacheKey];
                            if (cachedResult) { output = { 'result-output': cachedResult }; } else {
                                const result = await generateImage(promptInput.text);
                                const newCache = { ...(node.data.cache || {}), [cacheKey]: result };
                                updateNodeData(node.id, { cache: newCache });
                                output = { 'result-output': result };
                            }
                        }
                        break;
                    
                    case EnumNodeType.ImageStitcher:
                        const img1Data = normalizeImageInput(inputs['image-input-1']);
                        const img2Data = normalizeImageInput(inputs['image-input-2']);
                        if (!img1Data || !img2Data) throw new Error("Missing image inputs.");
                        const img1 = new Image(); const img2 = new Image();
                        const p1 = new Promise((res, rej) => { img1.onload = res; img1.onerror = rej; });
                        const p2 = new Promise((res, rej) => { img2.onload = res; img2.onerror = rej; });
                        img1.src = `data:${img1Data.mimeType};base64,${img1Data.base64Image}`;
                        img2.src = `data:${img2Data.mimeType};base64,${img2Data.base64Image}`;
                        await Promise.all([p1, p2]);
                        const canvasS = document.createElement('canvas'); const ctxS = canvasS.getContext('2d');
                        if (!ctxS) throw new Error("Canvas context failed.");
                        if (node.data.stitchMode === 'horizontal') {
                            canvasS.width = img1.width + img2.width; canvasS.height = Math.max(img1.height, img2.height);
                            ctxS.drawImage(img1, 0, 0); ctxS.drawImage(img2, img1.width, 0);
                        } else {
                            canvasS.width = Math.max(img1.width, img2.width); canvasS.height = img1.height + img2.height;
                            ctxS.drawImage(img1, 0, 0); ctxS.drawImage(img2, 0, img1.height);
                        }
                        const url = canvasS.toDataURL('image/png');
                        const [headerS, base64S] = url.split(',');
                        const stitchResult = { base64Image: base64S, mimeType: 'image/png' };
                        updateNodeData(node.id, stitchResult);
                        output = { 'image-output': stitchResult };
                        break;
                    
                    case EnumNodeType.ImageDescriber:
                        const descImageInput = normalizeImageInput(inputs['image-input']);
                        if (!descImageInput) throw new Error("Missing image input.");
                        const describeMode = node.data.describeMode || 'normal' as DescribeMode;
                        const descCacheKey = descImageInput.base64Image + describeMode;
                        const descCachedResult = node.data.cache?.[descCacheKey];
                        let descriptionText: string;
                        if (descCachedResult) { descriptionText = descCachedResult; } else {
                            descriptionText = await describeImage(descImageInput.base64Image, descImageInput.mimeType, describeMode);
                            const newCache = { ...(node.data.cache || {}), [descCacheKey]: descriptionText };
                            updateNodeData(node.id, { cache: newCache });
                        }
                        updateNodeData(node.id, { text: descriptionText });
                        output = { 'text-output': { text: descriptionText } };
                        break;

                    case EnumNodeType.Preview:
                        const previewInput = inputs['result-input'] || inputs['styler-output'];
                        if (previewInput) {
                            const newPreviewData: { imageUrl: string | null; text: string | null } = { imageUrl: null, text: null };
                            if (previewInput.imageUrl) { newPreviewData.imageUrl = previewInput.imageUrl; } 
                            else if (previewInput.base64Image && previewInput.mimeType) { newPreviewData.imageUrl = `data:${previewInput.mimeType};base64,${previewInput.base64Image}`; }
                            if (previewInput.text) { newPreviewData.text = previewInput.text; }
                            updateNodeData(node.id, newPreviewData);
                        } else { updateNodeData(node.id, { imageUrl: null, text: null }); }
                        break;
                }
                nodeOutputs[node.id] = output;
                updateNodeData(node.id, { status: 'success' });
                Object.values(output).forEach(portOutput => {
                    if (portOutput && typeof portOutput === 'object') {
                        let imageUrl: string | null = null;
                        if (portOutput.imageUrl && typeof portOutput.imageUrl === 'string') { imageUrl = portOutput.imageUrl; } 
                        else if (portOutput.base64Image && portOutput.mimeType) { imageUrl = `data:${portOutput.mimeType};base64,${portOutput.base64Image}`; }
                        if (imageUrl) addToHistory(imageUrl);
                    }
                });
            } catch (error) {
                const message = error instanceof Error ? error.message : "Unknown error";
                updateNodeData(node.id, { status: 'error', error: message });
                break;
            }
        }
        setIsWorkflowRunning(false);
    }, [nodes, connections, updateNodeData, addToHistory]);

    return { isWorkflowRunning, runWorkflow };
};