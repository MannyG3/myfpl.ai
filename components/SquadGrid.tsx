'use client';

import { ProcessedPlayer } from '@/types/fpl';
import { ArrowDown, ArrowUp, Info } from 'lucide-react';
import { useMemo, useState } from 'react';

type SquadPlayer = ProcessedPlayer & {
  is_captain?: boolean;
  is_vice_captain?: boolean;
  is_bench?: boolean;
};

interface SquadGridProps {
  squad: SquadPlayer[];
  onSelectPlayer?: (player: ProcessedPlayer) => void;
}

const positionOrder = { GK: 1, DEF: 2, MID: 3, FWD: 4 };

export default function SquadGrid({ squad, onSelectPlayer }: SquadGridProps) {
  const [positionFilter, setPositionFilter] = useState<'ALL' | ProcessedPlayer['position']>('ALL');
  const [sortBy, setSortBy] = useState<'position' | 'security' | 'form' | 'price'>('position');
  const starters = useMemo(() => squad
    .filter((player) => !player.is_bench)
    .filter((player) => positionFilter === 'ALL' || player.position === positionFilter)
    .sort((a, b) => {
      if (sortBy === 'security') return b.minutesSecurityPercent - a.minutesSecurityPercent;
      if (sortBy === 'form') return b.formAdjustedFixtureScore - a.formAdjustedFixtureScore;
      if (sortBy === 'price') return b.price - a.price;
      return positionOrder[a.position] - positionOrder[b.position];
    }), [positionFilter, sortBy, squad]);
  const bench = squad.filter((player) => player.is_bench);

  const rows = {
    GK: starters.filter((player) => player.position === 'GK'),
    DEF: starters.filter((player) => player.position === 'DEF'),
    MID: starters.filter((player) => player.position === 'MID'),
    FWD: starters.filter((player) => player.position === 'FWD'),
  };

  return (
    <section className="space-y-5" aria-labelledby="starting-xi-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 id="starting-xi-title" className="text-xl font-black text-white">Starting XI</h2>
            <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-300">Live team</span>
          </div>
          <p className="mt-1 text-xs text-[#C9B7D4]">Tap a player to inspect form, minutes security, and fixture outlook.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="squad-position-filter">Filter by position</label>
          <select id="squad-position-filter" value={positionFilter} onChange={(event) => setPositionFilter(event.target.value as typeof positionFilter)} className="rounded-full border border-[#3B1348] bg-[#2B0032] px-2 py-1 text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-[#04F5FF]">
            <option value="ALL">All positions</option>
            <option value="GK">Goalkeepers</option>
            <option value="DEF">Defenders</option>
            <option value="MID">Midfielders</option>
            <option value="FWD">Forwards</option>
          </select>
          <label className="sr-only" htmlFor="squad-sort">Sort squad</label>
          <select id="squad-sort" value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} className="hidden rounded-full border border-[#3B1348] bg-[#2B0032] px-2 py-1 text-[11px] text-white sm:block focus:outline-none focus:ring-2 focus:ring-[#04F5FF]">
            <option value="position">Formation</option>
            <option value="security">Minutes</option>
            <option value="form">Form-Fx</option>
            <option value="price">Price</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-emerald-200/30 bg-[#1aa88f] p-2 shadow-[0_20px_40px_rgba(0,0,0,0.18)] sm:p-4">
        <div className="relative overflow-hidden rounded-xl border-2 border-white/60 bg-[#28b39c] px-2 py-5 sm:px-8 sm:py-7">
          <div className="pointer-events-none absolute inset-x-1/4 top-0 h-20 rounded-b-full border-2 border-t-0 border-white/60 opacity-90" />
          <div className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/40" />
          <div className="pointer-events-none absolute inset-x-1/4 bottom-0 h-20 rounded-t-full border-2 border-b-0 border-white/60 opacity-90" />
          <div className="relative z-10 space-y-5 sm:space-y-7">
            <PitchRow players={rows.GK} label="Goalkeeper" onSelectPlayer={onSelectPlayer} />
            <PitchRow players={rows.DEF} label="Defenders" onSelectPlayer={onSelectPlayer} />
            <PitchRow players={rows.MID} label="Midfielders" onSelectPlayer={onSelectPlayer} />
            <PitchRow players={rows.FWD} label="Forwards" onSelectPlayer={onSelectPlayer} />
          </div>
        </div>
        {starters.length === 0 && <p className="p-5 text-center text-xs text-white/80">No starting XI found. Sync your FPL team to load the pitch.</p>}
      </div>

      {bench.length > 0 && (
        <div className="rounded-2xl border border-[#3B1348] bg-[#d6f3eb] p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-2 text-[#153b3a]">
            <div>
              <h3 className="text-sm font-black">Bench</h3>
              <p className="text-[10px] font-medium text-[#47706b]">Substitutes in your current order</p>
            </div>
            <span className="rounded-full bg-white/70 px-2 py-1 text-[10px] font-bold">{bench.length} players</span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {bench.map((player, index) => <BenchPlayer key={player.id} player={player} index={index + 1} onSelectPlayer={onSelectPlayer} />)}
          </div>
        </div>
      )}

      <p className="flex items-center gap-1 text-[10px] text-[#C9B7D4]"><Info className="h-3 w-3" /> Fixture cards show next-four fixture difficulty. Open a player for the full metric breakdown.</p>
    </section>
  );
}

function PitchRow({ players, label, onSelectPlayer }: { players: SquadPlayer[]; label: string; onSelectPlayer?: (player: ProcessedPlayer) => void }) {
  if (players.length === 0) return null;
  return (
    <div>
      <span className="sr-only">{label}</span>
      <div className="flex justify-center gap-2 sm:gap-8">
        {players.map((player) => <PitchPlayer key={player.id} player={player} onSelectPlayer={onSelectPlayer} />)}
      </div>
    </div>
  );
}

function PitchPlayer({ player, onSelectPlayer }: { player: SquadPlayer; onSelectPlayer?: (player: ProcessedPlayer) => void }) {
  const shirtColor = player.position === 'GK' ? 'bg-lime-500' : player.position === 'DEF' ? 'bg-sky-600' : player.position === 'MID' ? 'bg-red-600' : 'bg-slate-800';
  return (
    <button type="button" onClick={() => onSelectPlayer?.(player)} className="group flex min-w-0 flex-1 max-w-[150px] flex-col items-center text-center focus:outline-none focus:ring-2 focus:ring-white/90">
      <div className="relative h-10 w-10 sm:h-14 sm:w-14">
        <div className={`absolute inset-x-1 bottom-0 h-8 rounded-t-[45%] ${shirtColor} shadow-lg transition group-hover:-translate-y-1 sm:h-11`} />
        <div className="absolute left-1/2 top-0 h-5 w-5 -translate-x-1/2 rounded-full bg-[#f1c6a5] shadow-sm sm:h-7 sm:w-7" />
        {player.is_captain && <span className="absolute -right-1 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-black text-[#173b3a]">C</span>}
        {player.is_vice_captain && <span className="absolute -right-1 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-violet-300 text-[10px] font-black text-[#173b3a]">V</span>}
      </div>
      <div className="w-full max-w-[138px] rounded-lg border border-white/80 bg-white px-2 py-1 shadow-md sm:px-3">
        <div className="flex items-center justify-between gap-1 text-left">
          <strong className="truncate text-[11px] font-black text-[#173b3a] sm:text-xs">{player.web_name}</strong>
          <span className="shrink-0 text-[9px] text-[#47706b]">£{player.price}</span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-1 text-[8px] font-medium text-[#47706b]">
          <span>{player.team_short_name}</span>
          <span className={player.minutesSecurityPercent < 60 ? 'text-rose-600' : 'text-[#47706b]'}>{player.minutesSecurityPercent}% mins</span>
        </div>
        <div className="mt-1 flex items-center justify-between border-t border-[#d7e9e5] pt-1 text-[8px] text-[#47706b]">
          <span>FDR {player.avgNext4FDR}</span>
          {player.priceChangeRisk === 'rising' && <ArrowUp className="h-3 w-3 text-cyan-600" />}
          {player.priceChangeRisk === 'falling' && <ArrowDown className="h-3 w-3 text-rose-500" />}
        </div>
      </div>
    </button>
  );
}

function BenchPlayer({ player, index, onSelectPlayer }: { player: SquadPlayer; index: number; onSelectPlayer?: (player: ProcessedPlayer) => void }) {
  return (
    <button type="button" onClick={() => onSelectPlayer?.(player)} className="flex min-h-16 items-center gap-2 rounded-lg border border-white/80 bg-white/80 p-2 text-left hover:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-600">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#173b3a] text-[10px] font-black text-white">{index}</span>
      <div className="min-w-0">
        <strong className="block truncate text-xs font-black text-[#173b3a]">{player.web_name}</strong>
        <span className="block text-[10px] text-[#47706b]">{player.position} • £{player.price}m</span>
        <span className="block text-[9px] text-[#47706b]">{player.minutesSecurityPercent}% minutes security</span>
      </div>
    </button>
  );
}
