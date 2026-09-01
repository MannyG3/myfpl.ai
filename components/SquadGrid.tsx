'use client';

import { ProcessedPlayer } from '@/types/fpl';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface SquadGridProps {
  squad: (ProcessedPlayer & {
    is_captain?: boolean;
    is_vice_captain?: boolean;
    is_bench?: boolean;
  })[];
}

export default function SquadGrid({ squad }: SquadGridProps) {
  const starting11 = squad.filter((p) => !p.is_bench);
  const bench = squad.filter((p) => p.is_bench);

  const getPositionBadgeClass = (pos: string) => {
    switch (pos) {
      case 'GK':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'DEF':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
      case 'MID':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'FWD':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      default:
        return 'bg-[#4A0E5C] text-white';
    }
  };

  const renderPlayerCard = (
    p: ProcessedPlayer & {
      is_captain?: boolean;
      is_vice_captain?: boolean;
      is_bench?: boolean;
    }
  ) => (
    <div
      key={p.id}
      className={`bg-[#1F0A29] border ${
        p.is_captain
          ? 'border-[#04F5FF] ring-1 ring-[#04F5FF]/50'
          : p.is_vice_captain
          ? 'border-[#963CFF] ring-1 ring-[#963CFF]/50'
          : 'border-[#3B1348]'
      } rounded-xl p-3 flex flex-col justify-between`}
    >
      {/* Top Badges */}
      <div className="flex items-center justify-between gap-1 mb-2">
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded ${getPositionBadgeClass(
            p.position
          )}`}
        >
          {p.position}
        </span>

        <div className="flex items-center gap-1">
          {p.is_captain && (
            <span className="bg-[#04F5FF] text-[#37003C] font-black text-xs h-5 w-5 rounded-full flex items-center justify-center">
              C
            </span>
          )}
          {p.is_vice_captain && (
            <span className="bg-[#963CFF] text-white font-black text-xs h-5 w-5 rounded-full flex items-center justify-center">
              V
            </span>
          )}
          {p.priceChangeRisk === 'rising' && (
            <span title="Price Rising">
              <TrendingUp className="h-3.5 w-3.5 text-[#04F5FF]" />
            </span>
          )}
          {p.priceChangeRisk === 'falling' && (
            <span title="Price Falling">
              <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
            </span>
          )}
        </div>
      </div>

      {/* Name & Team */}
      <div className="mb-2">
        <h3 className="font-bold text-sm text-white truncate" title={p.web_name}>
          {p.web_name}
        </h3>
        <p className="text-xs text-[#C9B7D4] flex items-center gap-1">
          {p.team_short_name} • £{p.price}m
        </p>
      </div>

      {/* Custom Metrics Grid */}
      <div className="grid grid-cols-3 gap-1 bg-[#2B0032] rounded-lg p-2 text-center text-xs border border-[#3B1348]">
        <div>
          <span className="text-[10px] text-[#C9B7D4] block">Form-Fx</span>
          <span className="font-bold text-[#04F5FF]">
            {p.formAdjustedFixtureScore}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-[#C9B7D4] block">Min Sec</span>
          <span
            className={`font-bold ${
              p.minutesSecurityPercent >= 80
                ? 'text-emerald-400'
                : p.minutesSecurityPercent >= 50
                ? 'text-amber-400'
                : 'text-rose-400'
            }`}
          >
            {p.minutesSecurityPercent}%
          </span>
        </div>
        <div>
          <span className="text-[10px] text-[#C9B7D4] block">FDR</span>
          <span className="font-bold text-white">
            {p.avgNext4FDR}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Starting 11 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-white">
            Starting XI
          </h2>
          <span className="text-xs text-[#C9B7D4]">
            Sorted by position
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {starting11.length > 0 ? (
            starting11.map(renderPlayerCard)
          ) : (
            <p className="col-span-full text-xs text-[#C9B7D4]">
              No squad found for this gameweek. Sync your FPL team ID to load picks.
            </p>
          )}
        </div>
      </div>

      {/* Bench */}
      {bench.length > 0 && (
        <div className="pt-4 border-t border-[#3B1348]">
          <h2 className="text-lg font-bold text-[#C9B7D4] mb-3">
            Bench Substitutes
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {bench.map(renderPlayerCard)}
          </div>
        </div>
      )}
    </div>
  );
}
