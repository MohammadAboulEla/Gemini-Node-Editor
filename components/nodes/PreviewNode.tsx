import React from 'react';
import { NodeContentProps } from './types';

export const PreviewNode: React.FC<NodeContentProps> = ({ node }) => {
    const { imageUrl, text } = node.data;
    
    return (
        <div className="p-2 h-full flex flex-col gap-2">
            <div className="flex-grow min-h-0 w-full bg-slate-900 rounded-md flex items-center justify-center overflow-hidden">
                {imageUrl ? (
                    <img src={imageUrl} alt="Generated result" className="max-w-full max-h-full object-contain" />
                ) : (
                    <span className="text-slate-500 text-sm">
                        Awaiting result...
                    </span>
                )}
            </div>
            {text?.trim() && (
                <p className="flex-shrink-0 text-xs text-slate-300 p-1 bg-slate-900 rounded max-h-[33%] overflow-y-auto">
                    {text}
                </p>
            )}
        </div>
    );
};
