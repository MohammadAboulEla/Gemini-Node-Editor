import React, { useState, useCallback, useRef, MouseEvent, useEffect } from 'react';
import { Node as NodeType, Connection as ConnectionType, NodeType as EnumNodeType, Point } from './types';
import AddNodeMenu from './components/AddNodeMenu';
import NodeContextMenu from './components/NodeContextMenu';
import { SpinnerIcon, TemplateIcon } from './components/icons';
import HistoryPanel from './components/HistoryPanel';
import WorkflowTemplatesPanel, { WorkflowTemplate } from './components/WorkflowTemplatesPanel';
import SettingsPanel from './components/SettingsPanel';
import ImagePreviewModal from './components/ImagePreviewModal';
import BackgroundGrid from './components/BackgroundGrid';
import Toolbar from './components/Toolbar';
import Viewport from './components/Viewport';

import { useViewTransform } from './hooks/useViewTransform';
import { useEditor } from './hooks/useEditor';
import { useWorkflow } from './hooks/useWorkflow';

const INITIAL_NODES: NodeType[] = [];
const INITIAL_CONNECTIONS: ConnectionType[] = [];

interface AddNodeMenuState {
    visible: boolean;
    position: Point;
    connectionContext?: {
        fromNodeId: string;
        fromPortId: string;
        portType: 'input' | 'output';
    };
}

interface NodeContextMenuState {
    visible: boolean;
    position: Point;
    nodeId: string;
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
    const [nodeContextMenu, setNodeContextMenu] = useState<NodeContextMenuState | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isHistoryPanelVisible, setIsHistoryPanelVisible] = useState(false);
    const [isTemplatesPanelVisible, setIsTemplatesPanelVisible] = useState(false);
    const [isSettingsPanelVisible, setIsSettingsPanelVisible] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const [isBuilding, setIsBuilding] = useState(false);

    const {
        viewTransform, handleWheel, handlePanMouseDown, handlePanMouseMove,
        stopPanning, resetView, getPositionInWorldSpace
    } = useViewTransform(editorRef);

    const {
        nodes, setNodes, connections, setConnections, connecting, setConnecting, selectedNodeIds, selectedConnectionId,
        portPositions, selectionBox, updateNodeData, updateNode, deleteNodes, deselectAll, handleNodeMouseDown, handlePortMouseDown,
        handleConnectionClick, handleNodeDrag, stopDraggingNode, createConnection, addNode, setPortRef,
        handleResizeMouseDown, handleNodeResize, stopResizingNode, startSelectionBox, updateSelectionBox, endSelectionBox
    } = useEditor(INITIAL_NODES, INITIAL_CONNECTIONS, viewTransform, getPositionInWorldSpace);

    const addToHistory = useCallback((imageUrl: string) => {
        setHistory(prevHistory => {
            if (prevHistory.some(item => item.imageUrl === imageUrl)) return prevHistory;
            return [{ id: `hist-${Date.now()}`, imageUrl }, ...prevHistory];
        });
    }, []);

    const { isWorkflowRunning, runWorkflow } = useWorkflow(nodes, connections, updateNodeData, addToHistory);

    const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
        if (selectionBox) {
            updateSelectionBox(e);
            return;
        }
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
            
            // To keep the bezier curves logically flowing left-to-right (Output to Input)
            const pathStart = connecting.portType === 'output' ? fromPoint : toPoint;
            const pathEnd = connecting.portType === 'output' ? toPoint : fromPoint;

            tempConnectionPathRef.current.setAttribute('d', createPathData(pathStart, pathEnd));
        }
    }, [handlePanMouseMove, handleNodeDrag, handleNodeResize, connecting, viewTransform, getPositionInWorldSpace, selectionBox, updateSelectionBox]);

    const handleMouseUp = useCallback((e: MouseEvent<HTMLDivElement>) => {
        if (selectionBox) { endSelectionBox(); return; }
        if (tempConnectionPathRef.current) { tempConnectionPathRef.current.remove(); tempConnectionPathRef.current = null; }

        if (connecting) {
            const toPort = (Object.values(portPositions) as { nodeId: string; portId: string; rect: DOMRect; portType: 'input' | 'output' }[]).find(p => {
                const { left, right, top, bottom } = p.rect;
                return e.clientX >= left && e.clientX <= right && e.clientY >= top && e.clientY <= bottom;
            });

            if (toPort && toPort.nodeId !== connecting.fromNodeId && toPort.portType !== connecting.portType) {
                if (connecting.portType === 'output') {
                    createConnection(connecting.fromNodeId, connecting.fromPortId, toPort.nodeId, toPort.portId);
                } else {
                    createConnection(toPort.nodeId, toPort.portId, connecting.fromNodeId, connecting.fromPortId);
                }
            } else if (!toPort) {
                setAddNodeMenu({ 
                    visible: true, 
                    position: { x: e.clientX, y: e.clientY }, 
                    connectionContext: { 
                        fromNodeId: connecting.fromNodeId, 
                        fromPortId: connecting.fromPortId,
                        portType: connecting.portType
                    } 
                });
            }
        }
        stopDraggingNode(); stopResizingNode(); setConnecting(null); stopPanning();
    }, [connecting, portPositions, createConnection, stopDraggingNode, stopPanning, setConnecting, stopResizingNode, selectionBox, endSelectionBox]);

    const handleAddNode = useCallback((nodeType: EnumNodeType) => {
        if (!addNodeMenu?.position) return;
        addNode(nodeType, getPositionInWorldSpace(addNodeMenu.position), addNodeMenu.connectionContext);
        setAddNodeMenu(null);
    }, [addNodeMenu, getPositionInWorldSpace, addNode]);

    const handleLoadTemplate = useCallback(async (template: WorkflowTemplate) => {
        setIsBuilding(true); setNodes([]); setConnections([]); resetView();
        await new Promise(r => setTimeout(r, 300));
        for (const node of JSON.parse(JSON.stringify(template.nodes))) {
            setNodes(prev => [...prev, node]);
            await new Promise(r => setTimeout(r, 150));
        }
        await new Promise(r => setTimeout(r, 200));
        setConnections(JSON.parse(JSON.stringify(template.connections))); resetView(); setIsBuilding(false);
    }, [setNodes, setConnections, resetView]);

    const getPortCenter = (nodeId: string, portId: string): Point | null => {
        const portPos = portPositions[`${nodeId}:${portId}`];
        if (!portPos || !editorRef.current) return null;
        return getPositionInWorldSpace({ x: portPos.rect.left + portPos.rect.width / 2, y: portPos.rect.top + portPos.rect.height / 2 });
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isWorkflowRunning) { e.preventDefault(); runWorkflow(); }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [runWorkflow, isWorkflowRunning]);

    useEffect(() => {
        if (connecting && !tempConnectionPathRef.current && svgRef.current) {
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("stroke", "#06b6d4"); path.setAttribute("stroke-width", "3");
            path.setAttribute("fill", "none"); path.style.pointerEvents = "none";
            svgRef.current.appendChild(path);
            tempConnectionPathRef.current = path;
        }
    }, [connecting]);

    // Calculate source data type for the search menu filter
    const getSourceDataType = () => {
        if (!addNodeMenu?.connectionContext) return undefined;
        const { fromNodeId, fromPortId, portType } = addNodeMenu.connectionContext;
        const node = nodes.find(n => n.id === fromNodeId);
        const port = portType === 'output' 
            ? node?.outputs.find(p => p.id === fromPortId)
            : node?.inputs.find(p => p.id === fromPortId);
        return port?.dataType;
    };

    return (
        <div className="w-screen h-screen flex bg-slate-900 text-white">
            <div ref={editorRef} className="flex-grow h-full overflow-hidden relative cursor-default" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onWheel={handleWheel}
                onMouseDown={(e) => { if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('background-grid')) { if (e.ctrlKey || e.metaKey) startSelectionBox(e); else { deselectAll(); handlePanMouseDown(e); } } }}
                onDoubleClick={(e) => { if (e.target === e.currentTarget) setAddNodeMenu({ visible: true, position: { x: e.clientX, y: e.clientY } }); }}
                onContextMenu={(e) => { if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('background-grid')) { e.preventDefault(); setAddNodeMenu({ visible: true, position: { x: e.clientX, y: e.clientY } }); } }}>
                
                <BackgroundGrid onOpenSettings={() => setIsSettingsPanelVisible(true)} />

                {nodes.length === 0 && !isBuilding && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-40 select-none transition-opacity duration-300">
                      <TemplateIcon className="w-16 h-16 text-slate-600 mb-4" />
                      <h2 className="text-xl font-bold text-slate-500">Empty Canvas</h2>
                      <p className="text-slate-600">Select a template below or right click and build</p>
                  </div>
                )}

                {isBuilding && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-800/90 backdrop-blur-md border border-cyan-500/50 rounded-full text-cyan-400 text-sm font-bold z-[2000] flex items-center gap-3 shadow-2xl animate-in fade-in slide-in-from-top-4">
                        <SpinnerIcon className="w-5 h-5 animate-spin" /> Generating Workflow Layout...
                    </div>
                )}

                <Viewport nodes={nodes} connections={connections} selectedNodeIds={selectedNodeIds} selectedConnectionId={selectedConnectionId} viewTransform={viewTransform} selectionBox={selectionBox} svgRef={svgRef} getPortCenter={getPortCenter} handleNodeMouseDown={handleNodeMouseDown} handlePortMouseDown={handlePortMouseDown} handleResizeMouseDown={handleResizeMouseDown} handleNodeContextMenu={(e, id) => { e.preventDefault(); setNodeContextMenu({ visible: true, position: { x: e.clientX, y: e.clientY }, nodeId: id }); }} handleConnectionClick={handleConnectionClick} setPortRef={setPortRef} updateNodeData={updateNodeData} updateNode={updateNode} deselectAll={deselectAll} />

                <Toolbar isWorkflowRunning={isWorkflowRunning} nodesCount={nodes.length} isBuilding={isBuilding} scale={viewTransform.scale} onRun={runWorkflow} onShowHistory={() => setIsHistoryPanelVisible(true)} onShowTemplates={() => setIsTemplatesPanelVisible(true)} onResetView={resetView} />

                {addNodeMenu?.visible && (
                    <AddNodeMenu 
                        position={addNodeMenu.position} 
                        onSelect={handleAddNode} 
                        onClose={() => setAddNodeMenu(null)} 
                        sourceDataType={getSourceDataType()}
                        sourceDirection={addNodeMenu.connectionContext?.portType}
                    />
                )}
                {nodeContextMenu?.visible && <NodeContextMenu position={nodeContextMenu.position} onClose={() => setNodeContextMenu(null)} onDelete={() => { deleteNodes([nodeContextMenu.nodeId]); setNodeContextMenu(null); }} onDuplicate={() => { const s = nodes.find(n => n.id === nodeContextMenu.nodeId); if (s) setNodes(prev => [...prev, { ...JSON.parse(JSON.stringify(s)), id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, position: { x: s.position.x + 30, y: s.position.y + 30 } }]); setNodeContextMenu(null); }} />}
            </div>
            {isHistoryPanelVisible && <HistoryPanel history={history} onClose={() => setIsHistoryPanelVisible(false)} onPreview={setPreviewImageUrl} />}
            {isTemplatesPanelVisible && <WorkflowTemplatesPanel onClose={() => setIsTemplatesPanelVisible(false)} onLoadTemplate={handleLoadTemplate} />}
            {isSettingsPanelVisible && <SettingsPanel onClose={() => setIsSettingsPanelVisible(false)} />}
            {previewImageUrl && <ImagePreviewModal imageUrl={previewImageUrl} onClose={() => setPreviewImageUrl(null)} />}
        </div>
    );
};

export default App;