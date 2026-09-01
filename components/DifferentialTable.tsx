'use client';

import { ProcessedPlayer } from '@/types/fpl';

interface DifferentialTableProps {
  differentials: ProcessedPlayer[];
}

export default function DifferentialTable({
  differentials,
}: DifferentialTableProps) {
  if (!differentials || differentials.length === 0) {
    return (
      <div className="bg-[#1F0A29] border border-[#3B1348] rounded-xl p-5">
        <h2 className="text-xl font-bold text-white mb-1">Differential Gems</h2>
        <p className="text-xs text-[#C9B7D4]">
          No low-ownership options met the current points threshold. Sync a later
          gameweek once more players have minutes.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#1F0A29] border border-[#3B1348] rounded-xl p-5">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h2 className="text-xl font-bold text-white">Differential Gems</h2>
        <span className="text-xs text-[#C9B7D4]">
          Top 10 low-ownership (≤15%) options
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#2B0032] text-[#C9B7D4] font-semibold border-b border-[#3B1348] uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-3">Player</th>
              <th className="py-2.5 px-3">Team</th>
              <th className="py-2.5 px-3">Pos</th>
              <th className="py-2.5 px-3">Price</th>
              <th className="py-2.5 px-3">Pts</th>
              <th className="py-2.5 px-3">Selected %</th>
              <th className="py-2.5 px-3">Form-Fx</th>
              <th className="py-2.5 px-3 text-right">Differential Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#3B1348] font-medium">
            {differentials.map((p, idx) => (
              <tr
                key={p.id}
                className="hover:bg-[#2B0032]/60 transition text-slate-200"
              >
                <td className="py-2.5 px-3 font-bold text-white flex items-center gap-2">
                  <span className="text-[#C9B7D4] text-[10px] w-4 font-mono">
                    #{idx + 1}
                  </span>
                  {p.web_name}
                </td>
                <td className="py-2.5 px-3 text-[#C9B7D4]">{p.team_short_name}</td>
                <td className="py-2.5 px-3">
                  <span className="bg-[#4A0E5C] text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                    {p.position}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-[#C9B7D4]">£{p.price}m</td>
                <td className="py-2.5 px-3 font-bold text-white">
                  {p.total_points}
                </td>
                <td className="py-2.5 px-3 text-[#04F5FF]">
                  {p.selected_by_percent}%
                </td>
                <td className="py-2.5 px-3 text-emerald-400 font-semibold">
                  {p.formAdjustedFixtureScore}
                </td>
                <td className="py-2.5 px-3 text-right font-extrabold text-white text-sm font-mono">
                  {p.differentialScore}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
