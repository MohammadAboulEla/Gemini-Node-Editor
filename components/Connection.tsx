import React from 'react';
import { Point } from '../types';

interface ConnectionProps {
  from: Point;
  to: Point;
  isSelected: boolean;
  onClick: () => void;
}

const Connection: React.FC<ConnectionProps> = ({ from, to, isSelected, onClick }) => {
  const dx = to.x - from.x;
  const controlPointX1 = from.x + dx * 0.5;
  const controlPointY1 = from.y;
  const controlPointX2 = to.x - dx * 0.5;
  const controlPointY2 = to.y;

  const pathData = `M${from.x},${from.y} C${controlPointX1},${controlPointY1} ${controlPointX2},${controlPointY2} ${to.x},${to.y}`;

  const strokeColor = isSelected ? '#06b6d4' : '#475569'; // cyan-500 : slate-600
  const strokeWidth = isSelected ? '4' : '3';

  return (
    <g onClick={onClick} className="cursor-pointer">
      {/* Invisible wider path for easier clicking */}
      <path
        d={pathData}
        stroke="transparent"
        strokeWidth="20"
        fill="none"
      />
      {/* Visible path */}
      <path
        d={pathData}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        fill="none"
        className="transition-all duration-150"
      />
    </g>
  );
};

export default Connection;