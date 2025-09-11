import React, { useEffect, useRef } from 'react';

interface ImagePreviewModalProps {
    imageUrl: string;
    onClose: () => void;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ imageUrl, onClose }) => {
    const modalRef = useRef<HTMLDivElement>(null);

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
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black/80 z-[10001] flex items-center justify-center p-4"
            onClick={handleBackdropClick}
            aria-modal="true"
            role="dialog"
        >
            <div
                ref={modalRef}
                className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-lg shadow-2xl p-2"
            >
                <img 
                    src={imageUrl} 
                    alt="Enlarged preview" 
                    className="max-w-full max-h-full object-contain rounded"
                    style={{ maxHeight: 'calc(90vh - 1rem)' }} // Ensure padding is accounted for
                />
                <button
                    onClick={onClose}
                    className="absolute -top-3 -right-3 p-1 bg-slate-700 text-white rounded-full hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    aria-label="Close image preview"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default ImagePreviewModal;
