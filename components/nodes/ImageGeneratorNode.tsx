import React, { useState, useEffect } from 'react';
import { NodeContentProps } from './types';
import { NodePort } from '../../types';
import Tooltip from '../Tooltip';
import { InfoCircleIcon } from '../icons';

const MODE_DESCRIPTIONS: Record<string, string> = {
    'edit': 'Modify an existing image based on your text prompt.',
    'generate': 'Create a brand new image entirely from a text prompt.',
    'style': 'Use a reference image to define the artistic style of a new generation.',
    'mix': 'Blend the subject of the Source Image with the environment of the Reference Image.',
    'reference': 'Use a reference image to guide the structure and layout of the generation.'
};

export const ImageGeneratorNode: React.FC<NodeContentProps> = ({ node, updateNode }) => {
    const [isFlashing, setIsFlashing] = useState(false);
    const currentMode = node.data.mode || 'generate';

    const handleModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newMode = e.target.value;
        let newInputs: NodePort[];
        
        if (newMode === 'generate') {
            newInputs = [{ id: 'prompt-input', type: 'input', dataType: 'text', label: 'Prompt' }];
        } else if (newMode === 'mix') {
            newInputs = [
                { id: 'image-input', type: 'input', dataType: 'image', label: 'Source Image' },
                { id: 'ref-image-input', type: 'input', dataType: 'image', label: 'Reference Image' },
                { id: 'prompt-input', type: 'input', dataType: 'text', label: 'Prompt' },
            ];
        } else if (newMode === 'style') {
            newInputs = [
                { id: 'ref-image-input', type: 'input', dataType: 'image', label: 'Reference Image' },
                { id: 'prompt-input', type: 'input', dataType: 'text', label: 'Prompt' },
            ];
        } else if (newMode === 'reference') {
            newInputs = [
                { id: 'ref-image-input', type: 'input', dataType: 'image', label: 'Reference Image' },
                { id: 'prompt-input', type: 'input', dataType: 'text', label: 'Prompt' },
            ];
        } else { // 'edit'
            newInputs = [
                { id: 'image-input', type: 'input', dataType: 'image', label: 'Image' },
                { id: 'prompt-input', type: 'input', dataType: 'text', label: 'Prompt' },
            ];
        }

        updateNode(node.id, {
            inputs: newInputs,
            data: { ...node.data, mode: newMode }
        });

        // Trigger flash effect
        setIsFlashing(true);
        setTimeout(() => setIsFlashing(false), 500);
    };

    return (
        <div className="p-2 space-y-3">
            <div className="w-full text-center py-2 bg-slate-900 rounded-md border border-slate-700/50 shadow-inner">
                
                <p className="text-sm font-semibold text-cyan-400">Image Processor</p>
                
                <div className="mt-1 h-4 flex items-center justify-center">
                    {node.data.status === 'loading' && <p className="text-[10px] text-cyan-400 animate-pulse">Processing...</p>}
                    {node.data.status === 'error' && <p className="text-[10px] text-red-400 truncate px-2" title={node.data.error}>{node.data.error}</p>}
                    {node.data.status === 'success' && <p className="text-[10px] text-green-400 font-bold">● Completed</p>}
                    {(!node.data.status || node.data.status === 'idle') && <p className="text-[10px] text-slate-600">Idle</p>}
                </div>
            </div>

            <div>
                <label htmlFor={`gemini-mode-${node.id}`} className="text-[10px] uppercase font-bold text-slate-500 ml-1 mb-1 block">Engine Mode</label>
                <div className="flex items-center gap-2">
                    <select
                        id={`gemini-mode-${node.id}`}
                        value={currentMode}
                        onChange={handleModeChange}
                        className="flex-grow p-1.5 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm transition-all"
                    >
                        <option value="edit">Edit</option>
                        <option value="generate">Generate</option>
                        <option value="style">Style</option>
                        <option value="mix">Mix</option>
                        <option value="reference">Reference</option>
                    </select>
                    
                    <Tooltip content={MODE_DESCRIPTIONS[currentMode]} placement="right">
                        <div className="flex-shrink-0 cursor-help p-1 rounded-full hover:bg-slate-700 transition-colors group">
                            <InfoCircleIcon 
                                className={`w-5 h-5 transition-all duration-300 ${
                                    isFlashing 
                                    ? 'text-cyan-300 filter drop-shadow-[0_0_8px_rgba(103,232,249,1)]' 
                                    : 'text-slate-500 group-hover:text-cyan-400'
                                }`} 
                            />
                        </div>
                    </Tooltip>
                </div>
            </div>
        </div>
    );
};