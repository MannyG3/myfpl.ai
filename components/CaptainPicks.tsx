'use client';

import { ProcessedPlayer } from '@/types/fpl';

interface CaptainPicksProps {
  captainPicks: ProcessedPlayer[];
}

export default function CaptainPicks({ captainPicks }: CaptainPicksProps) {
  if (!captainPicks || captainPicks.length === 0) {
    return (
      <div className="bg-[#1F0A29] border border-[#3B1348] rounded-xl p-5">
        <h2 className="text-xl font-bold text-white mb-1">
          Captain Recommendations
        </h2>
        <p className="text-xs text-[#C9B7D4]">
          Load a valid FPL team to see captain rankings for the starting XI.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#1F0A29] border border-[#3B1348] rounded-xl p-5">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h2 className="text-xl font-bold text-white">
          Captain Recommendations
        </h2>
        <span className="text-xs text-[#C9B7D4]">
          Ranked by Form × Fixture Ease
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {captainPicks.map((player, idx) => {
          const ease = Math.max(1, 6 - player.avgNext4FDR);
          const captainScore = (player.formAdjustedFixtureScore * ease).toFixed(1);

          return (
            <div
              key={player.id}
              className={`bg-[#2B0032] border ${
                idx === 0
                  ? 'border-[#04F5FF]'
                  : 'border-[#3B1348]'
              } rounded-xl p-4 flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    idx === 0
                      ? 'bg-[#04F5FF] text-[#37003C]'
                      : 'bg-[#4A0E5C] text-white'
                  }`}
                >
                  #{idx + 1} {idx === 0 ? 'Top Pick' : idx === 1 ? 'Vice Option' : 'Differential'}
                </span>
                <span className="text-xs text-[#C9B7D4] font-mono">
                  Score: <strong className="text-white">{captainScore}</strong>
                </span>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-white">
                  {player.web_name}
                </h3>
                <p className="text-xs text-[#C9B7D4]">
                  {player.team_name} ({player.position}) • £{player.price}m
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-[#3B1348] grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[#C9B7D4] block text-[10px]">Form-Fixture</span>
                  <span className="font-bold text-[#04F5FF]">
                    {player.formAdjustedFixtureScore}
                  </span>
                </div>
                <div>
                  <span className="text-[#C9B7D4] block text-[10px]">Next 4 FDR</span>
                  <span className="font-bold text-white">
                    {player.avgNext4FDR} (Ease {ease})
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
