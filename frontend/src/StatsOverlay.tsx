import React from 'react';

interface StatsOverlayProps {
  totalWordsLearned: number;
  totalWordsSeen: number;
}

const StatsOverlay: React.FC<StatsOverlayProps> = ({ totalWordsLearned, totalWordsSeen }) => {
  return (
    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md p-4 rounded-xl text-white border border-white/10 shadow-lg pointer-events-none">
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Session Stats</h3>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm">Words Learned</span>
          <span className="text-sm font-bold text-green-400">{totalWordsLearned}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm">Words Seen</span>
          <span className="text-sm font-bold text-blue-400">{totalWordsSeen}</span>
        </div>
      </div>
    </div>
  );
};

export default StatsOverlay;