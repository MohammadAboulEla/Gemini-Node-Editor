
import { useState, useCallback } from 'react';
import { Node as NodeType, Connection as ConnectionType, NodeType as EnumNodeType } from '../types';
import { editImage, generateImage, describeImage, DescribeMode } from '../services/geminiService';

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


export const useWorkflow = (
    nodes: NodeType[],
    connections: ConnectionType[],
    updateNodeData: (nodeId: string, data: Record<string, any>) => void
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
    
                    case EnumNodeType.ImageGenerator:
                        const mode = node.data.mode || 'edit';
                        const promptInput = inputs['prompt-input'];

                        if (!promptInput?.text) {
                            throw new Error("Missing prompt input.");
                        }

                        if (mode === 'edit') {
                            const imageInput = inputs['image-input'];
                             if (!imageInput?.base64Image || !imageInput?.mimeType) {
                                throw new Error("Missing image input for edit mode.");
                            }
                            const cacheKey = `edit-${promptInput.text}-${imageInput.base64Image}`;
                            const cachedResult = node.data.cache?.[cacheKey];

                            if (cachedResult) {
                                output = { 'result-output': cachedResult };
                            } else {
                                const result = await editImage(imageInput.base64Image, imageInput.mimeType, promptInput.text);
                                const newCache = { ...(node.data.cache || {}), [cacheKey]: result };
                                updateNodeData(node.id, { cache: newCache });
                                output = { 'result-output': result };
                            }
                        } else { // mode === 'generate'
                            const cacheKey = `generate-${promptInput.text}`;
                            const cachedResult = node.data.cache?.[cacheKey];
                            
                            if (cachedResult) {
                                output = { 'result-output': cachedResult };
                            } else {
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
                        
                        if (!img1Data || !img2Data) {
                            throw new Error("Missing one or both image inputs.");
                        }

                        const img1 = new Image();
                        const img2 = new Image();
                        const p1 = new Promise((res, rej) => { img1.onload = res; img1.onerror = rej; });
                        const p2 = new Promise((res, rej) => { img2.onload = res; img2.onerror = rej; });
                        img1.src = `data:${img1Data.mimeType};base64,${img1Data.base64Image}`;
                        img2.src = `data:${img2Data.mimeType};base64,${img2Data.base64Image}`;
                        await Promise.all([p1, p2]);

                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        if (!ctx) throw new Error("Canvas context failed.");

                        if (node.data.stitchMode === 'horizontal') {
                            canvas.width = img1.width + img2.width;
                            canvas.height = Math.max(img1.height, img2.height);
                            ctx.drawImage(img1, 0, 0);
                            ctx.drawImage(img2, img1.width, 0);
                        } else {
                            canvas.width = Math.max(img1.width, img2.width);
                            canvas.height = img1.height + img2.height;
                            ctx.drawImage(img1, 0, 0);
                            ctx.drawImage(img2, 0, img1.height);
                        }
                        const url = canvas.toDataURL('image/png');
                        const [header, base64] = url.split(',');
                        const newMime = header.match(/data:(.*);base64/)?.[1] || 'image/png';
                        const stitchResult = { base64Image: base64, mimeType: newMime };
                        updateNodeData(node.id, stitchResult);
                        output = { 'image-output': stitchResult };
                        break;
                    
                    case EnumNodeType.ImageDescriber:
                        const descImageInput = normalizeImageInput(inputs['image-input']);
                        if (!descImageInput) {
                            throw new Error("Missing image input.");
                        }

                        const describeMode = node.data.describeMode || 'normal' as DescribeMode;
                        const descCacheKey = descImageInput.base64Image + describeMode;
                        const descCachedResult = node.data.cache?.[descCacheKey];

                        let descriptionText: string;
                        if (descCachedResult) {
                            descriptionText = descCachedResult;
                        } else {
                            descriptionText = await describeImage(descImageInput.base64Image, descImageInput.mimeType, describeMode);
                            const newCache = { ...(node.data.cache || {}), [descCacheKey]: descriptionText };
                            updateNodeData(node.id, { cache: newCache });
                        }
                        
                        updateNodeData(node.id, { text: descriptionText });
                        output = { 'text-output': { text: descriptionText } };
                        break;

                    case EnumNodeType.Preview:
                        const previewInput = inputs['result-input'];
                        if (previewInput) {
                            const newPreviewData: { imageUrl: string | null; text: string | null } = {
                                imageUrl: null,
                                text: null,
                            };
            
                            if (previewInput.imageUrl) {
                                newPreviewData.imageUrl = previewInput.imageUrl;
                            } else if (previewInput.base64Image && previewInput.mimeType) {
                                newPreviewData.imageUrl = `data:${previewInput.mimeType};base64,${previewInput.base64Image}`;
                            }
            
                            if (previewInput.text) {
                                newPreviewData.text = previewInput.text;
                            }
                            updateNodeData(node.id, newPreviewData);
                        } else {
                             updateNodeData(node.id, { imageUrl: null, text: null });
                        }
                        break;
                }
                nodeOutputs[node.id] = output;
                updateNodeData(node.id, { status: 'success' });
            } catch (error) {
                const message = error instanceof Error ? error.message : "Unknown error";
                updateNodeData(node.id, { status: 'error', error: message });
                break; // Stop execution on error
            }
        }
    
        setIsWorkflowRunning(false);
    }, [nodes, connections, updateNodeData]);

    return { isWorkflowRunning, runWorkflow };
};