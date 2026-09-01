'use client';

import { ProcessedPlayer } from '@/types/fpl';

interface TeamOverviewProps {
  currentGameweek: number;
  squad: ProcessedPlayer[];
  totalPoints?: number;
  overallRank?: number;
  eventPoints?: number;
  averagePoints?: number;
  highestPoints?: number;
  squadValue?: number;
  bank?: number;
}

export default function TeamOverview({
  currentGameweek = 1,
  squad = [],
  totalPoints = 0,
  overallRank = 0,
  eventPoints = 0,
  averagePoints = 0,
  highestPoints = 0,
  squadValue,
  bank = 0,
}: TeamOverviewProps) {
  const computedValue = Number(
    (squadValue ?? squad.reduce((sum, p) => sum + (p.price || 0), 0)).toFixed(1)
  );
  return (
    <div className="space-y-6">
      {/* 1. Section Heading: Points & Rankings */}
      <div>
        <h2 className="text-xl font-bold text-white mb-3">
          Points & Rankings
        </h2>

        {/* 2. Key Stats Row (Number-over-label pairs on dark background, with one highlighted cyan card) */}
        <div className="bg-[#1F0A29] border border-[#3B1348] rounded-xl p-5 space-y-5">
          {/* Highlighted Stat Card (Bright Cyan #04F5FF Accent Moment) */}
          <div className="bg-[#04F5FF] text-[#37003C] rounded-lg p-4 font-sans">
            <span className="text-[#37003C] text-xs font-semibold block mb-0.5">
              Gameweek {currentGameweek} points
            </span>
            <div className="text-5xl font-black leading-none">
              {eventPoints}
            </div>
            <span className="text-xs font-bold text-[#37003C]/80 mt-1 block">
              Average: {averagePoints} • Highest: {highestPoints}
            </span>
          </div>

          {/* Stats List */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#3B1348]">
            <div>
              <div className="text-4xl font-extrabold text-white leading-none">
                {totalPoints}
              </div>
              <span className="text-xs text-[#C9B7D4] block mt-1">
                Overall points
              </span>
            </div>

            <div>
              <div className="text-4xl font-extrabold text-white leading-none">
                {overallRank ? overallRank.toLocaleString() : '—'}
              </div>
              <span className="text-xs text-[#C9B7D4] block mt-1">
                Overall rank
              </span>
            </div>

            <div>
              <div className="text-3xl font-extrabold text-white leading-none">
                {averagePoints}
              </div>
              <span className="text-xs text-[#C9B7D4] block mt-1">
                Average points
              </span>
            </div>

            <div>
              <div className="text-3xl font-extrabold text-white leading-none">
                {highestPoints}
              </div>
              <span className="text-xs text-[#C9B7D4] block mt-1">
                Highest points
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Team Badge & Quick Info */}
      <div className="bg-[#1F0A29] border border-[#3B1348] rounded-xl p-5">
        <h2 className="text-xl font-bold text-white mb-3">
          Team Badge
        </h2>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-[#963CFF] to-[#04F5FF] p-1 flex items-center justify-center">
            <div className="h-full w-full bg-[#1F0A29] rounded-full flex items-center justify-center font-black text-xl text-white">
              FC
            </div>
          </div>
          <div>
            <span className="text-xs text-[#C9B7D4] block">Squad Value</span>
            <span className="text-lg font-bold text-white">£{computedValue.toFixed(1)}m</span>
            <span className="text-xs text-[#C9B7D4] block mt-1">In the bank: £{bank.toFixed(1)}m</span>
          </div>
        </div>
      </div>
    </div>
  );
}
