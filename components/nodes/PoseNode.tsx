import React, { useCallback, useRef } from 'react';
import { NodeContentProps } from './types';
import { Point } from '../../types';

interface JointPosition {
    x: number; // percentage 0-100
    y: number; // percentage 0-100
}

const JOINT_CONNECTIONS: [keyof any, keyof any, string][] = [
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
    const svgRef = useRef<SVGSVGElement>(null);
    const activeJointRef = useRef<string | null>(null);

    const handlePointerDown = (jointKey: string, e: React.PointerEvent) => {
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        activeJointRef.current = jointKey;
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!activeJointRef.current || !svgRef.current) return;
        
        const rect = svgRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
        const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

        const newJoints = { ...joints, [activeJointRef.current]: { x, y } };
        updateNodeData(node.id, { joints: newJoints });
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        activeJointRef.current = null;
    };

    return (
        <div className="p-2 h-full flex flex-col rounded-md bg-slate-800">
            <div className="flex-grow relative select-none">
                <svg
                    ref={svgRef}
                    className="w-full h-full bg-slate-900 rounded border border-slate-800 touch-none"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="xMidYMid meet"
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                >
                    {/* Skeleton Lines */}
                    {JOINT_CONNECTIONS.map(([from, to, color], i) => {
                        const jFrom = joints[from as string];
                        const jTo = joints[to as string];
                        if (!jFrom || !jTo) return null;
                        return (
                            <line
                                key={i}
                                x1={jFrom.x}
                                y1={jFrom.y}
                                x2={jTo.x}
                                y2={jTo.y}
                                stroke={color}
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                        );
                    })}

                    {/* Joint Handles */}
                    {Object.entries(joints).map(([key, pos]) => (
                        <circle
                            key={key}
                            cx={pos.x}
                            cy={pos.y}
                            r="3"
                            fill={activeJointRef.current === key ? '#06b6d4' : '#475569'}
                            className="cursor-move hover:fill-cyan-400 transition-colors"
                            onPointerDown={(e) => handlePointerDown(key, e)}
                        />
                    ))}
                </svg>
                <div className="absolute top-2 right-2 text-[10px] text-slate-500 pointer-events-none">
                    Drag joints to pose
                </div>
            </div>
        </div>
    );
};