
import React, { useState, useCallback, useRef, WheelEvent, useEffect } from 'react';
import { Point } from '../types';

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 2.0;

// Correct usage of React.RefObject and React.WheelEvent
export const useViewTransform = (editorRef: React.RefObject<HTMLDivElement>) => {
    const [viewTransform, setViewTransform] = useState({ x: 0, y: 0, scale: 1 });
    const [isPanning, setIsPanning] = useState(false);
    const panStartPoint = useRef({ x: 0, y: 0 });

    // Use a ref to keep track of the latest viewTransform without triggering effect dependencies
    const viewTransformRef = useRef(viewTransform);

    // Update ref whenever state changes
    useEffect(() => {
        viewTransformRef.current = viewTransform;
    }, [viewTransform]);

    const handleWheel = useCallback((e: WheelEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (!editorRef.current) return;

        const editorRect = editorRef.current.getBoundingClientRect();
        const scrollDelta = -e.deltaY * 0.001;

        const currentScale = viewTransformRef.current.scale;
        const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentScale + scrollDelta * currentScale));

        const mouseX = e.clientX - editorRect.left;
        const mouseY = e.clientY - editorRect.top;

        const newX = mouseX - (mouseX - viewTransformRef.current.x) * (newScale / currentScale);
        const newY = mouseY - (mouseY - viewTransformRef.current.y) * (newScale / currentScale);

        setViewTransform({ x: newX, y: newY, scale: newScale });
    }, [editorRef]); // Removed viewTransform dependency

    const handlePanMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        setIsPanning(true);
        panStartPoint.current = { x: e.clientX, y: e.clientY };
    }, []);

    const handlePanMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!isPanning) return;
        const dx = e.clientX - panStartPoint.current.x;
        const dy = e.clientY - panStartPoint.current.y;

        setViewTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
        panStartPoint.current = { x: e.clientX, y: e.clientY };
    }, [isPanning]);

    const stopPanning = useCallback(() => {
        setIsPanning(false);
    }, []);

    const resetView = useCallback(() => {
        setViewTransform({ x: 0, y: 0, scale: 1 });
    }, []);

    // Stable function that doesn't change on every render/pan
    const getPositionInWorldSpace = useCallback((clientPoint: Point): Point => {
        if (!editorRef.current) return clientPoint;
        const editorRect = editorRef.current.getBoundingClientRect();
        const vt = viewTransformRef.current;
        return {
            x: (clientPoint.x - editorRect.left - vt.x) / vt.scale,
            y: (clientPoint.y - editorRect.top - vt.y) / vt.scale,
        };
    }, [editorRef]); // Removed viewTransform dependency

    return {
        viewTransform,
        isPanning,
        handleWheel,
        handlePanMouseDown,
        handlePanMouseMove,
        stopPanning,
        resetView,
        getPositionInWorldSpace,
    };
};
