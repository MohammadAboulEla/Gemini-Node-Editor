
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { PencilIcon, TrashIcon, EraserIcon, SquareIcon, CircleIcon, ArrowIcon } from '../icons';

export interface CanvasElement {
    type: 'freehand' | 'eraser' | 'rect' | 'circle' | 'arrow';
    points?: { x: number; y: number }[];
    start?: { x: number; y: number };
    end?: { x: number; y: number };
    color: string;
    size: number;
    opacity: number;
    isFilled?: boolean;
}

interface UnifiedCanvasProps {
    nodeId: string;
    updateNodeData: (nodeId: string, data: Record<string, any>) => void;
    base64Image: string | null; // For background
    mimeType: string | null;
    initialElements?: CanvasElement[];
}

export const UnifiedCanvas: React.FC<UnifiedCanvasProps> = ({ 
    nodeId, 
    updateNodeData, 
    base64Image, 
    mimeType,
    initialElements = [],
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [elements, setElements] = useState<CanvasElement[]>(initialElements);
    const [currentTool, setCurrentTool] = useState<'freehand' | 'eraser' | 'rect' | 'circle' | 'arrow' | null>(null);
    const [color, setColor] = useState('#ff0000'); // Default to Red
    const [brushSize, setBrushSize] = useState(5);
    const [opacity, setOpacity] = useState(1);
    const [isFilled, setIsFilled] = useState(true);
    
    // Interaction state
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
    const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
    const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);

    // Image Aspect Ratio State
    const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);

    // Calculate image aspect ratio whenever the image changes
    useEffect(() => {
        if (base64Image) {
            const img = new Image();
            img.onload = () => {
                if (img.width && img.height) {
                    setImageAspectRatio(img.width / img.height);
                }
            };
            img.src = `data:${mimeType};base64,${base64Image}`;
        } else {
            setImageAspectRatio(null);
        }
    }, [base64Image, mimeType]);

    // Get normalized coordinates (0-1)
    const getCoordinates = (e: React.PointerEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) / rect.width,
            y: (e.clientY - rect.top) / rect.height
        };
    };

    const drawArrow = (ctx: CanvasRenderingContext2D, from: {x: number, y: number}, to: {x: number, y: number}, size: number) => {
        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        const headlen = size * 3; 
        
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(to.x, to.y);
        ctx.lineTo(to.x - headlen * Math.cos(angle - Math.PI / 6), to.y - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(to.x - headlen * Math.cos(angle + Math.PI / 6), to.y - headlen * Math.sin(angle + Math.PI / 6));
        ctx.lineTo(to.x, to.y);
        ctx.fill(); 
    };

    // Shared drawing logic using scale dimensions
    const drawElements = (ctx: CanvasRenderingContext2D, elementsToDraw: CanvasElement[], width: number, height: number) => {
        elementsToDraw.forEach(el => {
            ctx.globalAlpha = el.opacity;
            ctx.lineWidth = el.size; 
            ctx.strokeStyle = el.color;
            ctx.fillStyle = el.color;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // Helper to denormalize point
            const dn = (p: {x: number, y: number}) => ({ x: p.x * width, y: p.y * height });

            if (el.type === 'freehand' || el.type === 'eraser') {
                ctx.globalCompositeOperation = el.type === 'eraser' ? 'destination-out' : 'source-over';
                
                if (el.points && el.points.length > 0) {
                    ctx.beginPath();
                    const p0 = dn(el.points[0]);
                    ctx.moveTo(p0.x, p0.y);
                    for (let i = 1; i < el.points.length; i++) {
                        const pi = dn(el.points[i]);
                        ctx.lineTo(pi.x, pi.y);
                    }
                    ctx.stroke();
                }
                ctx.globalCompositeOperation = 'source-over';
            } else if (el.start && el.end) {
                const start = dn(el.start);
                const end = dn(el.end);
                ctx.beginPath();
                if (el.type === 'rect') {
                    const w = end.x - start.x;
                    const h = end.y - start.y;
                    if (el.isFilled) ctx.fillRect(start.x, start.y, w, h);
                    else ctx.strokeRect(start.x, start.y, w, h);
                } else if (el.type === 'circle') {
                    const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
                    ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
                    if (el.isFilled) ctx.fill();
                    else ctx.stroke();
                } else if (el.type === 'arrow') {
                    drawArrow(ctx, start, end, el.size);
                }
            }
            ctx.globalAlpha = 1.0;
        });
    };

    const renderCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        drawElements(ctx, elements, canvas.width, canvas.height);

        if (isDrawing && currentTool) {
            const tempEl: CanvasElement = {
                type: currentTool,
                color: color,
                size: brushSize,
                opacity: opacity,
                isFilled: isFilled
            };
            
            if (currentTool === 'freehand' || currentTool === 'eraser') {
                tempEl.points = currentPath;
            } else if (dragStart && dragCurrent) {
                tempEl.start = dragStart;
                tempEl.end = dragCurrent;
            }
            drawElements(ctx, [tempEl], canvas.width, canvas.height);
        }

    }, [elements, isDrawing, currentPath, dragStart, dragCurrent, currentTool, color, brushSize, opacity, isFilled]);

    // Handle Layout and Resizing
    useEffect(() => {
        const handleResize = () => {
            if (!containerRef.current || !wrapperRef.current || !canvasRef.current) return;
            
            const containerRect = containerRef.current.getBoundingClientRect();
            let width = containerRect.width;
            let height = containerRect.height;

            // If there is an image ratio, enforce it
            if (imageAspectRatio) {
                const containerRatio = width / height;

                if (containerRatio > imageAspectRatio) {
                    // Container is wider than image -> constrain width
                    width = height * imageAspectRatio;
                } else {
                    // Container is taller -> constrain height
                    height = width / imageAspectRatio;
                }
            }

            // Apply calculated dims to wrapper
            wrapperRef.current.style.width = `${width}px`;
            wrapperRef.current.style.height = `${height}px`;
            
            // Sync canvas resolution
            canvasRef.current.width = width;
            canvasRef.current.height = height;
            
            renderCanvas();
        };

        handleResize();
        const resizeObserver = new ResizeObserver(handleResize);
        if (containerRef.current) resizeObserver.observe(containerRef.current);
        
        return () => resizeObserver.disconnect();
    }, [imageAspectRatio, renderCanvas]);


    // Generate output image at ORIGINAL RESOLUTION
    const generateCompositeImage = useCallback(async () => {
        // 1. Determine dimensions
        let width = 0;
        let height = 0;
        let img: HTMLImageElement | null = null;
        
        if (base64Image) {
            img = new Image();
            img.src = `data:${mimeType};base64,${base64Image}`;
            await new Promise(resolve => { img!.onload = resolve; });
            width = img.naturalWidth;
            height = img.naturalHeight;
        } else if (canvasRef.current) {
            // Fallback for sketch node (no background image)
            width = canvasRef.current.width;
            height = canvasRef.current.height;
        } else {
            return null;
        }

        // 2. Create the final output canvas
        const compCanvas = document.createElement('canvas');
        compCanvas.width = width;
        compCanvas.height = height;
        const ctx = compCanvas.getContext('2d');
        if (!ctx) return null;

        // 3. Create a separate layer for annotations to handle erasure correctly
        const annotationCanvas = document.createElement('canvas');
        annotationCanvas.width = width;
        annotationCanvas.height = height;
        const annCtx = annotationCanvas.getContext('2d');
        if (!annCtx) return null;

        // 4. Draw background
        if (base64Image && img) {
            ctx.drawImage(img, 0, 0);
        }

        // 5. Draw elements onto the annotation layer using normalized coords scaled to original size
        drawElements(annCtx, elements, width, height);

        // 6. Composite annotations onto the final background
        ctx.drawImage(annotationCanvas, 0, 0);

        return compCanvas.toDataURL('image/png').split(',')[1];
    }, [base64Image, mimeType, elements]);

    // Save triggers
    const save = useCallback(async () => {
        const b64 = await generateCompositeImage();
        if (b64) {
            updateNodeData(nodeId, { 
                elements: elements, 
                base64ImageOutput: b64, 
                mimeTypeOutput: 'image/png',
                base64Image: b64, // For backward compatibility
                mimeType: 'image/png' 
            });
        } else {
             updateNodeData(nodeId, { elements });
        }
    }, [generateCompositeImage, elements, nodeId, updateNodeData]);

    const handlePointerDown = (e: React.PointerEvent) => {
        if (!currentTool) return;
        
        e.currentTarget.setPointerCapture(e.pointerId);
        setIsDrawing(true);
        const coords = getCoordinates(e);
        
        if (currentTool === 'freehand' || currentTool === 'eraser') {
            setCurrentPath([coords]);
        } else {
            setDragStart(coords);
            setDragCurrent(coords);
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDrawing) return;
        const coords = getCoordinates(e);

        if (currentTool === 'freehand' || currentTool === 'eraser') {
            setCurrentPath(prev => [...prev, coords]);
        } else {
            setDragCurrent(coords);
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!isDrawing || !currentTool) return;
        setIsDrawing(false);
        e.currentTarget.releasePointerCapture(e.pointerId);

        const newElement: CanvasElement = {
            type: currentTool,
            color,
            size: brushSize,
            opacity,
            isFilled
        };

        if (currentTool === 'freehand' || currentTool === 'eraser') {
            newElement.points = currentPath;
        } else if (dragStart && dragCurrent) {
            newElement.start = dragStart;
            newElement.end = dragCurrent;
        }

        const newElements = [...elements, newElement];
        setElements(newElements);
        
        setCurrentPath([]);
        setDragStart(null);
        setDragCurrent(null);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            save();
        }, 500);
        return () => clearTimeout(timer);
    }, [elements, save]);

    const clear = () => {
        setElements([]);
    };

    return (
        <div className="flex flex-col h-full gap-2">
            {/* Toolbar */}
            <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-md border border-slate-700 overflow-x-auto no-scrollbar flex-shrink-0">
                <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-6 h-6 bg-transparent border-none cursor-pointer rounded-full overflow-hidden flex-shrink-0"
                    title="Color"
                />
                
                <div className="flex items-center gap-1 border-x border-slate-700 px-2 flex-shrink-0">
                    <span className="text-[8px] text-slate-500 font-bold uppercase">Size</span>
                    <input
                        type="range"
                        min="1"
                        max="50"
                        value={brushSize}
                        onChange={(e) => setBrushSize(parseInt(e.target.value))}
                        className="w-12 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                </div>

                <div className="flex items-center gap-1 border-r border-slate-700 pr-2 flex-shrink-0">
                    <span className="text-[8px] text-slate-500 font-bold uppercase">Opac</span>
                    <input
                        type="range"
                        min="1"
                        max="100"
                        value={opacity * 100}
                        onChange={(e) => setOpacity(parseInt(e.target.value) / 100)}
                        className="w-12 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => setCurrentTool('freehand')} className={`p-1 rounded ${currentTool === 'freehand' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`} title="Freehand"><PencilIcon className="w-4 h-4" /></button>
                    <button onClick={() => setCurrentTool('rect')} className={`p-1 rounded ${currentTool === 'rect' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`} title="Rectangle"><SquareIcon className="w-4 h-4" /></button>
                    <button onClick={() => setCurrentTool('circle')} className={`p-1 rounded ${currentTool === 'circle' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`} title="Circle"><CircleIcon className="w-4 h-4" /></button>
                    <button onClick={() => setCurrentTool('arrow')} className={`p-1 rounded ${currentTool === 'arrow' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`} title="Arrow"><ArrowIcon className="w-4 h-4" /></button>
                    <button onClick={() => setCurrentTool('eraser')} className={`p-1 rounded ${currentTool === 'eraser' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`} title="Eraser"><EraserIcon className="w-4 h-4" /></button>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0 border-l border-slate-700 pl-2">
                     <button 
                        onClick={() => setIsFilled(!isFilled)} 
                        className={`text-[8px] px-1 py-0.5 rounded border ${isFilled ? 'bg-cyan-900 border-cyan-500 text-cyan-200' : 'border-slate-600 text-slate-400'}`}
                    >
                        {isFilled ? 'FILL' : 'OUTLINE'}
                    </button>
                </div>

                <button onClick={clear} className="ml-auto p-1 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors flex-shrink-0" title="Clear All"><TrashIcon className="w-4 h-4" /></button>
            </div>

            {/* Canvas Container */}
            <div 
                ref={containerRef} 
                className="flex-grow flex items-center justify-center bg-slate-950 rounded-lg border-2 border-slate-700 overflow-hidden relative"
            >
                {/* Constrained Wrapper for Image Ratio */}
                <div 
                    ref={wrapperRef}
                    className="relative shadow-2xl"
                    style={{ width: '100%', height: '100%' }} // Initial, adjusted by effect
                >
                    {/* Background Image Layer */}
                    {base64Image && (
                        <img 
                            src={`data:${mimeType};base64,${base64Image}`} 
                            alt="Background" 
                            className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none"
                        />
                    )}

                    {/* Drawing Layer */}
                    <canvas
                        ref={canvasRef}
                        className={`absolute inset-0 w-full h-full touch-none ${currentTool ? 'cursor-crosshair' : 'cursor-default'}`}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerLeave={handlePointerUp}
                    />
                </div>
            </div>
        </div>
    );
};
