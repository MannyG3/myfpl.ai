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
      <div className="rounded-2xl border border-[#3B1348] bg-[#1F0A29] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-lg font-black text-white">Points & Rankings</h2>
          <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300">
            Live
          </span>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-[#0b1d3d] via-[#112c5b] to-[#3a3ea6] p-5 text-white shadow-lg shadow-indigo-500/10">
          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-200/80">
            Gameweek {currentGameweek} points
          </div>
          <div className="mt-2 text-5xl font-black leading-none">{eventPoints}</div>
          <div className="mt-2 text-sm text-slate-200">
            Average {averagePoints} • Highest {highestPoints}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-[#3B1348] bg-[#2B0032] p-3">
            <div className="text-3xl font-black text-white">{totalPoints}</div>
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#C9B7D4]">Overall</div>
          </div>
          <div className="rounded-xl border border-[#3B1348] bg-[#2B0032] p-3">
            <div className="text-3xl font-black text-white">
              {overallRank ? overallRank.toLocaleString() : '—'}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#C9B7D4]">Rank</div>
          </div>
          <div className="rounded-xl border border-[#3B1348] bg-[#2B0032] p-3">
            <div className="text-2xl font-black text-white">{averagePoints}</div>
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#C9B7D4]">Average</div>
          </div>
          <div className="rounded-xl border border-[#3B1348] bg-[#2B0032] p-3">
            <div className="text-2xl font-black text-white">{highestPoints}</div>
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#C9B7D4]">Best GW</div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#3B1348] bg-[#1F0A29] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
        <h2 className="mb-4 text-lg font-black text-white">Club Profile</h2>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 via-indigo-500 to-violet-500 font-black text-xl text-white shadow-lg shadow-indigo-500/25">
            FC
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#C9B7D4]">Squad value</div>
            <div className="mt-1 text-2xl font-black text-white">£{computedValue.toFixed(1)}m</div>
            <div className="mt-1 text-xs text-[#C9B7D4]">Bank: £{bank.toFixed(1)}m</div>
          </div>
        </div>
      </div>
    </div>
  );
}
