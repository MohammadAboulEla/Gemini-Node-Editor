import React from 'react';
import Tooltip from './Tooltip';
import { PlayIcon, SpinnerIcon, HistoryIcon, TemplateIcon } from './icons';

interface ToolbarProps {
  isWorkflowRunning: boolean;
  nodesCount: number;
  isBuilding: boolean;
  scale: number;
  onRun: () => void;
  onShowHistory: () => void;
  onShowTemplates: () => void;
  onResetView: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  isWorkflowRunning,
  nodesCount,
  isBuilding,
  scale,
  onRun,
  onShowHistory,
  onShowTemplates,
  onResetView,
}) => {
  return (
    <div
      className="absolute bottom-2 left-2 pointer-events-auto z-[9999] bg-slate-800/50 backdrop-blur-sm p-1 rounded-lg border border-slate-700 flex items-center gap-1"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <Tooltip content="Run Workflow (Ctrl+Enter)" placement="top">
        <button
          onClick={onRun}
          disabled={isWorkflowRunning || nodesCount === 0 || isBuilding}
          className="flex items-center justify-center w-10 h-8 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-600 disabled:text-slate-400 rounded-lg transition-colors"
          aria-label="Run Workflow"
        >
          {isWorkflowRunning ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <PlayIcon className="w-5 h-5" />}
        </button>
      </Tooltip>

      <Tooltip content="Image History" placement="top">
        <button
          onClick={onShowHistory}
          className="flex items-center justify-center w-10 h-8 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          aria-label="Show Image History"
        >
          <HistoryIcon className="w-5 h-5" />
        </button>
      </Tooltip>

      <Tooltip content="Workflow Templates" placement="top">
        <button
          onClick={onShowTemplates}
          className="flex items-center justify-center w-10 h-8 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          aria-label="Workflow Templates"
          disabled={isBuilding}
        >
          <TemplateIcon className="w-5 h-5 text-cyan-400" />
        </button>
      </Tooltip>

      <Tooltip content="Reset View" placement="top">
        <button
          type="button"
          onClick={onResetView}
          onPointerDown={(e) => {
            e.stopPropagation();
            e.nativeEvent?.stopImmediatePropagation?.();
          }}
          className="w-12 h-8 rounded hover:bg-slate-700 text-xs text-white"
        >
          {Math.round(scale * 100)}%
        </button>
      </Tooltip>
    </div>
  );
};

export default Toolbar;