'use client';

import { TransferSuggestion } from '@/types/fpl';
import { ArrowRight, Bookmark, BookmarkCheck } from 'lucide-react';
import { useState } from 'react';

interface TransferAlertsProps {
  transferAlerts: TransferSuggestion[];
  onSelectPlayer?: (player: TransferSuggestion['outPlayer']) => void;
}

export default function TransferAlerts({ transferAlerts, onSelectPlayer }: TransferAlertsProps) {
  const [savedTransfers, setSavedTransfers] = useState<number[]>([]);
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

  const urgentAlerts = transferAlerts.filter((alert) =>
    alert.outPlayer.status !== 'available' || alert.outPlayer.minutesSecurityPercent < 60
  );
  const watchlistAlerts = transferAlerts.filter((alert) => !urgentAlerts.includes(alert));
  const toggleSaved = (index: number) => {
    setSavedTransfers((items) => items.includes(index) ? items.filter((item) => item !== index) : [...items, index]);
  };

  return (
    <div className="bg-[#1F0A29] border border-[#3B1348] rounded-xl p-5">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h2 className="text-xl font-bold text-white">Transfer Alerts</h2>
        <span className="text-xs text-[#C9B7D4]">
          {urgentAlerts.length} urgent • {watchlistAlerts.length} watchlist
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
                <span className={`${urgentAlerts.includes(alert) ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-200'} font-bold px-2 py-0.5 rounded-full text-[10px]`}>
                  {urgentAlerts.includes(alert) ? 'ACT NOW' : 'WATCHLIST'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[#C9B7D4]">£{alert.outPlayer.price}m</span>
                  <button type="button" aria-label={`${savedTransfers.includes(idx) ? 'Remove' : 'Save'} ${alert.outPlayer.web_name} transfer`} onClick={() => toggleSaved(idx)} className="rounded p-1 text-cyan-200 hover:bg-[#2B0032] focus:outline-none focus:ring-2 focus:ring-cyan-300">
                    {savedTransfers.includes(idx) ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                  </button>
                </div>
              </div>
                <button type="button" onClick={() => onSelectPlayer?.(alert.outPlayer)} className="text-left font-bold text-white text-base hover:text-cyan-200">
                {alert.outPlayer.web_name}
                </button>
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
                    <span className={cand.minutesSecurityPercent < 60 ? 'text-amber-300' : 'text-[#C9B7D4]'}>
                      {cand.minutesSecurityPercent < 60 ? 'High risk • ' : ''}£{cand.price}m
                    </span>
                  </div>

                  <div>
                    <button type="button" onClick={() => onSelectPlayer?.(cand)} className="text-left font-bold text-white text-sm hover:text-cyan-200">
                      {cand.web_name}
                    </button>
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
      {savedTransfers.length > 0 && (
        <div className="mt-4 rounded-lg border border-cyan-300/20 bg-cyan-300/5 p-3 text-xs text-cyan-100">
          <strong>{savedTransfers.length} transfer{savedTransfers.length === 1 ? '' : 's'} saved</strong>
          <span className="ml-2 text-[#C9B7D4]">Use the shortlist to compare before committing.</span>
        </div>
      )}
    </div>
  );
}
