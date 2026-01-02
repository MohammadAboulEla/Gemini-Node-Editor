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
                minHeight: 160,
            };
        case EnumNodeType.ImageGenerator:
            return {
                ...baseNode,
                title: 'Gemini Image',
                inputs: [
                    { id: 'image-input', type: 'input', dataType: 'image', label: 'Image' },
                    { id: 'prompt-input', type: 'input', dataType: 'text', label: 'Prompt' },
                ],
                outputs: [{ id: 'result-output', type: 'output', dataType: 'any' }],
                data: { status: 'idle', cache: {}, mode: 'edit' },
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
                minHeight: 180,
            };
        case EnumNodeType.SolidColor:
            return {
                ...baseNode,
                title: 'Solid Color',
                inputs: [],
                outputs: [{ id: 'image-output', type: 'output', dataType: 'image' }],
                data: { color: '#06b6d4', aspectRatio: '1:1' },
                height: 180,
                minHeight: 180,
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