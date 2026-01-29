import React from 'react';

interface StatsOverlayProps {
  difficulty: string;
  wordsLearned: number;
  userState: string; // For debugging/feedback
}

const StatsOverlay: React.FC<StatsOverlayProps> = ({ difficulty, wordsLearned, userState }) => {
  return (
    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md p-4 rounded-xl text-white border border-white/10 shadow-lg pointer-events-none">
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Session Stats</h3>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm">Difficulty</span>
          <span className={`text-sm font-bold ${difficulty === 'Hard' ? 'text-red-400' : 'text-green-400'}`}>
            {difficulty}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm">Words Learned</span>
          <span className="text-sm font-bold text-blue-400">{wordsLearned}</span>
        </div>
        <div className="pt-2 border-t border-white/10 mt-2">
           <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-gray-400">User State</span>
            <span className="text-xs font-mono text-yellow-400">{userState}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsOverlay;
