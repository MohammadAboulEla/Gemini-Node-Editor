export enum NodeType {
  ImageLoader = 'IMAGE_LOADER',
  Prompt = 'PROMPT',
  ImageGenerator = 'IMAGE_GENERATOR',
  Preview = 'PREVIEW',
  ImageStitcher = 'IMAGE_STITCHER',
  ImageDescriber = 'IMAGE_DESCRIBER',
}

export interface Point {
  x: number;
  y: number;
}

export interface NodePort {
  id: string;
  type: 'input' | 'output';
  dataType: 'image' | 'text' | 'any';
  label?: string;
}

export interface Node {
  id: string;
  type: NodeType;
  position: Point;
  width?: number;
  height?: number;
  resizable?: boolean;
  minWidth?: number;
  minHeight?: number;
  title: string;
  inputs: NodePort[];
  outputs: NodePort[];
  data: Record<string, any>;
}

export interface Connection {
  id: string;
  fromNodeId: string;
  fromPortId: string;
  toNodeId: string;
  toPortId: string;
}

export interface DraggingNodeState {
  id: string;
  offset: Point;
}

export interface ResizingNodeState {
  id: string;
  initialWidth: number;
  initialHeight: number;
  startPoint: Point;
}

export interface ConnectingState {
  fromNodeId: string;
  fromPortId: string;
  fromPortRect: DOMRect;
}

export type PortPositions = Record<string, {
    nodeId: string;
    portId: string;
    rect: DOMRect;
}>;