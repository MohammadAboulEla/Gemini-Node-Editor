
import React, { useCallback } from 'react';
import { NodeContentProps } from './types';
import { UnifiedCanvas } from '../canvas/UnifiedCanvas';
import { ImageIcon } from '../icons';

export const AnnotationNode: React.FC<NodeContentProps> = ({ node, updateNodeData }) => {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64Image = (event.target?.result as string).split(',')[1];
                updateNodeData(node.id, { 
                    base64Bg: base64Image, 
                    mimeTypeBg: file.type, 
                    fileName: file.name,
                    elements: [] // Reset annotations on new image
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const { base64Bg, mimeTypeBg, elements } = node.data;

    if (!base64Bg) {
        return (
            <div className="p-2 h-full">
                <label className="cursor-pointer group relative block w-full h-full bg-slate-900 rounded-lg flex items-center justify-center overflow-hidden border-2 border-slate-700 border-dashed hover:border-cyan-500 transition-colors">
                    <div className="text-center text-slate-500 group-hover:text-cyan-400 transition-colors">
                        <ImageIcon className="w-10 h-10 mb-2 mx-auto" />
                        <span className="text-sm font-semibold">Upload Image to Annotate</span>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
            </div>
        );
    }

    return (
        <div className="p-2 h-full flex flex-col gap-2">
            <div className="flex-grow min-h-0">
                <UnifiedCanvas 
                    nodeId={node.id} 
                    updateNodeData={updateNodeData} 
                    base64Image={base64Bg} 
                    mimeType={mimeTypeBg}
                    initialElements={elements}
                />
            </div>
            <div className="flex justify-between items-center px-1 gap-2">
                <div className="flex items-center gap-2 flex-grow min-w-0">
                    <span className="text-[10px] text-slate-500 truncate max-w-[120px]">{node.data.fileName}</span>
                </div>
                <label className="text-[10px] text-cyan-400 cursor-pointer hover:underline flex-shrink-0">
                    Change Image
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
            </div>
        </div>
    );
};
