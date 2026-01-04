
import React, { useState } from 'react';
import { NodeContentProps } from './types';
import { ClipboardIcon, CheckIcon } from '../icons';

export const PreviewNode: React.FC<NodeContentProps> = ({ node }) => {
    const { imageUrl, text } = node.data;
    const hasImage = !!imageUrl;
    const hasText = !!text?.trim();
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (text) {
            navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="p-2 h-full flex flex-col gap-2">
            {(hasImage || !hasText) && (
                <div className="flex-grow min-h-0 w-full bg-slate-900 rounded-md flex items-center justify-center overflow-hidden">
                    {hasImage ? (
                        <img 
                            src={imageUrl} 
                            alt="Generated result" 
                            className="max-w-full max-h-full object-contain" 
                            onContextMenu={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <span className="text-slate-500 text-sm">
                            Awaiting result...
                        </span>
                    )}
                </div>
            )}
            {hasText && !hasImage && (
                <div 
                    className="flex-grow min-h-0 w-full relative group"
                    onWheel={(e) => e.stopPropagation()}
                >
                    <p className="text-base pr-10 h-full text-slate-300 p-2 bg-slate-900 rounded overflow-y-auto whitespace-pre-wrap break-words border border-slate-700">
                        {text}
                    </p>
                    <button
                        onClick={handleCopy}
                        className={`absolute top-2 right-2 p-1.5 rounded-md shadow-lg transition-all active:scale-95 z-10 flex items-center justify-center ${copied ? 'bg-green-600 text-white' : 'bg-slate-800/80 hover:bg-cyan-600 text-slate-300 hover:text-white'}`}
                        title="Copy to clipboard"
                    >
                        {copied ? (
                            <CheckIcon className="w-3.5 h-3.5" />
                        ) : (
                            <ClipboardIcon className="w-3.5 h-3.5" />
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};
