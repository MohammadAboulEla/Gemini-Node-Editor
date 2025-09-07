import React from 'react';
import { NodeContentProps } from './types';
import { NodePort } from '../../types';

export const ImageGeneratorNode: React.FC<NodeContentProps> = ({ node, updateNode }) => {

    const handleModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newMode = e.target.value;
        // Fix: Explicitly type `newInputs` as `NodePort[]`. TypeScript was inferring the `type` property
        // as a generic `string` instead of the required literal type `'input'`, which is not assignable
        // to the `'input' | 'output'` type in `NodePort`. This caused a type error when calling `updateNode`.
        const newInputs: NodePort[] = newMode === 'generate'
            ? [{ id: 'prompt-input', type: 'input', dataType: 'text' }]
            : [
                { id: 'image-input', type: 'input', dataType: 'image' },
                { id: 'prompt-input', type: 'input', dataType: 'text' },
              ];

        updateNode(node.id, {
            inputs: newInputs,
            data: { ...node.data, mode: newMode }
        });
    };

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
                <label htmlFor={`gemini-mode-${node.id}`} className="text-xs font-semibold text-slate-400 block mb-1">Mode</label>
                <select
                    id={`gemini-mode-${node.id}`}
                    value={node.data.mode || 'edit'}
                    onChange={handleModeChange}
                    className="w-full p-1.5 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                >
                    <option value="edit">Edit</option>
                    <option value="generate">Generate</option>
                </select>
            </div>
        </div>
    );
};
