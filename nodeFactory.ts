
import { Node, NodeType as EnumNodeType, Point } from './types';

const createNode = (type: EnumNodeType, position: Point): Node => {
    const baseNode = {
        id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        position,
        type,
        data: {},
        width: 256,
        resizable: true,
        minWidth: 256,
    };

    switch (type) {
        case EnumNodeType.ImageLoader:
            return {
                ...baseNode,
                title: 'Load Image',
                inputs: [],
                outputs: [{ id: 'image-output', type: 'output', dataType: 'image' }],
                height: 220,
                minHeight: 220,
            };
        case EnumNodeType.Prompt:
            return {
                ...baseNode,
                title: 'Prompt',
                inputs: [],
                outputs: [{ id: 'prompt-output', type: 'output', dataType: 'text' }],
            };
        case EnumNodeType.PromptStyler:
            return {
                ...baseNode,
                title: 'Prompt Styler',
                inputs: [],
                outputs: [{ id: 'styler-output', type: 'output', dataType: 'text' }],
                data: { userPrompt: '', selectedFile: 'Basic', selectedStyleName: 'none' },
                height: 250,
                minHeight: 250,
            };
        case EnumNodeType.ImageGenerator:
            return {
                ...baseNode,
                title: 'Gemini Engine',
                inputs: [
                    { id: 'prompt-input', type: 'input', dataType: 'text', label: 'Prompt' },
                ],
                outputs: [{ id: 'result-output', type: 'output', dataType: 'any' }],
                data: { status: 'idle', cache: {}, mode: 'generate' },
                resizable: false,
            };
        case EnumNodeType.ImageStitcher:
            return {
                ...baseNode,
                title: 'Stitch Images',
                inputs: [
                    { id: 'image-input-1', type: 'input', dataType: 'image' },
                    { id: 'image-input-2', type: 'input', dataType: 'image' },
                ],
                outputs: [{ id: 'image-output', type: 'output', dataType: 'image' }],
                data: { stitchMode: 'horizontal' }, // default mode
                height: 180,
                minHeight: 180,
            };
        case EnumNodeType.ImageDescriber:
             return {
                ...baseNode,
                title: 'Describe Image',
                inputs: [{ id: 'image-input', type: 'input', dataType: 'image' }],
                outputs: [{ id: 'text-output', type: 'output', dataType: 'text' }],
                data: { status: 'idle', cache: {}, describeMode: 'normal' },
                height: 180,
                minHeight: 180,
            };
        case EnumNodeType.SolidColor:
            return {
                ...baseNode,
                title: 'Solid Color',
                inputs: [],
                outputs: [{ id: 'image-output', type: 'output', dataType: 'image' }],
                data: { color: '#06b6d4', aspectRatio: '1:1' },
                height: 160,
                minHeight: 160,
            };
        case EnumNodeType.CropImage:
            return {
                ...baseNode,
                title: 'Crop Image',
                inputs: [{ id: 'image-input', type: 'input', dataType: 'image' }],
                outputs: [{ id: 'image-output', type: 'output', dataType: 'image' }],
                data: { aspectRatio: '1:1', direction: 'center' },
                height: 200,
                minHeight: 200,
            };
        case EnumNodeType.Padding:
            return {
                ...baseNode,
                title: 'Add Padding',
                inputs: [{ id: 'image-input', type: 'input', dataType: 'image' }],
                outputs: [{ id: 'image-output', type: 'output', dataType: 'image' }],
                data: { aspectRatio: '1:1', direction: 'center', color: '#000000' },
                height: 260,
                minHeight: 260,
            };
        case EnumNodeType.Pose:
            return {
                ...baseNode,
                title: 'Pose Guide',
                inputs: [],
                outputs: [{ id: 'image-output', type: 'output', dataType: 'image' }],
                width: 320,
                height: 480,
                minWidth: 200,
                minHeight: 300,
                data: {
                    outputMode: 'skeleton',
                    joints: {
                        head: { x: 50, y: 15 },
                        neck: { x: 50, y: 25 },
                        leftShoulder: { x: 40, y: 30 },
                        rightShoulder: { x: 60, y: 30 },
                        leftElbow: { x: 35, y: 45 },
                        rightElbow: { x: 65, y: 45 },
                        leftWrist: { x: 30, y: 60 },
                        rightWrist: { x: 70, y: 60 },
                        torso: { x: 50, y: 55 },
                        leftHip: { x: 45, y: 60 },
                        rightHip: { x: 55, y: 60 },
                        leftKnee: { x: 45, y: 75 },
                        rightKnee: { x: 55, y: 75 },
                        leftAnkle: { x: 45, y: 90 },
                        rightAnkle: { x: 55, y: 90 }
                    }
                }
            };
        case EnumNodeType.Sketch:
            return {
                ...baseNode,
                title: 'Hand Sketch',
                inputs: [],
                outputs: [{ id: 'image-output', type: 'output', dataType: 'image' }],
                width: 320,
                height: 400,
                minWidth: 200,
                minHeight: 250,
                data: { elements: [] }
            };
        case EnumNodeType.Annotation:
            return {
                ...baseNode,
                title: 'Image Annotation',
                inputs: [],
                outputs: [{ id: 'image-output', type: 'output', dataType: 'image' }],
                width: 400,
                height: 500,
                minWidth: 300,
                minHeight: 300,
                data: { elements: [] }
            };
        case EnumNodeType.Preview:
            return {
                ...baseNode,
                title: 'Result Preview',
                inputs: [{ id: 'result-input', type: 'input', dataType: 'any' }],
                outputs: [],
                height: 220,
                minHeight: 220,
            };
        default:
            throw new Error(`Unknown node type: ${type}`);
    }
};

export default createNode;
