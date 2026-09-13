'use client';

import { X } from 'lucide-react';
import { ProcessedPlayer } from '@/types/fpl';
import { useEffect } from 'react';

interface PlayerDetailsProps {
  player: ProcessedPlayer;
  onClose: () => void;
}

export default function PlayerDetails({ player, onClose }: PlayerDetailsProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const fixtureLabel = player.avgNext4FDR <= 2.5 ? 'Favorable' : player.avgNext4FDR <= 3.5 ? 'Mixed' : 'Challenging';
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4" role="presentation" onMouseDown={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="player-details-title"
        className="w-full max-w-lg rounded-t-2xl border border-[#3B1348] bg-[#1F0A29] p-5 shadow-2xl sm:rounded-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200">
              {player.team_name || player.team_short_name} • {player.position}
            </p>
            <h2 id="player-details-title" className="mt-1 text-2xl font-black text-white">{player.web_name}</h2>
            <p className="mt-1 text-sm text-[#C9B7D4]">£{player.price}m • {player.selected_by_percent || 0}% selected</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close player details" className="rounded-full p-2 text-[#C9B7D4] hover:bg-[#2B0032] hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-300">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Form-fixture" value={player.formAdjustedFixtureScore} />
          <Metric label="Minutes security" value={`${player.minutesSecurityPercent}%`} />
          <Metric label="Next 4 FDR" value={player.avgNext4FDR} />
          <Metric label="Total points" value={player.total_points || 0} />
        </div>
        <div className="mt-3 rounded-lg border border-[#3B1348] bg-[#2B0032] px-3 py-2 text-xs text-[#C9B7D4]">
          Next four fixtures: <strong className="text-white">{fixtureLabel}</strong> ({player.avgNext4FDR} FDR)
        </div>

        <div className="mt-5 rounded-xl border border-[#3B1348] bg-[#2B0032] p-3 text-sm text-[#E9DFF0]">
          <strong className="text-white">Recommendation context</strong>
          <p className="mt-1 leading-relaxed">Review the fixture score alongside minutes security before committing. A high score with uncertain minutes is a watchlist signal, not an automatic move.</p>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-[#3B1348] bg-[#2B0032] p-3">
      <div className="text-lg font-black text-white">{value}</div>
      <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#C9B7D4]">{label}</div>
    </div>
  );
}