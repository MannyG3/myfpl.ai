'use client';

import { CheckCircle2, Circle } from 'lucide-react';
import { useState } from 'react';

const CHECKLIST = [
  ['captain', 'Confirm captain and vice-captain'],
  ['risks', 'Review injury and minutes risks'],
  ['bench', 'Check bench order'],
  ['transfers', 'Review transfer shortlist'],
] as const;

export default function WeeklyChecklist() {
  const [completed, setCompleted] = useState<string[]>([]);

  const toggle = (id: string) => {
    setCompleted((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);
  };

  return (
    <section className="rounded-2xl border border-[#3B1348] bg-[#1F0A29] p-4" aria-labelledby="checklist-title">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 id="checklist-title" className="text-base font-black text-white">Deadline checklist</h2>
          <p className="mt-1 text-xs text-[#C9B7D4]">Finish the essentials before locking your team.</p>
        </div>
        <span className="text-xs font-bold text-cyan-200">{completed.length}/{CHECKLIST.length}</span>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {CHECKLIST.map(([id, label]) => {
          const isComplete = completed.includes(id);
          return (
            <button type="button" key={id} onClick={() => toggle(id)} className="flex min-h-11 items-center gap-2 rounded-lg border border-[#3B1348] bg-[#2B0032] px-3 text-left text-xs text-[#E9DFF0] hover:border-cyan-300/50 focus:outline-none focus:ring-2 focus:ring-cyan-300">
              {isComplete ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" /> : <Circle className="h-4 w-4 shrink-0 text-[#C9B7D4]" />}
              <span className={isComplete ? 'text-[#C9B7D4] line-through' : ''}>{label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}