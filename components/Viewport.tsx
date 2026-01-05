import React from 'react';
import { Node as NodeType, Connection as ConnectionType, Point, SelectionBox } from '../types';
import Node from './Node';
import Connection from './Connection';

interface ViewportProps {
  nodes: NodeType[];
  connections: ConnectionType[];
  selectedNodeIds: string[];
  selectedConnectionId: string | null;
  viewTransform: { x: number; y: number; scale: number };
  selectionBox: SelectionBox | null;
  svgRef: React.RefObject<SVGSVGElement | null>;
  getPortCenter: (nodeId: string, portId: string) => Point | null;
  handleNodeMouseDown: (e: React.MouseEvent<HTMLDivElement>, nodeId: string) => void;
  handlePortMouseDown: (e: React.MouseEvent<HTMLDivElement>, nodeId: string, portId: string) => void;
  handleResizeMouseDown: (e: React.MouseEvent<HTMLDivElement>, nodeId: string) => void;
  handleNodeContextMenu: (e: React.MouseEvent<HTMLDivElement>, nodeId: string) => void;
  handleConnectionClick: (id: string) => void;
  setPortRef: (nodeId: string, portId: string, el: HTMLDivElement | null) => void;
  updateNodeData: (nodeId: string, data: Record<string, any>) => void;
  updateNode: (nodeId: string, updates: Partial<NodeType>) => void;
}

const Viewport: React.FC<ViewportProps> = ({
  nodes,
  connections,
  selectedNodeIds,
  selectedConnectionId,
  viewTransform,
  selectionBox,
  svgRef,
  getPortCenter,
  handleNodeMouseDown,
  handlePortMouseDown,
  handleResizeMouseDown,
  handleNodeContextMenu,
  handleConnectionClick,
  setPortRef,
  updateNodeData,
  updateNode,
}) => {
  const renderSelectionBox = () => {
    if (!selectionBox) return null;
    const left = Math.min(selectionBox.start.x, selectionBox.current.x);
    const top = Math.min(selectionBox.start.y, selectionBox.current.y);
    const width = Math.abs(selectionBox.start.x - selectionBox.current.x);
    const height = Math.abs(selectionBox.start.y - selectionBox.current.y);

    return (
      <div
        className="absolute border border-cyan-500 bg-cyan-500/10 pointer-events-none z-[10001]"
        style={{ left, top, width, height }}
      />
    );
  };

  return (
    <>
      {renderSelectionBox()}
      <div
        className="absolute top-0 left-0"
        style={{
          transform: `translate(${viewTransform.x}px, ${viewTransform.y}px) scale(${viewTransform.scale})`,
          transformOrigin: '0 0',
        }}
      >
        <svg ref={svgRef} className="absolute top-0 left-0 pointer-events-none" style={{ overflow: 'visible' }}>
          <g className="pointer-events-auto">
            {connections.map((conn) => {
              const fromPoint = getPortCenter(conn.fromNodeId, conn.fromPortId);
              const toPoint = getPortCenter(conn.toNodeId, conn.toPortId);
              return fromPoint && toPoint ? (
                <Connection
                  key={conn.id}
                  from={fromPoint}
                  to={toPoint}
                  isSelected={conn.id === selectedConnectionId}
                  onClick={() => handleConnectionClick(conn.id)}
                />
              ) : null;
            })}
          </g>
        </svg>

        {nodes.map((node) => (
          <Node
            key={node.id}
            node={node}
            isSelected={selectedNodeIds.includes(node.id)}
            onMouseDown={handleNodeMouseDown}
            onPortMouseDown={handlePortMouseDown}
            onResizeMouseDown={handleResizeMouseDown}
            onContextMenu={handleNodeContextMenu}
            setPortRef={setPortRef}
            updateNodeData={updateNodeData}
            updateNode={updateNode}
          />
        ))}
      </div>
    </>
  );
};

export default Viewport;