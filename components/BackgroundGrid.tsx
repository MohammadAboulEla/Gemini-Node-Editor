import React from 'react';
import { CogIcon } from './icons';
import Tooltip from './Tooltip';

interface BackgroundGridProps {
  onOpenSettings: () => void;
}

const BackgroundGrid: React.FC<BackgroundGridProps> = ({ onOpenSettings }) => {
  return (
    <div className="absolute inset-0 bg-slate-900 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] background-grid">
      <p className="text-gray-600 text-[10px] m-1 select-none flex items-end gap-1">
        <Tooltip content="Settings" placement="top">
          <button
            type="button"
            className="p-0.5 hover:text-gray-400 -translate-y-0.5"
            aria-label="Settings"
            onClick={onOpenSettings}
          >
            <CogIcon className="w-3 h-3" />
          </button>
        </Tooltip>
        <span>Developed By : Mohammad Aboul-Ela © 2026</span>
      </p>
    </div>
  );
};

export default BackgroundGrid;