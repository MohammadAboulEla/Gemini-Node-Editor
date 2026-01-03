import React, { MouseEvent, WheelEvent, ReactNode } from 'react';
import { Node as NodeType, Connection as ConnectionType, NodeType as EnumNodeType, Point, SelectionBox } from '../types';
import Node from './Node';
import Connection from './Connection';
import { TemplateIcon, SpinnerIcon } from './icons';

interface CanvasWorkspaceProps {
    editorRef: React.RefObject<HTMLDivElement>;
    svgRef: React.RefObject<SVGSVGElement>;
    nodes: NodeType[];
    connections: ConnectionType[];
    viewTransform: { x: number; y: number; scale: number };
    selectedNodeIds: string[];
    selectedConnectionId: string | null;
    selectionBox: SelectionBox | null;
    isBuilding: boolean;
    connecting: any;
    
    // Event Handlers
    onMouseMove: (e: MouseEvent<HTMLDivElement>) => void;
    onMouseUp: (e: MouseEvent<HTMLDivElement>) => void;
    onMouseDown: (e: MouseEvent<HTMLDivElement>) => void;
    onWheel: (e: WheelEvent<HTMLDivElement>) => void;
    onDoubleClick: (e: MouseEvent<HTMLDivElement>) => void;
    onContextMenu: (e: MouseEvent<HTMLDivElement>) => void;
    
    // Node Handlers
    onNodeMouseDown: (e: MouseEvent<HTMLDivElement>, nodeId: string) => void;
    onPortMouseDown: (e: MouseEvent<HTMLDivElement>, nodeId: string, portId: string) => void;
    onResizeMouseDown: (e: MouseEvent<HTMLDivElement>, nodeId: string) => void;
    onConnectionClick: (connectionId: string) => void;
    
    // State Updates
    setPortRef: (nodeId: string, portId: string, el: HTMLDivElement | null) => void;
    updateNodeData: (nodeId: string, data: Record<string, any>) => void;
    updateNode: (nodeId: string, updates: Partial<NodeType>) => void;
    
    // Helper to get port position
    getPortCenter: (nodeId: string, portId: string) => Point | null;
    
    children?: ReactNode; // For the marquee selection box
}

const CanvasWorkspace: React.FC<CanvasWorkspaceProps> = ({
    editorRef, svgRef, nodes, connections, viewTransform,
    selectedNodeIds, selectedConnectionId, selectionBox,
    isBuilding, connecting,
    onMouseMove, onMouseUp, onMouseDown, onWheel, onDoubleClick, onContextMenu,
    onNodeMouseDown, onPortMouseDown, onResizeMouseDown, onConnectionClick,
    setPortRef, updateNodeData, updateNode, getPortCenter, children
}) => {
    
    return (
        <div
            ref={editorRef}
            className="flex-grow h-full overflow-hidden relative cursor-default"
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseDown={onMouseDown}
            onWheel={onWheel}
            onDoubleClick={onDoubleClick}
            onContextMenu={onContextMenu}
        >
            {/* Background Grid */}
            <div className="absolute inset-0 bg-slate-900 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] background-grid">
                <p className="text-gray-600 text-sm m-1 select-none">
                    Copyright © 2026 Mohammad Aboul-Ela
                </p>
            </div>

            {/* Marquee Selection Layer */}
            {children}

            {/* Empty State */}
            {nodes.length === 0 && !isBuilding && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-40 select-none transition-opacity duration-300">
                    <TemplateIcon className="w-16 h-16 text-slate-600 mb-4" />
                    <h2 className="text-xl font-bold text-slate-500">Empty Canvas</h2>
                    <p className="text-slate-600">Select a template below or Ctrl+Drag to select</p>
                </div>
            )}

            {/* Building State Overlay */}
            {isBuilding && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-800/90 backdrop-blur-md border border-cyan-500/50 rounded-full text-cyan-400 text-sm font-bold z-[2000] flex items-center gap-3 shadow-2xl animate-in fade-in slide-in-from-top-4">
                    <SpinnerIcon className="w-5 h-5 animate-spin" />
                    Generating Workflow Layout...
                </div>
            )}

            {/* Transformed Content Area */}
            <div
                className="absolute top-0 left-0"
                style={{
                    transform: `translate(${viewTransform.x}px, ${viewTransform.y}px) scale(${viewTransform.scale})`,
                    transformOrigin: '0 0'
                }}
            >
                {/* Connections Layer (SVG) */}
                <svg ref={svgRef} className="absolute top-0 left-0 pointer-events-none" style={{ overflow: 'visible' }}>
                    <g className="pointer-events-auto">
                        {connections.map(conn => {
                            const fromPoint = getPortCenter(conn.fromNodeId, conn.fromPortId);
                            const toPoint = getPortCenter(conn.toNodeId, conn.toPortId);
                            return fromPoint && toPoint ? (
                                <Connection 
                                    key={conn.id} 
                                    from={fromPoint} 
                                    to={toPoint}
                                    isSelected={conn.id === selectedConnectionId}
                                    onClick={() => onConnectionClick(conn.id)}
                                />
                            ) : null;
                        })}
                    </g>
                </svg>

                {/* Nodes Layer */}
                {nodes.map(node => (
                    <Node 
                        key={node.id} 
                        node={node} 
                        isSelected={selectedNodeIds.includes(node.id)}
                        onMouseDown={onNodeMouseDown} 
                        onPortMouseDown={onPortMouseDown}
                        onResizeMouseDown={onResizeMouseDown}
                        setPortRef={setPortRef} 
                        updateNodeData={updateNodeData} 
                        updateNode={updateNode}
                    />
                ))}
            </div>
        </div>
    );
};

export default CanvasWorkspace;
