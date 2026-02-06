
import React from 'react';
import { NodeContentProps } from './types';
import { UnifiedCanvas } from '../canvas/UnifiedCanvas';

export const SketchNode: React.FC<NodeContentProps> = ({ node, updateNodeData }) => {
    return (
        <div className="p-2 h-full">
            <UnifiedCanvas 
                nodeId={node.id} 
                updateNodeData={updateNodeData} 
                base64Image={null} 
                mimeType={null}
                initialElements={node.data.elements}
            />
        </div>
    );
};
