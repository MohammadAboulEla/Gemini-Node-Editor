import React, { useRef, useEffect } from 'react';
import { NodeType as EnumNodeType, Node as NodeType, Connection as ConnectionType } from '../types';

export interface WorkflowTemplate {
    id: string;
    title: string;
    description: string;
    nodes: NodeType[];
    connections: ConnectionType[];
}

const TemplateIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
  </svg>
);

const TEMPLATES: WorkflowTemplate[] = [
    {
        id: 'standard-edit',
        title: 'Standard Image Edit (Default)',
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
                inputs: [], outputs: [{ id: 'prompt-output', type: 'output', dataType: 'text' }], data: {}
            },
            {
                id: 'node-3', type: EnumNodeType.ImageGenerator, position: { x: 310, y: 250 }, title: 'Gemini Image',
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
                width: 256, height: 120, inputs: [], outputs: [{ id: 'prompt-output', type: 'output', dataType: 'text' }], data: { text: 'A luxury watch sitting on this background with realistic shadows.' }
            },
            {
                id: 'prod-gen', type: EnumNodeType.ImageGenerator, position: { x: 350, y: 150 }, title: 'Gemini Generator',
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
                id: 'node-3', type: EnumNodeType.Preview, position: { x: 650, y: 150 }, title: 'Analysis Preview',
                width: 300, height: 400, minWidth: 256, minHeight: 220,
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
        id: 'aspect-ratio-fix',
        title: 'Social Media Padding',
        description: 'Pad images to square or 9:16 for social media posts.',
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
        // We close the panel immediately for a faster feel.
        // App.tsx handles the visual "building" process asynchronously.
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