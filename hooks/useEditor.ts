
import { useState, useCallback, useEffect, MouseEvent, useRef } from 'react';
import { Node as NodeType, Connection as ConnectionType, NodeType as EnumNodeType, DraggingNodeState, ConnectingState, PortPositions, ResizingNodeState, SelectionBox, Point } from '../types';
import createNode from '../nodeFactory';

export const useEditor = (
    initialNodes: NodeType[], 
    initialConnections: ConnectionType[],
    viewTransform: { x: number, y: number, scale: number },
    getPositionInWorldSpace: (point: {x: number, y: number}) => {x: number, y: number}
) => {
    const [nodes, setNodes] = useState<NodeType[]>(initialNodes);
    const [connections, setConnections] = useState<ConnectionType[]>(initialConnections);
    
    const [draggingNode, setDraggingNode] = useState<DraggingNodeState | null>(null);
    const [resizingNode, setResizingNode] = useState<ResizingNodeState | null>(null);
    const [connecting, setConnecting] = useState<ConnectingState | null>(null);
    const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);

    const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
    const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);

    const portRefs = useRef<Record<string, HTMLDivElement>>({});
    const [portPositions, setPortPositions] = useState<PortPositions>({});

    const updatePortPositions = useCallback(() => {
        const newPositions: PortPositions = {};
        (Object.entries(portRefs.current) as [string, HTMLDivElement][]).forEach(([key, el]) => {
            if (el) {
                const [nodeId, portId] = key.split(':');
                newPositions[key] = { nodeId, portId, rect: el.getBoundingClientRect() };
            }
        });
        setPortPositions(newPositions);
    }, []);
    
    useEffect(() => {
        updatePortPositions();
        window.addEventListener('resize', updatePortPositions);
        return () => window.removeEventListener('resize', updatePortPositions);
    }, [nodes, viewTransform, updatePortPositions]);
    
    const setPortRef = useCallback((nodeId: string, portId: string, el: HTMLDivElement | null) => {
        const key = `${nodeId}:${portId}`;
        if (el) {
            portRefs.current[key] = el;
        } else {
            delete portRefs.current[key];
        }
        requestAnimationFrame(updatePortPositions);
    }, [updatePortPositions]);

    const updateNodeData = useCallback((nodeId: string, data: Record<string, any>) => {
        setNodes(prevNodes => prevNodes.map(n => n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n));
    }, []);

    const updateNode = useCallback((nodeId: string, updates: Partial<NodeType>) => {
        setNodes(prevNodes => prevNodes.map(n => {
            if (n.id !== nodeId) return n;
            const { data, ...rest } = updates;
            return {
                ...n,
                ...rest,
                data: data ? { ...n.data, ...data } : n.data
            };
        }));
    }, []);

    const deleteNodes = useCallback((ids: string[]) => {
        setNodes(prev => prev.filter(n => !ids.includes(n.id)));
        setSelectedNodeIds(prev => prev.filter(id => !ids.includes(id)));
    }, []);

    const deleteConnection = useCallback((id: string) => {
        setConnections(prev => prev.filter(c => c.id !== id));
        if (selectedConnectionId === id) setSelectedConnectionId(null);
    }, [selectedConnectionId]);
    
    const deselectAll = useCallback(() => {
        setSelectedNodeIds([]);
        setSelectedConnectionId(null);
    }, []);

    const handleNodeMouseDown = useCallback((e: MouseEvent<HTMLDivElement>, nodeId: string) => {
        e.preventDefault();
        e.stopPropagation();
        
        const isCtrlPressed = e.ctrlKey || e.metaKey;
        let newSelection = [...selectedNodeIds];

        if (isCtrlPressed) {
            if (newSelection.includes(nodeId)) {
                newSelection = newSelection.filter(id => id !== nodeId);
            } else {
                newSelection.push(nodeId);
            }
        } else {
            if (!newSelection.includes(nodeId)) {
                newSelection = [nodeId];
            }
        }

        setSelectedNodeIds(newSelection);
        setSelectedConnectionId(null);

        const worldMousePos = getPositionInWorldSpace({ x: e.clientX, y: e.clientY });
        const initialPositions: Record<string, Point> = {};
        
        nodes.forEach(n => {
            if (newSelection.includes(n.id)) {
                initialPositions[n.id] = { ...n.position };
            }
        });

        setDraggingNode({
            ids: newSelection,
            initialPositions,
            startMouseWorldPos: worldMousePos
        });
    }, [nodes, getPositionInWorldSpace, selectedNodeIds]);

    const handleResizeMouseDown = useCallback((e: MouseEvent<HTMLDivElement>, nodeId: string) => {
        e.preventDefault();
        e.stopPropagation();
        const node = nodes.find(n => n.id === nodeId);
        if (node && node.resizable !== false) {
            const nodeElement = e.currentTarget.parentElement;
            if (nodeElement) {
                const rect = nodeElement.getBoundingClientRect();
                const currentWidth = node.width || (rect.width / viewTransform.scale);
                const currentHeight = node.height || (rect.height / viewTransform.scale);
                const initialWidth = Math.max(currentWidth, node.minWidth || 0);
                const initialHeight = Math.max(currentHeight, node.minHeight || 0);

                if (node.width !== initialWidth || node.height !== initialHeight) {
                    updateNode(node.id, { width: initialWidth, height: initialHeight });
                }

                setResizingNode({
                    id: nodeId,
                    initialWidth: initialWidth,
                    initialHeight: initialHeight,
                    startPoint: { x: e.clientX, y: e.clientY },
                });
            }
        }
    }, [nodes, viewTransform.scale, updateNode]);

    const handleNodeResize = useCallback((e: MouseEvent<HTMLDivElement>) => {
        if (!resizingNode) return;
        
        const resizingNodeObject = nodes.find(n => n.id === resizingNode.id);
        if (!resizingNodeObject) return;

        const dx = (e.clientX - resizingNode.startPoint.x) / viewTransform.scale;
        const dy = (e.clientY - resizingNode.startPoint.y) / viewTransform.scale;
        
        const minWidth = resizingNodeObject.minWidth || resizingNode.initialWidth;
        const minHeight = resizingNodeObject.minHeight || resizingNode.initialHeight;

        setNodes(prevNodes => prevNodes.map(n =>
            n.id === resizingNode.id
                ? { ...n, 
                    width: Math.max(minWidth, resizingNode.initialWidth + dx),
                    height: Math.max(minHeight, resizingNode.initialHeight + dy),
                  }
                : n
        ));
    }, [resizingNode, viewTransform.scale, nodes]);
    
    const stopResizingNode = useCallback(() => {
        if (resizingNode) {
            updatePortPositions();
        }
        setResizingNode(null);
    }, [resizingNode, updatePortPositions]);
    
    const handlePortMouseDown = useCallback((e: MouseEvent<HTMLDivElement>, nodeId: string, portId: string) => {
        e.preventDefault();
        e.stopPropagation();
        const portKey = `${nodeId}:${portId}`;
        const portPos = portPositions[portKey];
        if (!portPos) return;

        setConnecting({
            fromNodeId: nodeId,
            fromPortId: portId,
            fromPortRect: portPos.rect,
        });
    }, [portPositions]);

    const handleConnectionClick = useCallback((connectionId: string) => {
        setSelectedNodeIds([]);
        setSelectedConnectionId(connectionId);
    }, []);

    const handleNodeDrag = useCallback((e: MouseEvent<HTMLDivElement>) => {
        if (!draggingNode) return;
        const worldMousePos = getPositionInWorldSpace({ x: e.clientX, y: e.clientY });
        const dx = worldMousePos.x - draggingNode.startMouseWorldPos.x;
        const dy = worldMousePos.y - draggingNode.startMouseWorldPos.y;

        setNodes(prevNodes => prevNodes.map(n =>
            draggingNode.ids.includes(n.id)
                ? { ...n, position: { 
                    x: draggingNode.initialPositions[n.id].x + dx,
                    y: draggingNode.initialPositions[n.id].y + dy
                  } }
                : n
        ));
    }, [draggingNode, getPositionInWorldSpace]);

    const stopDraggingNode = useCallback(() => {
        setDraggingNode(null);
    }, []);
    
    const createConnection = useCallback((fromNodeId: string, fromPortId: string, toNodeId: string, toPortId: string) => {
        const newConnection: ConnectionType = {
            id: `conn-${Date.now()}`,
            fromNodeId,
            fromPortId,
            toNodeId,
            toPortId,
        };
        setConnections(prev => {
            const filtered = prev.filter(c => !(c.toNodeId === toNodeId && c.toPortId === toPortId));
            return [...filtered, newConnection];
        });
    }, []);
    
    const addNode = useCallback((nodeType: EnumNodeType, position: {x: number, y: number}, connectionContext?: { fromNodeId: string, fromPortId: string }) => {
        const newNode = createNode(nodeType, position);
        setNodes(prev => [...prev, newNode]);

        if (connectionContext) {
            const { fromNodeId, fromPortId } = connectionContext;
            const sourceNode = nodes.find(n => n.id === fromNodeId);
            const sourcePort = sourceNode?.outputs.find(p => p.id === fromPortId);

            if (sourcePort) {
                const compatibleInputPort = newNode.inputs.find(p =>
                    p.dataType === sourcePort.dataType || p.dataType === 'any'
                );
                if (compatibleInputPort) {
                    createConnection(fromNodeId, fromPortId, newNode.id, compatibleInputPort.id);
                }
            }
        }
    }, [nodes, createConnection]);

    const startSelectionBox = useCallback((e: MouseEvent) => {
        setSelectionBox({
            start: { x: e.clientX, y: e.clientY },
            current: { x: e.clientX, y: e.clientY }
        });
    }, []);

    const updateSelectionBox = useCallback((e: MouseEvent) => {
        if (!selectionBox) return;
        setSelectionBox(prev => prev ? ({ ...prev, current: { x: e.clientX, y: e.clientY } }) : null);

        const startWorld = getPositionInWorldSpace(selectionBox.start);
        const currentWorld = getPositionInWorldSpace({ x: e.clientX, y: e.clientY });

        const xMin = Math.min(startWorld.x, currentWorld.x);
        const xMax = Math.max(startWorld.x, currentWorld.x);
        const yMin = Math.min(startWorld.y, currentWorld.y);
        const yMax = Math.max(startWorld.y, currentWorld.y);

        const newlySelected = nodes.filter(node => {
            const nodeWidth = node.width || 256;
            const nodeHeight = node.height || 200;
            const nodeX = node.position.x;
            const nodeY = node.position.y;

            return nodeX < xMax && (nodeX + nodeWidth) > xMin &&
                   nodeY < yMax && (nodeY + nodeHeight) > yMin;
        }).map(n => n.id);

        setSelectedNodeIds(newlySelected);
    }, [selectionBox, nodes, getPositionInWorldSpace]);

    const endSelectionBox = useCallback(() => {
        setSelectionBox(null);
    }, []);

    useEffect(() => {
        setConnections(prevConnections => {
            return prevConnections.filter(conn => {
                const fromNode = nodes.find(n => n.id === conn.fromNodeId);
                const toNode = nodes.find(n => n.id === conn.toNodeId);
                if (!fromNode || !toNode) return false;
                
                const fromPortExists = fromNode.outputs.some(p => p.id === conn.fromPortId);
                const toPortExists = toNode.inputs.some(p => p.id === conn.toPortId);
                return fromPortExists && toPortExists;
            });
        });
    }, [nodes]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedNodeIds.length > 0) {
                    e.preventDefault();
                    deleteNodes(selectedNodeIds);
                } else if (selectedConnectionId) {
                    e.preventDefault();
                    deleteConnection(selectedConnectionId);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedNodeIds, selectedConnectionId, deleteNodes, deleteConnection]);

    return {
        nodes,
        setNodes,
        connections,
        setConnections,
        draggingNode,
        connecting,
        setConnecting,
        selectedNodeIds,
        selectedConnectionId,
        portPositions,
        selectionBox,
        updateNodeData,
        updateNode,
        deleteNodes,
        deleteConnection,
        deselectAll,
        handleNodeMouseDown,
        handlePortMouseDown,
        handleConnectionClick,
        handleNodeDrag,
        stopDraggingNode,
        createConnection,
        addNode,
        setPortRef,
        handleResizeMouseDown,
        handleNodeResize,
        stopResizingNode,
        startSelectionBox,
        updateSelectionBox,
        endSelectionBox,
    }
};
