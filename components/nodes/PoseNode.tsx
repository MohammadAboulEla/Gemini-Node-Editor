
import React, { useRef } from 'react';
import { NodeContentProps } from './types';

interface JointPosition {
    x: number; // percentage 0-100
    y: number; // percentage 0-100
}

const JOINT_CONNECTIONS: [string, string, string][] = [
    ['head', 'neck', '#ff0000'],
    ['neck', 'leftShoulder', '#00ff00'],
    ['neck', 'rightShoulder', '#00ff00'],
    ['leftShoulder', 'leftElbow', '#00ff00'],
    ['rightShoulder', 'rightElbow', '#00ff00'],
    ['leftElbow', 'leftWrist', '#00ff00'],
    ['rightElbow', 'rightWrist', '#00ff00'],
    ['neck', 'torso', '#0000ff'],
    ['torso', 'leftHip', '#ffff00'],
    ['torso', 'rightHip', '#ffff00'],
    ['leftHip', 'leftKnee', '#ffff00'],
    ['rightHip', 'rightKnee', '#ffff00'],
    ['leftKnee', 'leftAnkle', '#ffff00'],
    ['rightKnee', 'rightAnkle', '#ffff00']
];

export const PoseNode: React.FC<NodeContentProps> = ({ node, updateNodeData }) => {
    const joints = node.data.joints as Record<string, JointPosition>;
    const outputMode = node.data.outputMode || 'skeleton';
    const svgRef = useRef<SVGSVGElement>(null);
    const activeJointRef = useRef<string | null>(null);

    const handlePointerDown = (jointKey: string, e: React.PointerEvent) => {
        e.stopPropagation();
        // Capture the pointer on the SVG itself to handle fast movement outside the circle
        if (svgRef.current) {
            svgRef.current.setPointerCapture(e.pointerId);
        }
        activeJointRef.current = jointKey;
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!activeJointRef.current || !svgRef.current) return;
        
        // Calculate coordinates relative to SVG viewBox (0-100)
        const CTM = svgRef.current.getScreenCTM();
        if (!CTM) return;

        const pt = svgRef.current.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgPt = pt.matrixTransform(CTM.inverse());

        const x = Math.max(0, Math.min(100, svgPt.x));
        const y = Math.max(0, Math.min(100, svgPt.y));

        const newJoints = { ...joints, [activeJointRef.current]: { x, y } };
        updateNodeData(node.id, { joints: newJoints });
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (activeJointRef.current && svgRef.current) {
            svgRef.current.releasePointerCapture(e.pointerId);
        }
        activeJointRef.current = null;
    };

    return (
        <div className="p-2 h-full flex flex-col rounded-md bg-slate-800 overflow-hidden">
            {/* 1. Moved Parameter to Top */}
            <div className="flex-shrink-0 mb-2 space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 ml-1 block">Output Mode</label>
                <select
                    value={outputMode}
                    onChange={(e) => updateNodeData(node.id, { outputMode: e.target.value })}
                    className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500 text-xs text-slate-300"
                >
                    <option value="skeleton">Standard Skeleton</option>
                    <option value="monochrome">High Contrast (B&W)</option>
                </select>
            </div>

            <div className="flex-grow relative select-none min-h-0">
                <svg
                    ref={svgRef}
                    className="w-full h-full bg-slate-900 rounded border border-slate-700/50 touch-none shadow-inner cursor-crosshair"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="xMidYMid meet"
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                >
                    {/* Skeleton Lines - 2. Always Colored in Preview */}
                    {JOINT_CONNECTIONS.map(([from, to, color], i) => {
                        const jFrom = joints[from];
                        const jTo = joints[to];
                        if (!jFrom || !jTo) return null;
                        return (
                            <line
                                key={i}
                                x1={jFrom.x}
                                y1={jFrom.y}
                                x2={jTo.x}
                                y2={jTo.y}
                                stroke={color}
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                className="opacity-80"
                            />
                        );
                    })}

                    {/* Joint Handles */}
                    {Object.entries(joints).map(([key, pos]) => (
                        <circle
                            key={key}
                            cx={pos.x}
                            cy={pos.y}
                            r={activeJointRef.current === key ? "4" : "3"}
                            fill={activeJointRef.current === key ? '#06b6d4' : '#475569'}
                            stroke={activeJointRef.current === key ? '#fff' : 'rgba(255,255,255,0.2)'}
                            strokeWidth="0.5"
                            className="cursor-move hover:fill-cyan-400 transition-colors"
                            onPointerDown={(e) => handlePointerDown(key, e)}
                        />
                    ))}
                </svg>
                <div className="absolute top-2 right-2 text-[8px] uppercase tracking-tighter font-bold text-slate-600 pointer-events-none bg-slate-900/50 px-1 rounded">
                    Editor View
                </div>
            </div>
        </div>
    );
};
