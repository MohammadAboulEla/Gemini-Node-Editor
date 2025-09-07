import React from 'react';
import { NodeContentProps } from './types';

export const ImageStitcherNode: React.FC<NodeContentProps> = ({ node, updateNodeData }) => {
    const { stitchMode = 'horizontal', base64Image, mimeType, status, error } = node.data;

    const stitchedImageUrl = base64Image && mimeType ? `data:${mimeType};base64,${base64Image}` : null;

    return (
        <div className="p-2 h-full flex flex-col">
            <div className="w-full flex-grow min-h-0 bg-slate-900 rounded-md flex items-center justify-center text-slate-500 text-sm overflow-hidden">
                {status === 'loading' && 'Stitching...'}
                {status === 'error' && <span className="text-red-400 text-xs p-1">{error}</span>}
                {status === 'success' && stitchedImageUrl && (
                     <img src={stitchedImageUrl} alt="Stitched result" className="max-w-full max-h-full object-contain" />
                )}
                {(!status || status === 'idle') && 'Ready to run'}
            </div>
            <div className="flex-shrink-0 mt-2">
                <label htmlFor={`stitch-mode-${node.id}`} className="text-xs font-semibold text-slate-400 block mb-1">Stitch Mode</label>
                <select
                    id={`stitch-mode-${node.id}`}
                    value={stitchMode}
                    onChange={(e) => updateNodeData(node.id, { stitchMode: e.target.value })}
                    className="w-full p-1.5 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                >
                    <option value="horizontal">Side by Side</option>
                    <option value="vertical">Top to Bottom</option>
                </select>
            </div>
        </div>
    );
};
