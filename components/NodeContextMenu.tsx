
import React, { useEffect, useRef } from 'react';
import { ScissorsIcon, ClipboardIcon } from './icons';

interface NodeContextMenuProps {
    position: { x: number; y: number };
    onClose: () => void;
    onDelete: () => void;
    onDuplicate: () => void;
}

const NodeContextMenu: React.FC<NodeContextMenuProps> = ({ position, onClose, onDelete, onDuplicate }) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: globalThis.MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    return (
        <div
            ref={menuRef}
            className="fixed bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-48 z-[10002] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100"
            style={{ top: position.y, left: position.x }}
            onWheel={(e) => e.stopPropagation()}
        >
            <button
                onClick={() => { onDuplicate(); onClose(); }}
                className="w-full text-left px-3 py-2.5 hover:bg-slate-700 flex items-center gap-3 transition-colors text-slate-200 outline-none"
            >
                <ClipboardIcon className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium">Duplicate Node</span>
            </button>
            <button
                onClick={() => { onDelete(); onClose(); }}
                className="w-full text-left px-3 py-2.5 hover:bg-red-900/40 hover:text-red-400 flex items-center gap-3 transition-colors text-slate-300 border-t border-slate-700/50 outline-none"
            >
                <ScissorsIcon className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium">Delete Node</span>
            </button>
        </div>
    );
};

export default NodeContextMenu;
