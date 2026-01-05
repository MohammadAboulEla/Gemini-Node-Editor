import React from 'react';

const BackgroundGrid: React.FC = () => {
  return (
    <div className="absolute inset-0 bg-slate-900 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] background-grid">
      <p className="text-gray-600 text-[10px] m-1 select-none">
        Developed By : Mohammad Aboul-Ela © 2026
      </p>
    </div>
  );
};

export default BackgroundGrid;