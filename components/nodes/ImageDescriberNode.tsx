
import React from 'react';
import { NodeContentProps } from './types';

export const ImageDescriberNode: React.FC<NodeContentProps> = ({ node, updateNodeData }) => {
    const { status, error, text, describeMode = 'normal' } = node.data;

    return (
        <div className="p-2 h-full flex flex-col gap-2">
            <div className="w-full flex-grow min-h-0 p-2 bg-slate-900 border border-slate-600 rounded-md text-sm text-slate-300 overflow-y-auto">
                {status === 'loading' && <p className="text-cyan-400">Describing image...</p>}
                {status === 'error' && <p className="text-red-400 break-words">{error}</p>}
                {status === 'success' && <p className="whitespace-pre-wrap break-words">{text}</p>}
                {(!status || status === 'idle') && <p className="text-slate-500">Ready to run</p>}
            </div>
            <div className="flex-shrink-0">
                <label htmlFor={`describe-mode-${node.id}`} className="text-xs font-semibold text-slate-400 block mb-1">Describe Mode</label>
                <select
                    id={`describe-mode-${node.id}`}
                    value={describeMode}
                    onChange={(e) => updateNodeData(node.id, { describeMode: e.target.value })}
                    className="w-full p-1.5 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                >
                    <option value="normal">Normal</option>
                    <option value="short">Short</option>
                    <option value="detailed">Detailed</option>
                    <option value="as_prompt">As a Prompt</option>
                </select>
            </div>
        </div>
    );
};
