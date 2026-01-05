import React from 'react';
import { Node as NodeInstance, NodeType as EnumNodeType } from '../types';
import { ImageIcon, TextIcon, MagicWandIcon, EyeIcon, StitchIcon, DescribeIcon, ResizeIcon, SwatchIcon, ScissorsIcon, PaddingIcon, StarIcon, UserIcon, PencilIcon } from './icons';
import { NodeContentProps } from './nodes/types';
import Tooltip from './Tooltip';

import { ImageLoaderNode } from './nodes/ImageLoaderNode';
import { PromptNode } from './nodes/PromptNode';
import { PromptStylerNode } from './nodes/PromptStylerNode';
import { ImageGeneratorNode } from './nodes/ImageGeneratorNode';
import { PreviewNode } from './nodes/PreviewNode';
import { ImageStitcherNode } from './nodes/ImageStitcherNode';
import { ImageDescriberNode } from './nodes/ImageDescriberNode';
import { SolidColorNode } from './nodes/SolidColorNode';
import { CropImageNode } from './nodes/CropImageNode';
import { PaddingNode } from './nodes/PaddingNode';
import { PoseNode } from './nodes/PoseNode';
import { SketchNode } from './nodes/SketchNode';

interface NodeProps {
    node: NodeInstance;
    isSelected: boolean;
    onMouseDown: (e: React.MouseEvent<HTMLDivElement>, nodeId: string) => void;
    onResizeMouseDown: (e: React.MouseEvent<HTMLDivElement>, nodeId: string) => void;
    onPortMouseDown: (e: React.MouseEvent<HTMLDivElement>, nodeId: string, portId: string) => void;
    onContextMenu: (e: React.MouseEvent<HTMLDivElement>, nodeId: string) => void;
    setPortRef: (nodeId: string, portId: string, el: HTMLDivElement | null) => void;
    updateNodeData: (nodeId: string, data: Record<string, any>) => void;
    updateNode: (nodeId: string, updates: Partial<NodeInstance>) => void;
    deselectAll: () => void;
}

const NodeContent: React.FC<NodeContentProps> = (props) => {
    switch (props.node.type) {
        case EnumNodeType.ImageLoader:
            return <ImageLoaderNode {...props} />;
        case EnumNodeType.Prompt:
            return <PromptNode {...props} />;
        case EnumNodeType.PromptStyler:
            return <PromptStylerNode {...props} />;
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
        case EnumNodeType.CropImage:
            return <CropImageNode {...props} />;
        case EnumNodeType.Padding:
            return <PaddingNode {...props} />;
        case EnumNodeType.Pose:
            return <PoseNode {...props} />;
        case EnumNodeType.Sketch:
            return <SketchNode {...props} />;
        default:
            return null;
    }
};

const ICONS: Record<EnumNodeType, React.FC<{className?: string}>> = {
    [EnumNodeType.ImageLoader]: ImageIcon,
    [EnumNodeType.Prompt]: TextIcon,
    [EnumNodeType.PromptStyler]: StarIcon,
    [EnumNodeType.ImageGenerator]: MagicWandIcon,
    [EnumNodeType.ImageStitcher]: StitchIcon,
    [EnumNodeType.ImageDescriber]: DescribeIcon,
    [EnumNodeType.Preview]: EyeIcon,
    [EnumNodeType.SolidColor]: SwatchIcon,
    [EnumNodeType.CropImage]: ScissorsIcon,
    [EnumNodeType.Padding]: PaddingIcon,
    [EnumNodeType.Pose]: UserIcon,
    [EnumNodeType.Sketch]: PencilIcon,
}

const Node: React.FC<NodeProps> = ({ node, isSelected, onMouseDown, onResizeMouseDown, onPortMouseDown, onContextMenu, setPortRef, updateNodeData, updateNode, deselectAll }) => {
    const Icon = ICONS[node.type] || StarIcon;
    
    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

    const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        const isInteractive = ['TEXTAREA', 'IMG', 'INPUT', 'SELECT', 'CANVAS'].includes(target.tagName) || target.closest('.select-text');
        
        if (isInteractive) {
            return;
        }

        onContextMenu(e, node.id);
    };

    return (
        <div
            className={`absolute bg-slate-800 border-2 rounded-lg shadow-xl flex flex-col transition-colors select-none ${isSelected ? 'border-cyan-500' : 'border-slate-700'}`}
            style={{
                left: node.position.x,
                top: node.position.y,
                width: node.width ? `${node.width}px` : undefined,
                height: node.height ? `${node.height}px` : undefined,
            }}
            onContextMenu={handleContextMenu}
        >
            <div
                className="bg-slate-900 p-2 rounded-t-md cursor-grab active:cursor-grabbing flex items-center gap-2 flex-shrink-0"
                onMouseDown={(e) => onMouseDown(e, node.id)}
            >
                <Icon className="w-4 h-4 text-cyan-400"/>
                <h3 className="font-bold text-sm select-none truncate pr-2" title={node.title}>{node.title}</h3>
            </div>
            
            <div className="flex-grow min-h-0">
                <NodeContent node={node} updateNodeData={updateNodeData} updateNode={updateNode} deselectAll={deselectAll} />
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
                                onMouseDown={(e) => { e.stopPropagation(); }}
                                className="w-3 h-5 rounded-full bg-slate-600 border-2 border-slate-400 hover:bg-cyan-500 cursor-crosshair"
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
                                className="w-3 h-5 rounded-full bg-slate-600 border-2 border-slate-400 hover:bg-cyan-500 cursor-crosshair"
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