'use client';

import { Sparkles, ShieldAlert, Trophy, ArrowUpRight } from 'lucide-react';

interface AiMove {
  title: string;
  description: string;
  score: number;
  kind: 'transfer' | 'captain' | 'risk';
}

interface AiInsightsData {
  headline: string;
  teamRating: number;
  summary: string;
  priorityMoves: AiMove[];
}

interface AiInsightsProps {
  aiInsights?: AiInsightsData;
}

export default function AiInsights({ aiInsights }: AiInsightsProps) {
  if (!aiInsights) {
    return (
      <div className="bg-[#1F0A29] border border-[#3B1348] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-[#04F5FF]" />
          <h2 className="text-xl font-bold text-white">AI Team Rating</h2>
        </div>
        <p className="text-xs text-[#C9B7D4]">
          Sync your team to unlock AI-powered squad analysis and weekly recommendations.
        </p>
      </div>
    );
  }

  const kindStyles = {
    transfer: 'bg-[#04F5FF]/10 text-[#04F5FF] border-[#04F5FF]/30',
    captain: 'bg-[#963CFF]/10 text-[#D7C3FF] border-[#963CFF]/30',
    risk: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  };

  const kindIcons = {
    transfer: ArrowUpRight,
    captain: Trophy,
    risk: ShieldAlert,
  };

  return (
    <div className="bg-[#1F0A29] border border-[#3B1348] rounded-xl p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[#04F5FF]/10 border border-[#04F5FF]/30">
            <Sparkles className="h-4 w-4 text-[#04F5FF]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">AI Team Rating</h2>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#C9B7D4]">
              FPL coach mode
            </p>
          </div>
        </div>

        <div className="bg-[#04F5FF] text-[#37003C] font-black rounded-full px-3 py-1 text-sm">
          {aiInsights.teamRating}/100
        </div>
      </div>

      <div className="mb-4 rounded-xl bg-gradient-to-r from-[#04F5FF]/10 via-[#4A0E5C] to-[#963CFF]/10 border border-[#3B1348] p-4">
        <p className="text-white font-semibold text-sm">{aiInsights.headline}</p>
        <p className="text-[#C9B7D4] text-xs mt-2 leading-relaxed">{aiInsights.summary}</p>
      </div>

      <div className="space-y-3">
        {aiInsights.priorityMoves.map((move) => {
          const Icon = kindIcons[move.kind];
          return (
            <div
              key={move.title}
              className="bg-[#2B0032] border border-[#3B1348] rounded-xl p-3"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold ${kindStyles[move.kind]}`}
                >
                  <Icon className="h-3 w-3" />
                  {move.title}
                </span>
                <span className="text-right text-xs font-bold text-[#04F5FF]">
                  <span className="block">{move.score}/100</span>
                  <span className="block text-[9px] uppercase tracking-[0.08em] text-[#C9B7D4]">
                    {move.score >= 85 ? 'High confidence' : move.score >= 65 ? 'Medium confidence' : 'Watch'}
                  </span>
                </span>
              </div>
              <p className="text-xs text-[#C9B7D4] leading-relaxed">{move.description}</p>
              <details className="mt-3 border-t border-[#3B1348] pt-2 text-[11px] text-[#C9B7D4]">
                <summary className="cursor-pointer font-bold text-cyan-200">Why this is recommended</summary>
                <p className="mt-2 leading-relaxed">This score combines the signal strength with recent form, fixture difficulty, and expected minutes. Check the player detail before making a final move.</p>
              </details>
            </div>
          );
        })}
      </div>
    </div>
  );
}
