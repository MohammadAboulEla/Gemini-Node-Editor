import React, { useState, useCallback, useRef, MouseEvent, useEffect } from 'react';
import { Node as NodeType, Connection as ConnectionType, NodeType as EnumNodeType, Point } from './types';
import Node from './components/Node';
import Connection from './components/Connection';
import AddNodeMenu from './components/AddNodeMenu';
import Tooltip from './components/Tooltip';
import { PlusIcon, PlayIcon, SpinnerIcon, HistoryIcon } from './components/icons';
import HistoryPanel from './components/HistoryPanel';

import { useViewTransform } from './hooks/useViewTransform';
import { useEditor } from './hooks/useEditor';
import { useWorkflow } from './hooks/useWorkflow';

const INITIAL_NODES: NodeType[] = [
    {
        id: 'node-1', type: EnumNodeType.ImageLoader, position: { x: 20, y: 140 }, title: 'Load Image',
        width: 256, height: 220, minWidth: 256, minHeight: 220,
        inputs: [], outputs: [{ id: 'image-output', type: 'output', dataType: 'image' }], data: {}
    },
    {
        id: 'node-2', type: EnumNodeType.Prompt, position: { x: 20, y: 370 }, title: 'Prompt',
        width: 256, minWidth: 256, minHeight: 100,
        inputs: [], outputs: [{ id: 'prompt-output', type: 'output', dataType: 'text' }], data: {}
    },
    {
        id: 'node-3', type: EnumNodeType.ImageGenerator, position: { x: 310, y: 250 }, title: 'Gemini Image',
        width: 256, resizable: false,
        inputs: [
            { id: 'image-input', type: 'input', dataType: 'image' },
            { id: 'prompt-input', type: 'input', dataType: 'text' }
        ],
        outputs: [{ id: 'result-output', type: 'output', dataType: 'any' }],
        data: { status: 'idle', mode: 'edit' }
    },
    {
        id: 'node-4', type: EnumNodeType.Preview, position: { x: 600, y: 100 }, title: 'Result Preview',
        width: 456, height: 420, minWidth: 256, minHeight: 220,
        inputs: [{ id: 'result-input', type: 'input', dataType: 'any' }],
        outputs: [], data: {}
    }
];

const INITIAL_CONNECTIONS: ConnectionType[] = [
    { id: 'conn-1', fromNodeId: 'node-1', fromPortId: 'image-output', toNodeId: 'node-3', toPortId: 'image-input' },
    { id: 'conn-2', fromNodeId: 'node-2', fromPortId: 'prompt-output', toNodeId: 'node-3', toPortId: 'prompt-input' },
    { id: 'conn-3', fromNodeId: 'node-3', fromPortId: 'result-output', toNodeId: 'node-4', toPortId: 'result-input' },
];


interface AddNodeMenuState {
    visible: boolean;
    position: Point;
    connectionContext?: {
        fromNodeId: string;
        fromPortId: string;
    };
}

interface HistoryItem {
    id: string;
    imageUrl: string;
}

const createPathData = (from: Point, to: Point): string => {
    const dx = to.x - from.x;
    const controlPointX1 = from.x + dx * 0.5;
    const controlPointY1 = from.y;
    const controlPointX2 = to.x - dx * 0.5;
    const controlPointY2 = to.y;
    return `M${from.x},${from.y} C${controlPointX1},${controlPointY1} ${controlPointX2},${controlPointY2} ${to.x},${to.y}`;
};

const App: React.FC = () => {
    const editorRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const tempConnectionPathRef = useRef<SVGPathElement | null>(null);
    const [addNodeMenu, setAddNodeMenu] = useState<AddNodeMenuState | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isHistoryPanelVisible, setIsHistoryPanelVisible] = useState(false);

    const {
        viewTransform, isPanning, handleWheel, handlePanMouseDown, handlePanMouseMove,
        stopPanning, resetView, getPositionInWorldSpace
    } = useViewTransform(editorRef);

    const {
        nodes, connections, draggingNode, connecting, setConnecting, selectedNodeId, selectedConnectionId,
        portPositions, updateNodeData, updateNode, deselectAll, handleNodeMouseDown, handlePortMouseDown,
        handleConnectionClick, handleNodeDrag, stopDraggingNode, createConnection, addNode, setPortRef,
        handleResizeMouseDown, handleNodeResize, stopResizingNode
    } = useEditor(INITIAL_NODES, INITIAL_CONNECTIONS, viewTransform, getPositionInWorldSpace);

    const addToHistory = useCallback((imageUrl: string) => {
        setHistory(prevHistory => {
            if (prevHistory.some(item => item.imageUrl === imageUrl)) {
                return prevHistory;
            }
            return [{ id: `hist-${Date.now()}`, imageUrl }, ...prevHistory];
        });
    }, []);

    const { isWorkflowRunning, runWorkflow } = useWorkflow(nodes, connections, updateNodeData, addToHistory);

    const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
        handlePanMouseMove(e);
        handleNodeDrag(e);
        handleNodeResize(e);

        if (connecting && tempConnectionPathRef.current && editorRef.current) {
            const editorRect = editorRef.current.getBoundingClientRect();

            const fromViewportX = connecting.fromPortRect.left + connecting.fromPortRect.width / 2 - editorRect.left;
            const fromViewportY = connecting.fromPortRect.top + connecting.fromPortRect.height / 2 - editorRect.top;

            const fromPoint = {
                x: (fromViewportX - viewTransform.x) / viewTransform.scale,
                y: (fromViewportY - viewTransform.y) / viewTransform.scale,
            };

            const toPoint = getPositionInWorldSpace({ x: e.clientX, y: e.clientY });

            const pathData = createPathData(fromPoint, toPoint);
            tempConnectionPathRef.current.setAttribute('d', pathData);
        }
    }, [handlePanMouseMove, handleNodeDrag, handleNodeResize, connecting, viewTransform, getPositionInWorldSpace]);

    const handleMouseUp = useCallback((e: MouseEvent<HTMLDivElement>) => {
        if (tempConnectionPathRef.current) {
            tempConnectionPathRef.current.remove();
            tempConnectionPathRef.current = null;
        }

        if (connecting) {
            const toPort = Object.values(portPositions).find(p => {
                const { left, right, top, bottom } = p.rect;
                return e.clientX >= left && e.clientX <= right && e.clientY >= top && e.clientY <= bottom;
            });
            const toNode = toPort ? nodes.find(n => n.id === toPort.nodeId) : null;

            if (toPort && toNode && toNode.id !== connecting.fromNodeId && toNode.inputs.some(p => p.id === toPort.portId)) {
                createConnection(connecting.fromNodeId, connecting.fromPortId, toPort.nodeId, toPort.portId);
            } else if (!toPort) {
                setAddNodeMenu({
                    visible: true,
                    position: { x: e.clientX, y: e.clientY },
                    connectionContext: {
                        fromNodeId: connecting.fromNodeId,
                        fromPortId: connecting.fromPortId,
                    }
                });
            }
        }
        stopDraggingNode();
        stopResizingNode();
        setConnecting(null);
        stopPanning();
    }, [connecting, portPositions, nodes, createConnection, stopDraggingNode, stopPanning, setConnecting, stopResizingNode]);

    const handleEditorMouseDown = (e: MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('background-grid')) {
            deselectAll();
            handlePanMouseDown(e);
        }
    }

    const handleBackgroundDoubleClick = (e: MouseEvent<HTMLDivElement>) => {
        if (e.target !== e.currentTarget) return;
        setAddNodeMenu({
            visible: true,
            position: { x: e.clientX, y: e.clientY }
        });
    };

    const handleContextMenu = (e: MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('background-grid')) {
            e.preventDefault();
            setAddNodeMenu({
                visible: true,
                position: { x: e.clientX, y: e.clientY },
            });
        }
    };

    const handleAddNode = useCallback((nodeType: EnumNodeType) => {
        if (!addNodeMenu?.position) return;
        const worldPos = getPositionInWorldSpace(addNodeMenu.position);
        addNode(nodeType, worldPos, addNodeMenu.connectionContext);
        setAddNodeMenu(null);
    }, [addNodeMenu, getPositionInWorldSpace, addNode]);

    const handleOpenAddNodeMenu = useCallback(() => {
        if (!editorRef.current) return;
        const editorRect = editorRef.current.getBoundingClientRect();
        setAddNodeMenu({
            visible: true,
            position: {
                x: editorRect.left + editorRect.width / 2 - 128, // Center menu
                y: editorRect.top + editorRect.height / 2 - 100,
            }
        });
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                handleOpenAddNodeMenu();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                if (!isWorkflowRunning) {
                    runWorkflow();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleOpenAddNodeMenu, runWorkflow, isWorkflowRunning]);

    // Effect to manage the temporary connection path
    useEffect(() => {
        if (connecting && !tempConnectionPathRef.current && svgRef.current && editorRef.current) {
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("stroke", "#06b6d4"); path.setAttribute("stroke-width", "3");
            path.setAttribute("fill", "none"); path.style.pointerEvents = "none";
            svgRef.current.appendChild(path);
            tempConnectionPathRef.current = path;
        }
    }, [connecting, editorRef]);


    const getPortCenter = (nodeId: string, portId: string): Point | null => {
        const portKey = `${nodeId}:${portId}`;
        const portPos = portPositions[portKey];
        if (!portPos || !editorRef.current) return null;
        const editorRect = editorRef.current.getBoundingClientRect();
        return getPositionInWorldSpace({
            x: portPos.rect.left + portPos.rect.width / 2,
            y: portPos.rect.top + portPos.rect.height / 2,
        });
    };

    return (
        <div className="w-screen h-screen flex bg-slate-900 text-white">
            <div
                ref={editorRef}
                className="flex-grow h-full overflow-hidden relative cursor-default"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseDown={handleEditorMouseDown}
                onWheel={handleWheel}
                onDoubleClick={handleBackgroundDoubleClick}
                onContextMenu={handleContextMenu}
            >
                <div className="absolute inset-0 bg-slate-900 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] background-grid"></div>

                <div
                    className="absolute top-0 left-0"
                    style={{
                        transform: `translate(${viewTransform.x}px, ${viewTransform.y}px) scale(${viewTransform.scale})`,
                        transformOrigin: '0 0'
                    }}
                >
                    <svg ref={svgRef} className="absolute top-0 left-0 pointer-events-none" style={{ overflow: 'visible' }}>
                        <g className="pointer-events-auto">
                            {connections.map(conn => {
                                const fromPoint = getPortCenter(conn.fromNodeId, conn.fromPortId);
                                const toPoint = getPortCenter(conn.toNodeId, conn.toPortId);
                                return fromPoint && toPoint ? (
                                    <Connection key={conn.id} from={fromPoint} to={toPoint}
                                        isSelected={conn.id === selectedConnectionId}
                                        onClick={() => handleConnectionClick(conn.id)}
                                    />
                                ) : null;
                            })}
                        </g>
                    </svg>

                    {nodes.map(node => (
                        <Node key={node.id} node={node} isSelected={node.id === selectedNodeId}
                            onMouseDown={handleNodeMouseDown} onPortMouseDown={handlePortMouseDown}
                            onResizeMouseDown={handleResizeMouseDown}
                            setPortRef={setPortRef} updateNodeData={updateNodeData} updateNode={updateNode}
                        />
                    ))}
                </div>

                <div
                    className="absolute bottom-2 left-2 pointer-events-auto z-[9999] bg-slate-800/50 backdrop-blur-sm p-2 rounded-lg border border-slate-700 flex items-center gap-2"
                    onPointerDown={(e) => { e.stopPropagation(); }}
                >
                    <Tooltip content="Run Workflow (Ctrl+Enter)" placement="top">
                        <button
                            onClick={runWorkflow}
                            disabled={isWorkflowRunning}
                            className="flex items-center justify-center w-12 h-10 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-600 disabled:text-slate-400 rounded-lg transition-colors"
                            aria-label="Run Workflow"
                        >
                            {isWorkflowRunning ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <PlayIcon className="w-5 h-5" />}
                        </button>
                    </Tooltip>
                     <Tooltip content="Image History" placement="top">
                        <button
                            onClick={() => setIsHistoryPanelVisible(true)}
                            className="flex items-center justify-center w-12 h-10 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                            aria-label="Show Image History"
                        >
                            <HistoryIcon className="w-5 h-5" />
                        </button>
                    </Tooltip>
                    <Tooltip content="Rest View" placement="top">
                        <button
                            type="button"
                            onClick={resetView}
                            onPointerDown={(e) => { e.stopPropagation(); e.nativeEvent?.stopImmediatePropagation?.(); }}
                            className="w-12 h-8 rounded hover:bg-slate-700 text-xs"
                        >
                            {Math.round(viewTransform.scale * 100)}%
                        </button>
                    </Tooltip>
                </div>

                {addNodeMenu?.visible && (
                    <AddNodeMenu
                        position={addNodeMenu.position}
                        onSelect={handleAddNode}
                        onClose={() => setAddNodeMenu(null)}
                        sourceDataType={nodes.find(n => n.id === addNodeMenu.connectionContext?.fromNodeId)?.outputs.find(p => p.id === addNodeMenu.connectionContext?.fromPortId)?.dataType}
                    />
                )}
            </div>
            {isHistoryPanelVisible && (
                <HistoryPanel
                    history={history}
                    onClose={() => setIsHistoryPanelVisible(false)}
                />
            )}
        </div>
    );
};

export default App;
