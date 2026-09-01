'use client';

import { TransferSuggestion } from '@/types/fpl';
import { ArrowRight } from 'lucide-react';

interface TransferAlertsProps {
  transferAlerts: TransferSuggestion[];
}

export default function TransferAlerts({ transferAlerts }: TransferAlertsProps) {
  if (!transferAlerts || transferAlerts.length === 0) {
    return (
      <div className="bg-[#1F0A29] border border-[#3B1348] rounded-xl p-5">
        <h2 className="text-xl font-bold text-white mb-1">Transfer Alerts</h2>
        <p className="text-xs text-[#C9B7D4]">
          No urgent transfer flags detected in your squad. All starting players have secure minutes and solid fixture scores.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#1F0A29] border border-[#3B1348] rounded-xl p-5">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h2 className="text-xl font-bold text-white">Transfer Alerts</h2>
        <span className="text-xs text-[#C9B7D4]">
          {transferAlerts.length} squad warning{transferAlerts.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-4">
        {transferAlerts.map((alert, idx) => (
          <div
            key={idx}
            className="bg-[#2B0032] border border-[#3B1348] rounded-xl p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4"
          >
            {/* Out Player */}
            <div className="flex-1 bg-[#1F0A29] border border-rose-500/30 rounded-lg p-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="bg-rose-500/20 text-rose-300 font-bold px-2 py-0.5 rounded-full text-[10px]">
                  SWAP OUT
                </span>
                <span className="text-[#C9B7D4]">£{alert.outPlayer.price}m</span>
              </div>
              <h3 className="font-bold text-white text-base">
                {alert.outPlayer.web_name}
              </h3>
              <p className="text-xs text-[#C9B7D4]">
                {alert.outPlayer.team_short_name} ({alert.outPlayer.position})
              </p>
              <p className="mt-2 text-xs text-rose-300 bg-rose-950/40 p-1.5 rounded">
                {alert.reason}
              </p>
            </div>

            <div className="hidden lg:flex items-center justify-center text-[#C9B7D4]">
              <ArrowRight className="h-5 w-5" />
            </div>

            {/* In Candidates */}
            <div className="flex-[2] grid grid-cols-1 sm:grid-cols-2 gap-3">
              {alert.inPlayerOptions.map((cand) => (
                <div
                  key={cand.id}
                  className="bg-[#1F0A29] border border-[#04F5FF]/30 rounded-lg p-3 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="bg-[#4A0E5C] text-[#04F5FF] font-bold px-2 py-0.5 rounded-full text-[10px]">
                      BUY OPTION
                    </span>
                    <span className="text-[#C9B7D4]">£{cand.price}m</span>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-sm">
                      {cand.web_name}
                    </h4>
                    <p className="text-xs text-[#C9B7D4]">
                      {cand.team_short_name} • {cand.position}
                    </p>
                  </div>

                  <div className="mt-2 pt-2 border-t border-[#3B1348] grid grid-cols-2 gap-1 text-[11px]">
                    <div>
                      <span className="text-[#C9B7D4] block text-[10px]">Form-Fx</span>
                      <span className="font-bold text-[#04F5FF]">
                        {cand.formAdjustedFixtureScore}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#C9B7D4] block text-[10px]">Min Sec</span>
                      <span className="font-bold text-emerald-400">
                        {cand.minutesSecurityPercent}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
