import React from 'react';
import { NodeContentProps } from './types';

export const SolidColorNode: React.FC<NodeContentProps> = ({ node, updateNodeData }) => {
    const { color = '#06b6d4', aspectRatio = '1:1' } = node.data;

    return (
        <div className="p-2 space-y-3">
            <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Color</label>
                <div className="flex items-center gap-2">
                    <input
                        type="color"
                        value={color}
                        onChange={(e) => updateNodeData(node.id, { color: e.target.value })}
                        className="w-full h-8 bg-transparent border-none cursor-pointer rounded overflow-hidden"
                    />
                    <span className="text-xs font-mono text-slate-300">{color.toUpperCase()}</span>
                </div>
            </div>
            <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Aspect Ratio</label>
                <select
                    value={aspectRatio}
                    onChange={(e) => updateNodeData(node.id, { aspectRatio: e.target.value })}
                    className="w-full p-1.5 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                >
                    <option value="1:1">1:1 Square</option>
                    <option value="16:9">16:9 Landscape</option>
                    <option value="4:3">4:3 Standard</option>
                    <option value="9:16">9:16 Portrait</option>
                    <option value="3:2">3:2 Classic</option>
                </select>
            </div>
        </div>
    );
};