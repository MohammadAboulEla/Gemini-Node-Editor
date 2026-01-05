import React from 'react';
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
    };

    const currentMode = node.data.mode || 'generate';

    return (
        <div className="p-2 space-y-2">
            <div className="w-full text-center p-2 bg-slate-900 rounded-md">
                <p className="text-sm font-semibold text-slate-400">Gemini Image</p>
                {node.data.status === 'loading' && <p className="text-xs text-cyan-400 mt-1">Processing...</p>}
                {node.data.status === 'error' && <p className="text-red-400 text-xs mt-1">{node.data.error}</p>}
                {node.data.status === 'success' && <p className="text-xs text-green-400 mt-1">Completed</p>}
                {(!node.data.status || node.data.status === 'idle') && <p className="text-xs text-slate-500 mt-1">Ready to run</p>}
            </div>
             <div>
                <div className="flex items-center justify-between mb-1">
                    <label htmlFor={`gemini-mode-${node.id}`} className="text-xs font-semibold text-slate-400">Mode</label>
                    <Tooltip content={MODE_DESCRIPTIONS[currentMode]} placement="top">
                        <span className="text-slate-500 hover:text-cyan-400 cursor-help transition-colors">
                            <InfoCircleIcon className="w-3.5 h-3.5" />
                        </span>
                    </Tooltip>
                </div>
                <select
                    id={`gemini-mode-${node.id}`}
                    value={currentMode}
                    onChange={handleModeChange}
                    className="w-full p-1.5 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                >
                    <option value="edit">Edit</option>
                    <option value="generate">Generate</option>
                    <option value="style">Style</option>
                    <option value="mix">Mix</option>
                    <option value="reference">Reference</option>
                </select>
            </div>
        </div>
    );
};