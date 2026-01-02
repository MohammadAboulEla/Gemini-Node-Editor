import React from 'react';
import { Node as NodeType, NodeType as EnumNodeType } from '../types';
import { ImageIcon, TextIcon, MagicWandIcon, EyeIcon, StitchIcon, DescribeIcon, ResizeIcon, SwatchIcon } from './icons';
import { NodeContentProps } from './nodes/types';
import Tooltip from './Tooltip';

import { ImageLoaderNode } from './nodes/ImageLoaderNode';
import { PromptNode } from './nodes/PromptNode';
import { ImageGeneratorNode } from './nodes/ImageGeneratorNode';
import { PreviewNode } from './nodes/PreviewNode';
import { ImageStitcherNode } from './nodes/ImageStitcherNode';
import { ImageDescriberNode } from './nodes/ImageDescriberNode';
import { SolidColorNode } from './nodes/SolidColorNode';

interface NodeProps {
    node: NodeType;
    isSelected: boolean;
    onMouseDown: (e: React.MouseEvent<HTMLDivElement>, nodeId: string) => void;
    onResizeMouseDown: (e: React.MouseEvent<HTMLDivElement>, nodeId: string) => void;
    onPortMouseDown: (e: React.MouseEvent<HTMLDivElement>, nodeId: string, portId: string) => void;
    setPortRef: (nodeId: string, portId: string, el: HTMLDivElement | null) => void;
    updateNodeData: (nodeId: string, data: Record<string, any>) => void;
    updateNode: (nodeId: string, updates: Partial<NodeType>) => void;
}

const NodeContent: React.FC<NodeContentProps> = (props) => {
    switch (props.node.type) {
        case EnumNodeType.ImageLoader:
            return <ImageLoaderNode {...props} />;
        case EnumNodeType.Prompt:
            return <PromptNode {...props} />;
        case EnumNodeType.ImageGenerator:
            return <ImageGeneratorNode {...props} />;
        case EnumNodeType.Preview:
            return <PreviewNode {...props} />;
        case EnumNodeType.ImageStitcher:
            return <ImageStitcherNode {...props} />;
        case EnumNodeType.ImageDescriber:
            return <ImageDescriberNode {...props} />;
        case EnumNodeType.SolidColor:
            return <SolidColorNode {...props} />;
        default:
            return null;
    }
};

const ICONS: Record<EnumNodeType, React.FC<{className?: string}>> = {
    [EnumNodeType.ImageLoader]: ImageIcon,
    [EnumNodeType.Prompt]: TextIcon,
    [EnumNodeType.ImageGenerator]: MagicWandIcon,
    [EnumNodeType.ImageStitcher]: StitchIcon,
    [EnumNodeType.ImageDescriber]: DescribeIcon,
    [EnumNodeType.Preview]: EyeIcon,
    [EnumNodeType.SolidColor]: SwatchIcon,
}

const Node: React.FC<NodeProps> = ({ node, isSelected, onMouseDown, onResizeMouseDown, onPortMouseDown, setPortRef, updateNodeData, updateNode }) => {
    const Icon = ICONS[node.type];
    
    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

    return (
        <div
            className={`absolute bg-slate-800 border-2 rounded-lg shadow-xl flex flex-col transition-colors ${isSelected ? 'border-cyan-500' : 'border-slate-700'}`}
            style={{
                left: node.position.x,
                top: node.position.y,
                width: node.width ? `${node.width}px` : undefined,
                height: node.height ? `${node.height}px` : undefined,
            }}
        >
            <div
                className="bg-slate-900 p-2 rounded-t-md cursor-grab active:cursor-grabbing flex items-center gap-2 flex-shrink-0"
                onMouseDown={(e) => onMouseDown(e, node.id)}
            >
                <Icon className="w-4 h-4 text-cyan-400"/>
                <h3 className="font-bold text-sm select-none">{node.title}</h3>
            </div>
            
            <div className="flex-grow min-h-0">
                <NodeContent node={node} updateNodeData={updateNodeData} updateNode={updateNode} />
            </div>

            {/* Input Ports */}
            {node.inputs.map((port, index) => {
                const portLabel = port.label || `Input: ${capitalize(port.dataType)}`;
                return (
                    <div
                        key={port.id}
                        className="absolute -left-2.5 top-1/2 -translate-y-1/2"
                        style={{ top: `${20 + (100 - 40) / (node.inputs.length + 1) * (index + 1)}%` }}
                    >
                        <Tooltip content={portLabel} placement="right">
                            <div
                                ref={(el) => setPortRef(node.id, port.id, el)}
                                onMouseDown={(e) => { e.stopPropagation(); }} // Prevent node drag
                                className="w-5 h-5 rounded-full bg-slate-600 border-2 border-slate-400 hover:bg-cyan-500 cursor-crosshair"
                                aria-label={portLabel}
                            ></div>
                        </Tooltip>
                    </div>
                );
            })}

            {/* Output Ports */}
            {node.outputs.map((port, index) => {
                const portLabel = port.label || `Output: ${capitalize(port.dataType)}`;
                return (
                    <div
                        key={port.id}
                        className="absolute -right-2.5 top-1/2 -translate-y-1/2"
                        style={{ top: `${20 + (100 - 40) / (node.outputs.length + 1) * (index + 1)}%` }}
                    >
                        <Tooltip content={portLabel} placement="left">
                            <div
                                ref={(el) => setPortRef(node.id, port.id, el)}
                                onMouseDown={(e) => { e.stopPropagation(); onPortMouseDown(e, node.id, port.id); }}
                                className="w-5 h-5 rounded-full bg-slate-600 border-2 border-slate-400 hover:bg-cyan-500 cursor-crosshair"
                                aria-label={portLabel}
                            ></div>
                        </Tooltip>
                    </div>
                );
            })}

            {node.resizable !== false && (
                <div
                    className="absolute -bottom-1 -right-1 w-4 h-4 cursor-se-resize text-slate-600 hover:text-cyan-500 transition-colors"
                    onMouseDown={(e) => onResizeMouseDown(e, node.id)}
                    aria-label={`Resize ${node.title}`}
                    role="button"
                >
                    <ResizeIcon className="w-full h-full" />
                </div>
            )}
        </div>
    );
};

export default Node;