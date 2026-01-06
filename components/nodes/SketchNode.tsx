import React, { useRef, useState, useEffect, useCallback } from 'react';
import { NodeContentProps } from './types';
import { PencilIcon, TrashIcon, EraserIcon } from '../icons';

export const SketchNode: React.FC<NodeContentProps> = ({ node, updateNodeData }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState(node.data.color || '#ffffff');
    const [brushSize, setBrushSize] = useState(node.data.brushSize || 5);
    const [isEraser, setIsEraser] = useState(false);
    const [cursorPos, setCursorPos] = useState<{ x: number, y: number } | null>(null);

    // Initialize or restore canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size based on container
        const resize = () => {
            const rect = container.getBoundingClientRect();
            // Create temporary canvas to hold content during resize
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            tempCanvas.getContext('2d')?.drawImage(canvas, 0, 0);

            canvas.width = rect.width;
            canvas.height = rect.height;

            // Fill background
            ctx.fillStyle = '#0f172a'; // slate-900 matches editor
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Restore content or initial state
            if (node.data.base64Image) {
                const img = new Image();
                img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                img.src = `data:image/png;base64,${node.data.base64Image}`;
            } else {
                ctx.drawImage(tempCanvas, 0, 0);
            }
        };

        resize();
        
        // Listen for parent node resizing
        const observer = new ResizeObserver(resize);
        observer.observe(container);
        return () => observer.disconnect();
    }, [node.id]);

    const saveToData = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const base64 = canvas.toDataURL('image/png').split(',')[1];
        updateNodeData(node.id, { base64Image: base64, mimeType: 'image/png' });
    }, [node.id, updateNodeData]);

    const getCoordinates = (e: React.PointerEvent | PointerEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const startDrawing = (e: React.PointerEvent) => {
        e.stopPropagation();
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        setIsDrawing(true);
        const { x, y } = getCoordinates(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = isEraser ? '#0f172a' : color;
        ctx.lineWidth = brushSize;
        
        // Ensure point-only clicks still draw
        ctx.lineTo(x, y);
        ctx.stroke();

        canvas.setPointerCapture(e.pointerId);
    };

    const draw = (e: React.PointerEvent) => {
        const coords = getCoordinates(e);
        setCursorPos(coords);

        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
    };

    const stopDrawing = (e: React.PointerEvent) => {
        if (!isDrawing) return;
        setIsDrawing(false);
        saveToData();
    };

    const handlePointerLeave = () => {
        setCursorPos(null);
        if (isDrawing) {
            setIsDrawing(false);
            saveToData();
        }
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        saveToData();
    };

    return (
        <div className="p-2 h-full flex flex-col gap-2">
            {/* Toolbar */}
            <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-md border border-slate-700 overflow-x-auto no-scrollbar">
                <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-6 h-6 bg-transparent border-none cursor-pointer rounded-full overflow-hidden flex-shrink-0"
                    title="Brush Color"
                />
                
                <div className="flex items-center gap-1 border-x border-slate-700 px-2 flex-shrink-0">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Size</span>
                    <input
                        type="range"
                        min="1"
                        max="50"
                        value={brushSize}
                        onChange={(e) => setBrushSize(parseInt(e.target.value))}
                        className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                        onClick={() => setIsEraser(false)}
                        className={`p-1 rounded transition-colors ${!isEraser ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                        title="Brush"
                    >
                        <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setIsEraser(true)}
                        className={`p-1 rounded transition-colors ${isEraser ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                        title="Eraser"
                    >
                        <EraserIcon className="w-4 h-4" />
                    </button>
                </div>

                <button
                    onClick={clearCanvas}
                    className="ml-auto p-1 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors flex-shrink-0"
                    title="Clear Canvas"
                >
                    <TrashIcon className="w-4 h-4" />
                </button>
            </div>

            {/* Canvas Area */}
            <div ref={containerRef} className="flex-grow bg-slate-900 rounded-lg border-2 border-slate-700 relative overflow-hidden group">
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 touch-none cursor-none active:cursor-none"
                    onPointerDown={startDrawing}
                    onPointerMove={draw}
                    onPointerUp={stopDrawing}
                    onPointerLeave={handlePointerLeave}
                    onPointerEnter={(e) => setCursorPos(getCoordinates(e))}
                />
                
                {/* Brush Preview Circle */}
                {cursorPos && (
                    <div 
                        className="absolute pointer-events-none rounded-full border border-white/50 mix-blend-difference"
                        style={{
                            left: cursorPos.x,
                            top: cursorPos.y,
                            width: brushSize,
                            height: brushSize,
                            transform: 'translate(-50%, -50%)',
                            backgroundColor: isEraser ? 'rgba(15, 23, 42, 0.5)' : color,
                            boxShadow: '0 0 0 1px rgba(0,0,0,0.5)'
                        }}
                    />
                )}

                {!node.data.base64Image && !isDrawing && !cursorPos && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-600">
                        <PencilIcon className="w-8 h-8 mb-2 opacity-20" />
                        <span className="text-xs font-semibold opacity-30">Start Sketching...</span>
                    </div>
                )}
            </div>
        </div>
    );
};