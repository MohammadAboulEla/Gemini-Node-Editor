import React from 'react';
import { NodeContentProps } from './types';

export const PromptNode: React.FC<NodeContentProps> = ({ node, updateNodeData }) => {
    return (
        <div className="p-2 h-full">
            <textarea
                className="w-full h-full p-2 bg-slate-900 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm resize-none"
                placeholder="Enter your prompt here..."
                value={node.data.text || ''}
                onChange={(e) => updateNodeData(node.id, { text: e.target.value })}
            />
        </div>
    );
};