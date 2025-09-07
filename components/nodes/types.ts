import { Node as NodeType } from '../../types';

export interface NodeContentProps {
    node: NodeType;
    updateNodeData: (nodeId: string, data: Record<string, any>) => void;
    updateNode: (nodeId: string, updates: Partial<NodeType>) => void;
}