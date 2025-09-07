import React from 'react';
import { ImageIcon } from '../icons';
import { NodeContentProps } from './types';

export const ImageLoaderNode: React.FC<NodeContentProps> = ({ node, updateNodeData }) => {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64Image = (event.target?.result as string).split(',')[1];
                updateNodeData(node.id, { base64Image, mimeType: file.type, fileName: file.name });
            };
            reader.readAsDataURL(file);
        }
    };

    const imageUrl = node.data.base64Image && node.data.mimeType
        ? `data:${node.data.mimeType};base64,${node.data.base64Image}`
        : null;

    return (
        <div className="p-2 h-full">
            <label className="cursor-pointer group relative block w-full h-full bg-slate-900 rounded-lg flex items-center justify-center overflow-hidden">
                {imageUrl ? (
                    <>
                        <img src={imageUrl} alt={node.data.fileName || 'Uploaded image'} className="max-w-full max-h-full object-contain" />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white font-semibold">Change Image</span>
                        </div>
                    </>
                ) : (
                    <div className="text-center text-slate-500 border-2 border-slate-600 border-dashed w-full h-full flex flex-col items-center justify-center rounded-lg group-hover:border-cyan-500 group-hover:text-cyan-400 transition-colors">
                        <ImageIcon className="w-10 h-10 mb-2" />
                        <span className="text-sm font-semibold">Upload Image</span>
                    </div>
                )}
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </label>
        </div>
    );
};
