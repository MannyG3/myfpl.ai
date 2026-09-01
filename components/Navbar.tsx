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
    <header className="w-full">
      {/* 1. Header/Nav Bar (#2B0032) */}
      <div className="bg-[#2B0032] border-b border-[#3B1348] px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Premier League Lion Icon Badge */}
            <div className="h-9 w-9 rounded-full bg-[#04F5FF] flex items-center justify-center font-black text-[#37003C] text-lg tracking-tighter">
              PL
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-extrabold text-xl text-white tracking-tight">
                Fantasy
              </span>
              <span className="text-xs font-semibold text-[#04F5FF] tracking-wider uppercase">
                Premier League Analyser
              </span>
            </div>
          </div>

          {/* Sync Team ID Form */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <div className="relative">
              <span className="text-xs text-[#C9B7D4] absolute left-3 top-1/2 -translate-y-1/2 font-mono">
                ID:
              </span>
              <input
                type="text"
                value={inputTeamId}
                onChange={(e) => setInputTeamId(e.target.value)}
                placeholder="Team ID"
                className="bg-[#1F0A29] border border-[#3B1348] focus:border-[#04F5FF] text-white text-sm rounded-full pl-9 pr-3 py-1 w-28 font-mono focus:outline-none transition"
              />
            </div>
            <button
              type="submit"
              disabled={isSyncing}
              className="bg-[#4A0E5C] hover:bg-[#5C1473] text-white font-semibold text-xs px-4 py-1.5 rounded-full transition flex items-center gap-1.5 border border-[#3B1348]"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Data'}
            </button>
          </form>
        </div>
      </div>

      {/* 2. Hero Banner (Cyan #04F5FF fading into violet #963CFF) */}
      <div className="bg-gradient-to-br from-[#04F5FF] via-[#5C23D9] to-[#963CFF] text-[#37003C] px-4 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#37003C]/80 block">
              Fantasy Premier League • Gameweek {currentGameweek || 1}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-sm">
              {teamName}
            </h1>
            <p className="text-sm font-semibold text-[#37003C] mt-0.5">
              {playerFirstName} {playerLastName} • ID: {teamId}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Horizontal Tab Navigation with White Underline */}
      <div className="bg-[#2B0032] border-b border-[#3B1348] px-4 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-6 text-sm font-bold text-[#C9B7D4] overflow-x-auto scrollbar-none">
          <span className="py-3 cursor-pointer hover:text-white transition">Pick Team</span>
          <span className="py-3 cursor-pointer text-white border-b-2 border-white">Points</span>
          <span className="py-3 cursor-pointer hover:text-white transition">Transfers</span>
          <span className="py-3 cursor-pointer hover:text-white transition">Leagues & Cups</span>
          <span className="py-3 cursor-pointer hover:text-white transition flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#04F5FF]"></span>
            FPL Analyser
          </span>
        </div>
      </div>
    </header>
  );
}
