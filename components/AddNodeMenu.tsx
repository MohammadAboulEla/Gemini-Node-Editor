import React, { useState, useEffect, useRef } from 'react';
import { NodeType as EnumNodeType } from '../types';
import { ImageIcon, TextIcon, MagicWandIcon, EyeIcon, StitchIcon, DescribeIcon, SwatchIcon, ScissorsIcon, PaddingIcon, StarIcon, UserIcon, PencilIcon } from './icons';
import createNode from '../nodeFactory';

interface AddNodeMenuProps {
    position: { x: number; y: number };
    onSelect: (nodeType: EnumNodeType) => void;
    onClose: () => void;
    sourceDataType?: 'image' | 'text' | 'any';
    sourceDirection?: 'input' | 'output';
}

const NODE_OPTIONS = [
    { type: EnumNodeType.ImageLoader, title: 'Load Image', icon: ImageIcon },
    { type: EnumNodeType.ImageGenerator, title: 'Gemini Image', icon: MagicWandIcon },
    { type: EnumNodeType.Prompt, title: 'Prompt', icon: TextIcon },
    { type: EnumNodeType.PromptStyler, title: 'Prompt Styler', icon: StarIcon },
    { type: EnumNodeType.Preview, title: 'Result Preview', icon: EyeIcon },
    { type: EnumNodeType.ImageDescriber, title: 'Describe Image', icon: DescribeIcon },
    { type: EnumNodeType.Sketch, title: 'Hand Sketch', icon: PencilIcon },
    { type: EnumNodeType.ImageStitcher, title: 'Stitch Images', icon: StitchIcon },
    { type: EnumNodeType.Pose, title: 'Pose Guide', icon: UserIcon },
    { type: EnumNodeType.SolidColor, title: 'Solid Color', icon: SwatchIcon },
    { type: EnumNodeType.CropImage, title: 'Crop Image', icon: ScissorsIcon },
    { type: EnumNodeType.Padding, title: 'Add Padding', icon: PaddingIcon },
];

const AddNodeMenu: React.FC<AddNodeMenuProps> = ({ position, onSelect, onClose, sourceDataType, sourceDirection = 'output' }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const menuRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: globalThis.MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);

        inputRef.current?.focus();

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    const baseFilteredNodes = NODE_OPTIONS.filter(node =>
        node.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredNodes = !sourceDataType
        ? baseFilteredNodes
        : baseFilteredNodes.filter(option => {
            const tempNode = createNode(option.type, { x: 0, y: 0 });
            
            if (sourceDirection === 'output') {
                // We dragged from an output, so we need a node with a compatible input
                if (tempNode.inputs.length === 0) return false;
                if (sourceDataType === 'any') return true;
                return tempNode.inputs.some(inputPort =>
                    inputPort.dataType === sourceDataType || inputPort.dataType === 'any'
                );
            } else {
                // We dragged from an input, so we need a node with a compatible output
                if (tempNode.outputs.length === 0) return false;
                if (sourceDataType === 'any') return true;
                return tempNode.outputs.some(outputPort =>
                    outputPort.dataType === sourceDataType || outputPort.dataType === 'any'
                );
            }
        });


    return (
        <div
            ref={menuRef}
            className="absolute bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-64 z-[10002] flex flex-col"
            style={{ top: position.y, left: position.x }}
            onWheel={(e) => e.stopPropagation()}
        >
            <div className="p-2 border-b border-slate-700">
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search nodes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-2 py-1 bg-slate-900 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                />
            </div>
            <ul className="max-h-60 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-600">
                {filteredNodes.length > 0 ? (
                    filteredNodes.map(node => (
                        <li key={node.type}>
                            <button
                                onClick={() => onSelect(node.type)}
                                className="w-full text-left px-3 py-2 hover:bg-slate-700 flex items-center gap-3 transition-colors"
                            >
                                <node.icon className="w-5 h-5 text-slate-400" />
                                <span className="text-sm">{node.title}</span>
                            </button>
                        </li>
                    ))
                ) : (
                    <li className="px-3 py-2 text-sm text-slate-500">No compatible nodes found.</li>
                )}
            </ul>
        </div>
    );
};

export default AddNodeMenu;