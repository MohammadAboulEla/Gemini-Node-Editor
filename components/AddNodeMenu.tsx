import React, { useState, useEffect, useRef } from 'react';
import { NodeType as EnumNodeType } from '../types';
import { ImageIcon, TextIcon, MagicWandIcon, EyeIcon, StitchIcon, DescribeIcon } from './icons';
import createNode from '../nodeFactory';

interface AddNodeMenuProps {
    position: { x: number; y: number };
    onSelect: (nodeType: EnumNodeType) => void;
    onClose: () => void;
    sourceDataType?: 'image' | 'text' | 'any';
}

const NODE_OPTIONS = [
    { type: EnumNodeType.ImageLoader, title: 'Reference Image', icon: ImageIcon },
    { type: EnumNodeType.Prompt, title: 'Prompt', icon: TextIcon },
    { type: EnumNodeType.ImageGenerator, title: 'Gemini Image', icon: MagicWandIcon },
    { type: EnumNodeType.ImageStitcher, title: 'Stitch Images', icon: StitchIcon },
    { type: EnumNodeType.ImageDescriber, title: 'Describe Image', icon: DescribeIcon },
    { type: EnumNodeType.Preview, title: 'Result Preview', icon: EyeIcon },
];

const AddNodeMenu: React.FC<AddNodeMenuProps> = ({ position, onSelect, onClose, sourceDataType }) => {
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
            if (tempNode.inputs.length === 0) {
                return false; // Cannot connect to a node with no inputs
            }
            if (sourceDataType === 'any') {
                return true; // Source is generic, allow connecting to any node with an input
            }
            // Check if the temp node has a compatible input port
            return tempNode.inputs.some(inputPort =>
                inputPort.dataType === sourceDataType || inputPort.dataType === 'any'
            );
        });


    return (
        <div
            ref={menuRef}
            className="absolute bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-64 z-50 flex flex-col"
            style={{ top: position.y, left: position.x }}
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
            <ul className="max-h-60 overflow-y-auto">
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