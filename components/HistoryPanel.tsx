import React, { useEffect, useRef } from 'react';
import { DownloadIcon } from './icons';

interface HistoryItem {
    id: string;
    imageUrl: string;
}

interface HistoryPanelProps {
    history: HistoryItem[];
    onClose: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onClose }) => {
    const panelRef = useRef<HTMLDivElement>(null);

    // Close on escape key
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Close on backdrop click
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
            onClose();
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 z-[10000] flex justify-end"
            onClick={handleBackdropClick}
            aria-modal="true"
            role="dialog"
        >
            <div
                ref={panelRef}
                className="w-full max-w-sm h-full bg-slate-800 border-l border-slate-700 flex flex-col shadow-2xl"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside panel
            >
                <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-slate-700">
                    <h2 className="text-lg font-semibold">Image History</h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-slate-700 transition-colors"
                        aria-label="Close history panel"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>

                <div className="flex-grow p-4 overflow-y-auto">
                    {history.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-slate-500">
                            <p>No images generated yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            {history.map((item) => (
                                <div key={item.id} className="group relative rounded-lg overflow-hidden border-2 border-slate-700">
                                    <img src={item.imageUrl} alt="Generated image" className="aspect-square w-full object-cover" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <a
                                            href={item.imageUrl}
                                            download={`gemini-node-editor-${item.id}.png`}
                                            className="p-3 bg-cyan-600 text-white rounded-full hover:bg-cyan-500 transition-colors"
                                            aria-label="Download image"
                                            onClick={(e) => e.stopPropagation()} // Prevent backdrop click
                                        >
                                            <DownloadIcon className="w-5 h-5" />
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HistoryPanel;
