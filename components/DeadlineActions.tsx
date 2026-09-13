'use client';

import { Clock3, ShieldAlert, Trophy, ArrowRight } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { ProcessedPlayer, TransferSuggestion } from '@/types/fpl';

interface DeadlineActionsProps {
  deadlineTime?: string;
  currentGameweek: number;
  captain?: ProcessedPlayer;
  transfer?: TransferSuggestion;
  riskCount: number;
  updatedAt?: string;
  onReviewCaptain: () => void;
  onReviewTransfer: () => void;
  onReviewRisk: () => void;
}

function formatCountdown(deadlineTime?: string, now = Date.now()) {
  if (!deadlineTime) return 'Deadline TBC';
  const deadline = new Date(deadlineTime).getTime();
  if (Number.isNaN(deadline)) return 'Deadline TBC';
  const distance = deadline - now;
  if (distance <= 0) return 'Deadline passed';

  const hours = Math.floor(distance / (1000 * 60 * 60));
  const minutes = Math.floor((distance / (1000 * 60)) % 60);
  return `${hours}h ${minutes}m remaining`;
}

export default function DeadlineActions({
  deadlineTime,
  currentGameweek,
  captain,
  transfer,
  riskCount,
  updatedAt,
  onReviewCaptain,
  onReviewTransfer,
  onReviewRisk,
}: DeadlineActionsProps) {
  const [countdown, setCountdown] = useState(() => formatCountdown(deadlineTime));

  useEffect(() => {
    setCountdown(formatCountdown(deadlineTime));
    const interval = window.setInterval(() => {
      setCountdown(formatCountdown(deadlineTime));
    }, 60000);
    return () => window.clearInterval(interval);
  }, [deadlineTime]);

  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-cyan-300/30 bg-[#120a2b] shadow-[0_20px_50px_rgba(4,245,255,0.08)]" aria-labelledby="deadline-actions-title">
      <div className="flex flex-col gap-4 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200">
            <Clock3 className="h-4 w-4" />
            Gameweek {currentGameweek} decision desk
          </div>
          <h2 id="deadline-actions-title" className="mt-1 text-xl font-black text-white sm:text-2xl">
            Lock in your next move
          </h2>
        </div>
        <div className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-xs font-bold text-amber-100">
          {countdown} {updatedAt ? `• Updated ${new Date(updatedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : ''}
        </div>
      </div>

      <div className="grid gap-px bg-white/10 md:grid-cols-3">
        <ActionCard
          icon={<Trophy className="h-4 w-4" />}
          label="Captain"
          value={captain?.web_name || 'Review your XI'}
          detail={captain ? `Form-fixture ${captain.formAdjustedFixtureScore}` : 'No captain pick yet'}
          tone="cyan"
          onClick={onReviewCaptain}
        />
        <ActionCard
          icon={<ArrowRight className="h-4 w-4" />}
          label="Best transfer"
          value={transfer?.outPlayer.web_name || 'No urgent move'}
          detail={transfer ? `Consider ${transfer.inPlayerOptions[0]?.web_name || 'a replacement'}` : 'Your squad has no urgent flag'}
          tone="violet"
          onClick={onReviewTransfer}
        />
        <ActionCard
          icon={<ShieldAlert className="h-4 w-4" />}
          label="Risk watch"
          value={`${riskCount} player${riskCount === 1 ? '' : 's'}`}
          detail="Check minutes and bench cover"
          tone="amber"
          onClick={onReviewRisk}
        />
      </div>
    </section>
  );
}

function ActionCard({
  icon,
  label,
  value,
  detail,
  tone,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
  tone: 'cyan' | 'violet' | 'amber';
  onClick: () => void;
}) {
  const toneClasses = {
    cyan: 'text-cyan-200 border-cyan-300/30 hover:bg-cyan-300/10',
    violet: 'text-violet-200 border-violet-300/30 hover:bg-violet-300/10',
    amber: 'text-amber-200 border-amber-300/30 hover:bg-amber-300/10',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group min-h-[126px] bg-[#1f0a29] p-5 text-left transition focus:outline-none focus:ring-2 focus:ring-cyan-300 ${toneClasses[tone]}`}
    >
      <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em]">
        {icon}
        {label}
      </span>
      <strong className="mt-3 block truncate text-lg font-black text-white">{value}</strong>
      <span className="mt-1 block text-xs text-[#d8cbe0]">{detail}</span>
      <span className="mt-3 block text-[10px] font-bold uppercase tracking-[0.12em] opacity-70 transition group-hover:opacity-100">
        Review now
      </span>
    </button>
  );
}