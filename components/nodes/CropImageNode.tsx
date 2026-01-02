import React from 'react';
import { NodeContentProps } from './types';

export const CropImageNode: React.FC<NodeContentProps> = ({ node, updateNodeData }) => {
    const { aspectRatio = '1:1', direction = 'center', status, error } = node.data;

    return (
        <div className="p-2 space-y-3">
             <div className="w-full text-center p-1.5 bg-slate-900 rounded-md">
                {status === 'loading' && <p className="text-xs text-cyan-400">Cropping...</p>}
                {status === 'error' && <p className="text-red-400 text-xs truncate" title={error}>{error}</p>}
                {status === 'success' && <p className="text-xs text-green-400">Success</p>}
                {(!status || status === 'idle') && <p className="text-xs text-slate-500">Ready</p>}
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

            <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Direction</label>
                <select
                    value={direction}
                    onChange={(e) => updateNodeData(node.id, { direction: e.target.value })}
                    className="w-full p-1.5 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                >
                    <option value="center">Center</option>
                    <option value="top">Top</option>
                    <option value="bottom">Bottom</option>
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                </select>
            </div>
        </div>
    );
};