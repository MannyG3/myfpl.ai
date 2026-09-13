'use client';

import { ArrowRight, TrendingUp } from 'lucide-react';

interface PickTeamTransferItem {
  title: string;
  summary: string;
  outPlayer?: {
    web_name: string;
    price: number;
    team_short_name?: string;
    position?: string;
  };
  inPlayerOptions?: Array<{
    id: number;
    web_name: string;
    price: number;
    team_short_name?: string;
    position?: string;
  }>;
}

interface NextThreeWeekEntry {
  gameweek: number;
  summary: string;
  focus: string;
  keyPlayers: string[];
}

interface PickTeamTransferPlan {
  pickTeamTransfers: PickTeamTransferItem[];
  nextThreeWeekAnalysis: NextThreeWeekEntry[];
}

interface PickTeamTransfersProps {
  pickTeamTransferPlan?: PickTeamTransferPlan;
}

export default function PickTeamTransfers({
  pickTeamTransferPlan,
}: PickTeamTransfersProps) {
  if (!pickTeamTransferPlan) {
    return (
      <div className="bg-[#1F0A29] border border-[#3B1348] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-5 w-5 text-[#04F5FF]" />
          <h2 className="text-xl font-bold text-white">Pick Team Transfers</h2>
        </div>
        <p className="text-xs text-[#C9B7D4]">
          Team data is still syncing. Transfer recommendations and the next 3-week plan will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#1F0A29] border border-[#3B1348] rounded-xl p-5 space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="h-5 w-5 text-[#04F5FF]" />
        <h2 className="text-xl font-bold text-white">Pick Team Transfers</h2>
      </div>

      <div className="space-y-4">
        {pickTeamTransferPlan.pickTeamTransfers.map((transfer, idx) => (
          <div
            key={`${transfer.title}-${idx}`}
            className="bg-[#2B0032] border border-[#3B1348] rounded-xl p-4"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="bg-[#04F5FF]/10 text-[#04F5FF] border border-[#04F5FF]/30 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-[0.12em]">
                {transfer.title}
              </span>
              {transfer.outPlayer && (
                <span className="text-[10px] text-[#C9B7D4]">
                  £{transfer.outPlayer.price}m out
                </span>
              )}
            </div>

            <p className="text-xs text-[#C9B7D4] leading-relaxed">{transfer.summary}</p>

            {transfer.outPlayer && transfer.inPlayerOptions && transfer.inPlayerOptions.length > 0 && (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-[#1F0A29] border border-rose-500/30 rounded-lg p-3">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-rose-300 mb-1">
                    Sell
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-white text-sm">
                        {transfer.outPlayer.web_name}
                      </h3>
                      <p className="text-[11px] text-[#C9B7D4]">
                        {transfer.outPlayer.team_short_name || 'Team'} • {transfer.outPlayer.position || 'Player'}
                      </p>
                    </div>
                    <span className="text-[#C9B7D4] text-xs">£{transfer.outPlayer.price}m</span>
                  </div>
                </div>

                <div className="bg-[#1F0A29] border border-[#04F5FF]/30 rounded-lg p-3">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-[#04F5FF] mb-1">
                    Target
                  </p>
                  <div className="space-y-2">
                    {transfer.inPlayerOptions.slice(0, 2).map((candidate) => (
                      <div key={candidate.id} className="flex items-center justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-white text-sm">
                            {candidate.web_name}
                          </h4>
                          <p className="text-[11px] text-[#C9B7D4]">
                            {candidate.team_short_name || 'Team'} • {candidate.position || 'Player'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-[#04F5FF] text-xs">
                          <span>£{candidate.price}m</span>
                          <ArrowRight className="h-3 w-3" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-[#3B1348] pt-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="text-lg font-bold text-white">Next 3 Week Analysis</h3>
          <span className="text-[10px] uppercase tracking-[0.12em] text-[#C9B7D4]">
            3-gameweek outlook
          </span>
        </div>

        <div className="space-y-3">
          {pickTeamTransferPlan.nextThreeWeekAnalysis.map((entry) => (
            <div key={entry.gameweek} className="bg-[#2B0032] border border-[#3B1348] rounded-xl p-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-[#04F5FF]">GW {entry.gameweek}</span>
                <span className="text-[10px] text-[#C9B7D4]">{entry.focus}</span>
              </div>
              <p className="text-xs text-[#C9B7D4] leading-relaxed">{entry.summary}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {entry.keyPlayers.map((player) => (
                  <span
                    key={`${entry.gameweek}-${player}`}
                    className="rounded-full border border-[#3B1348] bg-[#1F0A29] px-2 py-0.5 text-[10px] text-[#F2E8F5]"
                  >
                    {player}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
