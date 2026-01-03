import React from 'react';
import { NodeContentProps } from './types';

export const PreviewNode: React.FC<NodeContentProps> = ({ node }) => {
    const { imageUrl, text } = node.data;
    const hasImage = !!imageUrl;
    const hasText = !!text?.trim();

    return (
        <div className="p-2 h-full flex flex-col gap-2">
            {(hasImage || !hasText) && (
                <div className="flex-grow min-h-0 w-full bg-slate-900 rounded-md flex items-center justify-center overflow-hidden">
                    {hasImage ? (
                        <img src={imageUrl} alt="Generated result" className="max-w-full max-h-full object-contain" />
                    ) : (
                        <span className="text-slate-500 text-sm">
                            Awaiting result...
                        </span>
                    )}
                </div>
            )}
            {hasText && (
                <div className={`${!hasImage ? 'flex-grow' : 'flex-shrink-0 max-h-[33%]'} min-h-0 w-full`}>
                    <p className={`${!hasImage ? 'text-base' : 'text-xs'} h-full text-slate-300 p-2 bg-slate-900 rounded overflow-y-auto whitespace-pre-wrap break-words border border-slate-700`}>
                        {text}
                    </p>
                </div>
            )}
        </div>
    );
};