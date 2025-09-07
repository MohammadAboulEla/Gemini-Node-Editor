import { useState, useCallback, useEffect, MouseEvent, useRef } from 'react';
import { Node as NodeType, Connection as ConnectionType, NodeType as EnumNodeType, DraggingNodeState, ConnectingState, PortPositions, ResizingNodeState } from '../types';
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

    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);

    const portRefs = useRef<Record<string, HTMLDivElement>>({});
    const [portPositions, setPortPositions] = useState<PortPositions>({});

    const updatePortPositions = useCallback(() => {
        const newPositions: PortPositions = {};
        Object.entries(portRefs.current).forEach(([key, el]) => {
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
        // Defer update to allow DOM to settle
        requestAnimationFrame(updatePortPositions);
    }, [updatePortPositions]);

    const updateNodeData = useCallback((nodeId: string, data: Record<string, any>) => {
        setNodes(prevNodes => prevNodes.map(n => n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n));
    }, []);

    const updateNode = useCallback((nodeId: string, updates: Partial<NodeType>) => {
        setNodes(prevNodes => prevNodes.map(n => 
            n.id === nodeId 
            ? { ...n, ...updates, data: { ...n.data, ...updates.data } } 
            : n
        ));
    }, []);
    
    const deselectAll = useCallback(() => {
        setSelectedNodeId(null);
        setSelectedConnectionId(null);
    }, []);

    const handleNodeMouseDown = useCallback((e: MouseEvent<HTMLDivElement>, nodeId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedNodeId(nodeId);
        setSelectedConnectionId(null);
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
            const worldMousePos = getPositionInWorldSpace({ x: e.clientX, y: e.clientY });
            setDraggingNode({
                id: nodeId,
                offset: {
                    x: worldMousePos.x - node.position.x,
                    y: worldMousePos.y - node.position.y
                }
            });
        }
    }, [nodes, getPositionInWorldSpace]);

    const handleResizeMouseDown = useCallback((e: MouseEvent<HTMLDivElement>, nodeId: string) => {
        e.preventDefault();
        e.stopPropagation();
        const node = nodes.find(n => n.id === nodeId);
        // Only start resizing if the node is resizable
        if (node && node.resizable !== false) {
            const nodeElement = e.currentTarget.parentElement;
            if (nodeElement) {
                const rect = nodeElement.getBoundingClientRect();

                const currentWidth = node.width || (rect.width / viewTransform.scale);
                const currentHeight = node.height || (rect.height / viewTransform.scale);

                // Determine the effective initial size, ensuring it respects min dimensions
                const initialWidth = Math.max(currentWidth, node.minWidth || 0);
                const initialHeight = Math.max(currentHeight, node.minHeight || 0);

                // If the node's dimensions are smaller than the minimums, update them immediately
                // to prevent the "jump" on the first resize tick.
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
        setSelectedNodeId(null);
        setSelectedConnectionId(connectionId);
    }, []);

    const handleNodeDrag = useCallback((e: MouseEvent<HTMLDivElement>) => {
        if (!draggingNode) return;
        const worldMousePos = getPositionInWorldSpace({ x: e.clientX, y: e.clientY });
        setNodes(prevNodes => prevNodes.map(n =>
            n.id === draggingNode.id
                ? { ...n, position: { 
                    x: worldMousePos.x - draggingNode.offset.x,
                    y: worldMousePos.y - draggingNode.offset.y
                  } }
                : n
        ));
    }, [draggingNode, getPositionInWorldSpace]);

    const stopDraggingNode = useCallback(() => {
        setDraggingNode(null);
    }, []);
    
    const createConnection = useCallback((fromNodeId: string, fromPortId: string, toNodeId: string, toPortId: string) => {
         if (!connections.some(c => c.toNodeId === toNodeId && c.toPortId === toPortId)) {
            const newConnection: ConnectionType = {
                id: `conn-${Date.now()}`,
                fromNodeId,
                fromPortId,
                toNodeId,
                toPortId,
            };
            setConnections(prev => [...prev, newConnection]);
        }
    }, [connections]);
    
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

    // Effect to clean up connections if a node or port is removed
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
                if (selectedNodeId) {
                    e.preventDefault();
                    setNodes(prev => prev.filter(n => n.id !== selectedNodeId));
                    setSelectedNodeId(null);
                } else if (selectedConnectionId) {
e.preventDefault();
                    setConnections(prev => prev.filter(c => c.id !== selectedConnectionId));
                    setSelectedConnectionId(null);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedNodeId, selectedConnectionId]);

    return {
        nodes,
        connections,
        draggingNode,
        connecting,
        setConnecting,
        selectedNodeId,
        selectedConnectionId,
        portPositions,
        updateNodeData,
        updateNode,
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
    }
};