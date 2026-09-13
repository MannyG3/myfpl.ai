'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

interface NavbarProps {
  currentGameweek: number;
  teamId: number;
  teamName?: string;
  playerFirstName?: string;
  playerLastName?: string;
  onSync: (newTeamId: number) => void;
  isSyncing: boolean;
}

export default function Navbar({
  currentGameweek,
  teamId,
  teamName = 'My FPL Team',
  playerFirstName = 'FPL',
  playerLastName = 'Manager',
  onSync,
  isSyncing,
}: NavbarProps) {
  const [inputTeamId, setInputTeamId] = useState(teamId.toString());

  useEffect(() => {
    setInputTeamId(teamId.toString());
  }, [teamId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(inputTeamId, 10);
    if (!isNaN(id) && id > 0) {
      onSync(id);
    }
  };

  return (
    <header className="w-full bg-[#0b1d3d] text-white shadow-[0_12px_30px_rgba(11,29,61,0.12)]">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#5fe7ff] text-xs font-black text-[#0b1d3d] shadow-lg shadow-cyan-500/25">
              PL
            </div>
            <div className="leading-none">
              <div className="text-xl font-black tracking-tight">Fantasy</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-300/90">
                Premier League
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <label className="relative block">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                ID
              </span>
              <input
                type="text"
                value={inputTeamId}
                onChange={(e) => setInputTeamId(e.target.value)}
                placeholder="Team ID"
                className="w-24 rounded-full border border-white/10 bg-slate-900/80 py-2 pl-9 pr-2 text-sm text-white outline-none transition focus:border-cyan-400 sm:w-28"
              />
            </label>
            <button
              type="submit"
              disabled={isSyncing}
              className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#0b1d3d] transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing' : 'Sync'}
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-4 py-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-200/80">
              Gameweek {currentGameweek || 1}
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white md:text-4xl">
              {teamName}
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              {playerFirstName} {playerLastName} • Team ID {teamId}
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-400/40 bg-gradient-to-r from-cyan-500/15 via-indigo-500/10 to-violet-500/15 p-3 px-5 shadow-inner shadow-cyan-500/10">
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-100/80">
              FPL Analyser
            </div>
            <div className="mt-1 text-lg font-black text-white">Live team insight</div>
          </div>
        </div>

        <nav aria-label="Dashboard sections" className="flex gap-6 overflow-x-auto border-t border-white/10 py-3 text-sm font-semibold text-slate-300">
          <a href="#points" aria-current="page" className="whitespace-nowrap border-b-2 border-white pb-3 text-white">My Team</a>
          <a href="#points" className="whitespace-nowrap pb-3 transition hover:text-white">Points</a>
          <a href="#transfers" className="whitespace-nowrap pb-3 transition hover:text-white">Transfers</a>
          <a href="#insights" className="whitespace-nowrap pb-3 transition hover:text-white">Insights</a>
        </nav>
      </div>
      <nav aria-label="Mobile dashboard navigation" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-white/10 bg-[#0b1d3d]/95 p-2 text-center text-[10px] font-bold uppercase tracking-[0.08em] text-slate-300 shadow-2xl backdrop-blur md:hidden">
        <a href="#points" className="rounded-lg px-2 py-2 hover:bg-white/10 hover:text-white">Overview</a>
        <a href="#squad" className="rounded-lg px-2 py-2 hover:bg-white/10 hover:text-white">Squad</a>
        <a href="#transfers" className="rounded-lg px-2 py-2 hover:bg-white/10 hover:text-white">Transfers</a>
        <a href="#insights" className="rounded-lg px-2 py-2 hover:bg-white/10 hover:text-white">Insights</a>
      </nav>
    </header>
  );
}
