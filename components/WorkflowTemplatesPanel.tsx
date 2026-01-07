import React, { useRef, useEffect } from 'react';
import { NodeType as EnumNodeType, Node as NodeType, Connection as ConnectionType } from '../types';
import { TemplateIcon } from './icons';

export interface WorkflowTemplate {
    id: string;
    title: string;
    description: string;
    nodes: NodeType[];
    connections: ConnectionType[];
}

const TEMPLATES: WorkflowTemplate[] = [
    {
        id: 'simple-generate',
        title: 'Simple Image Generation',
        description: 'Generate an image from scratch using a text prompt and optional styles.',
        nodes: [
            {
                id: 'gen-styler', type: EnumNodeType.PromptStyler, position: { x: 50, y: 150 }, title: 'Prompt Styler',
                width: 256, minWidth: 256, height: 280, minHeight: 280,
                inputs: [], 
                outputs: [{ id: 'styler-output', type: 'output', dataType: 'text' }], 
                data: { 
                    userPrompt: 'A cute cat.', 
                    selectedFile: 'Art', 
                    selectedStyleName: 'none' 
                }
            },
            {
                id: 'gen-node', type: EnumNodeType.ImageGenerator, position: { x: 350, y: 150 }, title: 'Gemini Engine',
                width: 256, resizable: false,
                inputs: [{ id: 'prompt-input', type: 'input', dataType: 'text', label: 'Prompt' }],
                outputs: [{ id: 'result-output', type: 'output', dataType: 'any' }],
                data: { status: 'idle', mode: 'generate' }
            },
            {
                id: 'gen-prev', type: EnumNodeType.Preview, position: { x: 650, y: 100 }, title: 'Result Preview',
                width: 400, height: 400, minWidth: 256, minHeight: 220,
                inputs: [{ id: 'result-input', type: 'input', dataType: 'any' }],
                outputs: [], data: {}
            }
        ],
        connections: [
            { id: 'gc1', fromNodeId: 'gen-styler', fromPortId: 'styler-output', toNodeId: 'gen-node', toPortId: 'prompt-input' },
            { id: 'gc2', fromNodeId: 'gen-node', fromPortId: 'result-output', toNodeId: 'gen-prev', toPortId: 'result-input' }
        ]
    },
    {
        id: 'standard-edit',
        title: 'Standard Image Edit',
        description: 'The standard workflow for modifying existing images with Gemini.',
        nodes: [
            {
                id: 'node-1', type: EnumNodeType.ImageLoader, position: { x: 20, y: 140 }, title: 'Load Image',
                width: 256, height: 220, minWidth: 256, minHeight: 220,
                inputs: [], outputs: [{ id: 'image-output', type: 'output', dataType: 'image' }], data: {}
            },
            {
                id: 'node-2', type: EnumNodeType.Prompt, position: { x: 20, y: 370 }, title: 'Prompt',
                width: 256, minWidth: 256, minHeight: 100,
                inputs: [], outputs: [{ id: 'prompt-output', type: 'output', dataType: 'text' }], data: { text: 'Add a small red dragon sitting on the character\'s shoulder.' }
            },
            {
                id: 'node-3', type: EnumNodeType.ImageGenerator, position: { x: 310, y: 250 }, title: 'Gemini Engine',
                width: 256, resizable: false,
                inputs: [
                    { id: 'image-input', type: 'input', dataType: 'image' },
                    { id: 'prompt-input', type: 'input', dataType: 'text' }
                ],
                outputs: [{ id: 'result-output', type: 'output', dataType: 'any' }],
                data: { status: 'idle', mode: 'edit' }
            },
            {
                id: 'node-4', type: EnumNodeType.Preview, position: { x: 600, y: 100 }, title: 'Result Preview',
                width: 456, height: 420, minWidth: 256, minHeight: 220,
                inputs: [{ id: 'result-input', type: 'input', dataType: 'any' }],
                outputs: [], data: {}
            }
        ],
        connections: [
            { id: 'conn-1', fromNodeId: 'node-1', fromPortId: 'image-output', toNodeId: 'node-3', toPortId: 'image-input' },
            { id: 'conn-2', fromNodeId: 'node-2', fromPortId: 'prompt-output', toNodeId: 'node-3', toPortId: 'prompt-input' },
            { id: 'conn-3', fromNodeId: 'node-3', fromPortId: 'result-output', toNodeId: 'node-4', toPortId: 'result-input' },
        ]
    },
    {
        id: 'match-style',
        title: 'Match Image Style',
        description: 'Use a reference image to transfer its artistic style to a new generation.',
        nodes: [
            {
                id: 'style-ref', type: EnumNodeType.ImageLoader, position: { x: 50, y: 100 }, title: 'Reference Style',
                width: 256, height: 220, inputs: [], outputs: [{ id: 'image-output', type: 'output', dataType: 'image' }], data: {}
            },
            {
                id: 'style-prompt', type: EnumNodeType.Prompt, position: { x: 50, y: 350 }, title: 'Subject Prompt',
                width: 256, height: 120, inputs: [], outputs: [{ id: 'prompt-output', type: 'output', dataType: 'text' }], data: { text: 'A peaceful forest with a hidden cottage.' }
            },
            {
                id: 'style-gen', type: EnumNodeType.ImageGenerator, position: { x: 350, y: 200 }, title: 'Gemini Engine',
                width: 256, resizable: false, 
                inputs: [
                    { id: 'ref-image-input', type: 'input', dataType: 'image', label: 'Reference Image' },
                    { id: 'prompt-input', type: 'input', dataType: 'text', label: 'Prompt' }
                ],
                outputs: [{ id: 'result-output', type: 'output', dataType: 'any' }], data: { status: 'idle', mode: 'style' }
            },
            {
                id: 'style-prev', type: EnumNodeType.Preview, position: { x: 650, y: 150 }, title: 'Styled Result',
                width: 400, height: 400, inputs: [{ id: 'result-input', type: 'input', dataType: 'any' }], outputs: [], data: {}
            }
        ],
        connections: [
            { id: 'sc1', fromNodeId: 'style-ref', fromPortId: 'image-output', toNodeId: 'style-gen', toPortId: 'ref-image-input' },
            { id: 'sc2', fromNodeId: 'style-prompt', fromPortId: 'prompt-output', toNodeId: 'style-gen', toPortId: 'prompt-input' },
            { id: 'sc3', fromNodeId: 'style-gen', fromPortId: 'result-output', toNodeId: 'style-prev', toPortId: 'result-input' }
        ]
    },
    {
        id: 'mix-images',
        title: 'Mix Two Images',
        description: 'Blend a source image with a reference image guided by a prompt.',
        nodes: [
            {
                id: 'mix-src', type: EnumNodeType.ImageLoader, position: { x: 50, y: 50 }, title: 'Source Subject',
                width: 256, height: 220, inputs: [], outputs: [{ id: 'image-output', type: 'output', dataType: 'image' }], data: {}
            },
            {
                id: 'mix-ref', type: EnumNodeType.ImageLoader, position: { x: 50, y: 280 }, title: 'Reference/Context',
                width: 256, height: 220, inputs: [], outputs: [{ id: 'image-output', type: 'output', dataType: 'image' }], data: {}
            },
            {
                id: 'mix-prompt', type: EnumNodeType.Prompt, position: { x: 50, y: 510 }, title: 'Mixing Instructions',
                width: 256, height: 120, inputs: [], outputs: [{ id: 'prompt-output', type: 'output', dataType: 'text' }], data: { text: 'Place the object from the first image into the environment of the second image with matching lighting.' }
            },
            {
                id: 'mix-gen', type: EnumNodeType.ImageGenerator, position: { x: 400, y: 250 }, title: 'Gemini Engine',
                width: 256, resizable: false, 
                inputs: [
                    { id: 'image-input', type: 'input', dataType: 'image', label: 'Source Image' },
                    { id: 'ref-image-input', type: 'input', dataType: 'image', label: 'Reference Image' },
                    { id: 'prompt-input', type: 'input', dataType: 'text', label: 'Prompt' }
                ],
                outputs: [{ id: 'result-output', type: 'output', dataType: 'any' }], data: { status: 'idle', mode: 'mix' }
            },
            {
                id: 'mix-prev', type: EnumNodeType.Preview, position: { x: 750, y: 200 }, title: 'Mixed Result',
                width: 450, height: 450, inputs: [{ id: 'result-input', type: 'input', dataType: 'any' }], outputs: [], data: {}
            }
        ],
        connections: [
            { id: 'mc1', fromNodeId: 'mix-src', fromPortId: 'image-output', toNodeId: 'mix-gen', toPortId: 'image-input' },
            { id: 'mc2', fromNodeId: 'mix-ref', fromPortId: 'image-output', toNodeId: 'mix-gen', toPortId: 'ref-image-input' },
            { id: 'mc3', fromNodeId: 'mix-prompt', fromPortId: 'prompt-output', toNodeId: 'mix-gen', toPortId: 'prompt-input' },
            { id: 'mc4', fromNodeId: 'mix-gen', fromPortId: 'result-output', toNodeId: 'mix-prev', toPortId: 'result-input' }
        ]
    },
    {
        id: 'product-backdrop',
        title: 'Product Studio',
        description: 'Replace backgrounds with a solid color and regenerate the scene.',
        nodes: [
            {
                id: 'bg-color', type: EnumNodeType.SolidColor, position: { x: 20, y: 50 }, title: 'Background Color',
                width: 256, height: 180, inputs: [], outputs: [{ id: 'image-output', type: 'output', dataType: 'image' }], data: { color: '#ffffff', aspectRatio: '1:1' }
            },
            {
                id: 'prod-prompt', type: EnumNodeType.Prompt, position: { x: 20, y: 280 }, title: 'Product Prompt',
                width: 256, height: 120, inputs: [], outputs: [{ id: 'prompt-output', type: 'output', dataType: 'text' }], data: { text: 'A professional photo of a coffee mug sitting on this surface with soft shadows.' }
            },
            {
                id: 'prod-gen', type: EnumNodeType.ImageGenerator, position: { x: 350, y: 150 }, title: 'Gemini Engine',
                width: 256, resizable: false, inputs: [{ id: 'image-input', type: 'input', dataType: 'image' }, { id: 'prompt-input', type: 'input', dataType: 'text' }],
                outputs: [{ id: 'result-output', type: 'output', dataType: 'any' }], data: { status: 'idle', mode: 'edit' }
            },
            {
                id: 'prod-prev', type: EnumNodeType.Preview, position: { x: 650, y: 50 }, title: 'Studio Preview',
                width: 400, height: 400, inputs: [{ id: 'result-input', type: 'input', dataType: 'any' }], outputs: [], data: {}
            }
        ],
        connections: [
            { id: 'c1', fromNodeId: 'bg-color', fromPortId: 'image-output', toNodeId: 'prod-gen', toPortId: 'image-input' },
            { id: 'c2', fromNodeId: 'prod-prompt', fromPortId: 'prompt-output', toNodeId: 'prod-gen', toPortId: 'prompt-input' },
            { id: 'c3', fromNodeId: 'prod-gen', fromPortId: 'result-output', toNodeId: 'prod-prev', toPortId: 'result-input' }
        ]
    },
    {
        id: 'image-describer',
        title: 'Visual Describer',
        description: 'Analyze image contents and get detailed descriptions.',
        nodes: [
            {
                id: 'node-1', type: EnumNodeType.ImageLoader, position: { x: 50, y: 150 }, title: 'Load Image',
                width: 256, height: 220, minWidth: 256, minHeight: 220,
                inputs: [], outputs: [{ id: 'image-output', type: 'output', dataType: 'image' }], data: {}
            },
            {
                id: 'node-2', type: EnumNodeType.ImageDescriber, position: { x: 350, y: 150 }, title: 'Describe Image',
                width: 256, height: 200, minHeight: 180,
                inputs: [{ id: 'image-input', type: 'input', dataType: 'image' }],
                outputs: [{ id: 'text-output', type: 'output', dataType: 'text' }],
                data: { status: 'idle', describeMode: 'detailed' }
            },
            {
                id: 'node-3', type: EnumNodeType.Preview, position: { x: 650, y: 150 }, title: 'Result Preview',
                width: 400, height: 400, minWidth: 256, minHeight: 220,
                inputs: [{ id: 'result-input', type: 'input', dataType: 'any' }],
                outputs: [], data: {}
            }
        ],
        connections: [
            { id: 'conn-1', fromNodeId: 'node-1', fromPortId: 'image-output', toNodeId: 'node-2', toPortId: 'image-input' },
            { id: 'conn-2', fromNodeId: 'node-2', fromPortId: 'text-output', toNodeId: 'node-3', toPortId: 'result-input' },
        ]
    },
    {
        id: 'reimagine',
        title: 'Image Reimagination',
        description: 'Analyze an image to extract its "soul" as a prompt, then generate a completely new interpretation.',
        nodes: [
            {
                id: 'ri-load', type: EnumNodeType.ImageLoader, position: { x: 20, y: 200 }, title: 'Target Image',
                width: 256, height: 220, inputs: [], 
                outputs: [{ id: 'image-output', type: 'output', dataType: 'image' }], data: {}
            },
            {
                id: 'ri-desc', type: EnumNodeType.ImageDescriber, position: { x: 300, y: 200 }, title: 'Prompt Extractor',
                width: 280, height: 220, 
                inputs: [{ id: 'image-input', type: 'input', dataType: 'image' }],
                outputs: [{ id: 'text-output', type: 'output', dataType: 'text' }],
                data: { describeMode: 'as_prompt' }
            },
            {
                id: 'ri-engine', type: EnumNodeType.ImageGenerator, position: { x: 620, y: 200 }, title: 'Gemini Engine',
                width: 256, resizable: false,
                inputs: [{ id: 'prompt-input', type: 'input', dataType: 'text', label: 'Prompt' }],
                outputs: [{ id: 'result-output', type: 'output', dataType: 'any' }],
                data: { status: 'idle', mode: 'generate' }
            },
            {
                id: 'ri-prev', type: EnumNodeType.Preview, position: { x: 920, y: 100 }, title: 'New Interpretation',
                width: 450, height: 450, inputs: [{ id: 'result-input', type: 'input', dataType: 'any' }],
                outputs: [], data: {}
            }
        ],
        connections: [
            { id: 'ric1', fromNodeId: 'ri-load', fromPortId: 'image-output', toNodeId: 'ri-desc', toPortId: 'image-input' },
            { id: 'ric2', fromNodeId: 'ri-desc', fromPortId: 'text-output', toNodeId: 'ri-engine', toPortId: 'prompt-input' },
            { id: 'ric3', fromNodeId: 'ri-engine', fromPortId: 'result-output', toNodeId: 'ri-prev', toPortId: 'result-input' }
        ]
    },
    {
        id: 'pose-guided',
        title: 'Pose-Guided Character',
        description: 'Control the exact posture of your character using the Pose Guide node and Reference mode.',
        nodes: [
            {
                id: 'pose-skeleton', type: EnumNodeType.Pose, position: { x: 50, y: 100 }, title: 'Pose Guide',
                width: 320, height: 420, inputs: [], 
                outputs: [{ id: 'image-output', type: 'output', dataType: 'image' }], 
                data: {
                    joints: {
                        head: { x: 50, y: 15 }, neck: { x: 50, y: 25 }, leftShoulder: { x: 35, y: 35 }, rightShoulder: { x: 65, y: 35 },
                        leftElbow: { x: 30, y: 55 }, rightElbow: { x: 70, y: 55 }, leftWrist: { x: 25, y: 75 }, rightWrist: { x: 75, y: 75 },
                        torso: { x: 50, y: 60 }, leftHip: { x: 40, y: 65 }, rightHip: { x: 60, y: 65 }, leftKnee: { x: 35, y: 80 },
                        rightKnee: { x: 65, y: 80 }, leftAnkle: { x: 30, y: 95 }, rightAnkle: { x: 70, y: 95 }
                    }
                }
            },
            {
                id: 'pose-prompt', type: EnumNodeType.Prompt, position: { x: 50, y: 550 }, title: 'Character Prompt',
                width: 320, height: 120, inputs: [], outputs: [{ id: 'prompt-output', type: 'output', dataType: 'text' }],
                data: { text: 'In this pose generate a new cyberpunk street samurai, with neon lights reflecting off chrome armor.' }
            },
            {
                id: 'pose-engine', type: EnumNodeType.ImageGenerator, position: { x: 450, y: 250 }, title: 'Gemini Engine',
                width: 256, resizable: false,
                inputs: [
                    { id: 'ref-image-input', type: 'input', dataType: 'image', label: 'Reference Image' },
                    { id: 'prompt-input', type: 'input', dataType: 'text', label: 'Prompt' }
                ],
                outputs: [{ id: 'result-output', type: 'output', dataType: 'any' }],
                data: { status: 'idle', mode: 'reference' }
            },
            {
                id: 'pose-prev', type: EnumNodeType.Preview, position: { x: 750, y: 150 }, title: 'Result Preview',
                width: 450, height: 450, inputs: [{ id: 'result-input', type: 'input', dataType: 'any' }],
                outputs: [], data: {}
            }
        ],
        connections: [
            { id: 'pc1', fromNodeId: 'pose-skeleton', fromPortId: 'image-output', toNodeId: 'pose-engine', toPortId: 'ref-image-input' },
            { id: 'pc2', fromNodeId: 'pose-prompt', fromPortId: 'prompt-output', toNodeId: 'pose-engine', toPortId: 'prompt-input' },
            { id: 'pc3', fromNodeId: 'pose-engine', fromPortId: 'result-output', toNodeId: 'pose-prev', toPortId: 'result-input' }
        ]
    },
    {
        id: 'sketch-masterpiece',
        title: 'Sketch to Masterpiece',
        description: 'Draw a basic concept and let the engine turn it into a high-quality digital painting.',
        nodes: [
            {
                id: 'sk-draw', type: EnumNodeType.Sketch, position: { x: 50, y: 100 }, title: 'Hand Sketch',
                width: 320, height: 400, inputs: [], 
                outputs: [{ id: 'image-output', type: 'output', dataType: 'image' }], 
                data: { color: '#ffffff', brushSize: 8 }
            },
            {
                id: 'sk-prompt', type: EnumNodeType.Prompt, position: { x: 50, y: 530 }, title: 'Rendering Style',
                width: 320, height: 120, inputs: [], outputs: [{ id: 'prompt-output', type: 'output', dataType: 'text' }],
                data: { text: 'Transform this hand-drawn sketch into a hyper-realistic 3D render.' }
            },
            {
                id: 'sk-engine', type: EnumNodeType.ImageGenerator, position: { x: 450, y: 250 }, title: 'Gemini Engine',
                width: 256, resizable: false,
                inputs: [
                    { id: 'image-input', type: 'input', dataType: 'image', label: 'Image' },
                    { id: 'prompt-input', type: 'input', dataType: 'text', label: 'Prompt' }
                ],
                outputs: [{ id: 'result-output', type: 'output', dataType: 'any' }],
                data: { status: 'idle', mode: 'edit' }
            },
            {
                id: 'sk-prev', type: EnumNodeType.Preview, position: { x: 750, y: 150 }, title: 'Final Painting',
                width: 450, height: 450, inputs: [{ id: 'result-input', type: 'input', dataType: 'any' }],
                outputs: [], data: {}
            }
        ],
        connections: [
            { id: 'skc1', fromNodeId: 'sk-draw', fromPortId: 'image-output', toNodeId: 'sk-engine', toPortId: 'image-input' },
            { id: 'skc2', fromNodeId: 'sk-prompt', fromPortId: 'prompt-output', toNodeId: 'sk-engine', toPortId: 'prompt-input' },
            { id: 'skc3', fromNodeId: 'sk-engine', fromPortId: 'result-output', toNodeId: 'sk-prev', toPortId: 'result-input' }
        ]
    },
    {
        id: 'aspect-ratio-fix',
        title: 'Image Padding',
        description: 'Pad images to square or 9:16 for social media.',
        nodes: [
            {
                id: 'pad-load', type: EnumNodeType.ImageLoader, position: { x: 50, y: 150 }, title: 'Source Image',
                width: 256, height: 220, inputs: [], outputs: [{ id: 'image-output', type: 'output', dataType: 'image' }], data: {}
            },
            {
                id: 'pad-node', type: EnumNodeType.Padding, position: { x: 350, y: 150 }, title: 'Add Padding',
                width: 256, height: 260, inputs: [{ id: 'image-input', type: 'input', dataType: 'image' }],
                outputs: [{ id: 'image-output', type: 'output', dataType: 'image' }], data: { aspectRatio: '1:1', color: '#000000', direction: 'center' }
            },
            {
                id: 'pad-prev', type: EnumNodeType.Preview, position: { x: 650, y: 100 }, title: 'Final Post',
                width: 400, height: 400, inputs: [{ id: 'result-input', type: 'input', dataType: 'any' }], outputs: [], data: {}
            }
        ],
        connections: [
            { id: 'pc1', fromNodeId: 'pad-load', fromPortId: 'image-output', toNodeId: 'pad-node', toPortId: 'image-input' },
            { id: 'pc2', fromNodeId: 'pad-node', fromPortId: 'image-output', toNodeId: 'pad-prev', toPortId: 'result-input' }
        ]
    }
];

interface WorkflowTemplatesPanelProps {
    onClose: () => void;
    onLoadTemplate: (template: WorkflowTemplate) => void;
}

const WorkflowTemplatesPanel: React.FC<WorkflowTemplatesPanelProps> = ({ onClose, onLoadTemplate }) => {
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
            onClose();
        }
    };

    const handleSelect = (template: WorkflowTemplate) => {
        onLoadTemplate(template);
        onClose();
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 z-[10000] flex justify-end"
            onClick={handleBackdropClick}
            aria-modal="true"
            role="dialog"
        >
            <div
                ref={panelRef}
                className="w-full max-w-sm h-full bg-slate-800 border-l border-slate-700 flex flex-col shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-slate-700">
                    <div className="flex items-center gap-2">
                        <TemplateIcon className="w-5 h-5 text-cyan-400" />
                        <h2 className="text-lg font-semibold">Templates Library</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-slate-700 transition-colors"
                        aria-label="Close templates panel"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>

                <div className="flex-grow p-4 overflow-y-auto space-y-4">
                    {TEMPLATES.map((template) => (
                        <button
                            key={template.id}
                            onClick={() => handleSelect(template)}
                            className="w-full text-left p-4 bg-slate-900 border-2 border-slate-700 rounded-lg hover:border-cyan-500 hover:bg-slate-900/80 transition-all group outline-none focus:border-cyan-500"
                        >
                            <h3 className="font-bold text-cyan-400 mb-1 group-hover:text-cyan-300">{template.title}</h3>
                            <p className="text-xs text-slate-400 mb-3 leading-relaxed">{template.description}</p>
                            <div className="flex flex-wrap gap-1">
                                {Array.from(new Set(template.nodes.map(n => n.title.split(' ')[0]))).map((typeLabel, i) => (
                                    <span key={i} className="px-1.5 py-0.5 bg-slate-800 text-[10px] text-slate-500 rounded uppercase border border-slate-700">
                                        {typeLabel}
                                    </span>
                                ))}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default WorkflowTemplatesPanel;