'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from '@/components/Navbar';
import TeamOverview from '@/components/TeamOverview';
import SquadGrid from '@/components/SquadGrid';
import CaptainPicks from '@/components/CaptainPicks';
import TransferAlerts from '@/components/TransferAlerts';
import FormTrendChart from '@/components/FormTrendChart';
import DifferentialTable from '@/components/DifferentialTable';
import AiInsights from '@/components/AiInsights';
import PickTeamTransfers from '@/components/PickTeamTransfers';
import DeadlineActions from '@/components/DeadlineActions';
import PlayerDetails from '@/components/PlayerDetails';
import WeeklyChecklist from '@/components/WeeklyChecklist';
import { Loader2, AlertCircle, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { PickTeamTransferPlan, ProcessedPlayer } from '@/types/fpl';

const DEFAULT_TEAM_ID = 1523974;

export type DashboardView = 'team' | 'points' | 'transfers' | 'insights';

function formatDeadline(iso?: string) {
  if (!iso) return 'Deadline TBC';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Deadline TBC';
  return (
    date.toLocaleString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/London',
    }) + ' UK'
  );
}

export default function DashboardPage({ view = 'team' }: { view?: DashboardView }) {
  const [teamId, setTeamId] = useState<number>(DEFAULT_TEAM_ID);
  const [selectedGameweek, setSelectedGameweek] = useState<number | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<ProcessedPlayer | null>(null);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const loadDashboardData = useCallback(
    async (idToFetch: number, gameweek?: number | null) => {
      const requestId = ++requestIdRef.current;
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ teamId: String(idToFetch) });
        if (gameweek) params.set('gameweek', String(gameweek));
        const res = await fetch(`/api/dashboard?${params.toString()}`);
        const json = await res.json().catch(() => ({}));
        if (requestId !== requestIdRef.current) return;
        if (!res.ok || !json.success) {
          throw new Error(
            json.error || `HTTP ${res.status}: Failed to fetch dashboard data`
          );
        }
        setData(json);
        setTeamId(idToFetch);
        setSelectedGameweek(json.gameweek);
      } catch (err: any) {
        if (requestId !== requestIdRef.current) return;
        console.error('Dashboard load error:', err);
        setError(err.message || 'Error loading dashboard');
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    []
  );

  const handleSync = async (newTeamId: number) => {
    setIsSyncing(true);
    setError(null);
    try {
      const cronRes = await fetch(`/api/cron/update-stats?teamId=${newTeamId}`);
      const cronJson = await cronRes.json().catch(() => ({}));
      if (!cronRes.ok || !cronJson.success) {
        console.warn('Stats snapshot skipped:', cronJson.error || cronRes.status);
      }
      await loadDashboardData(newTeamId, null);
    } catch (err: any) {
      setError(err.message || 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (isMounted) {
      loadDashboardData(teamId, selectedGameweek);
    }
    // Initial load only; later loads are triggered by sync / GW navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, loadDashboardData]);

  const currentGwCeiling = data?.currentGameweek || data?.gameweek || 1;
  const displayGw = selectedGameweek || data?.gameweek || 1;
  const overview = data?.overview || {};
  const captain = data?.captainPicks?.[0];
  const urgentTransfer = data?.transferAlerts?.[0];
  const riskCount = (data?.squad || []).filter(
    (player) => player.status !== 'available' || player.minutesSecurityPercent < 60
  ).length;

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#37003C] text-white flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="h-10 w-10 text-[#04F5FF] animate-spin" />
        <p className="text-[#C9B7D4] text-sm font-medium">
          Initializing FPL Weekly Analyser...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#37003C] text-white flex flex-col font-sans">
      <Navbar
        activeView={view}
        currentGameweek={displayGw}
        teamId={teamId}
        teamName={overview.teamName || 'My FPL Analyser'}
        playerFirstName={overview.playerFirstName || 'Fantasy'}
        playerLastName={overview.playerLastName || 'Manager'}
        onSync={handleSync}
        isSyncing={isSyncing}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 pb-20 pt-6 md:px-8 md:pb-6">
        {isLoading && !data ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="h-10 w-10 text-[#04F5FF] animate-spin" />
            <p className="text-[#C9B7D4] text-sm font-medium">
              Loading official FPL points & custom metrics...
            </p>
          </div>
        ) : error && !data ? (
          <div className="bg-[#1F0A29] border border-rose-500/40 rounded-2xl p-6 text-center space-y-3">
            <AlertCircle className="h-10 w-10 text-rose-400 mx-auto" />
            <h2 className="text-lg font-bold text-white">
              Unable to load dashboard
            </h2>
            <p className="text-xs text-[#C9B7D4] max-w-md mx-auto">{error}</p>
            <button
              onClick={() => handleSync(teamId)}
              className="bg-[#4A0E5C] hover:bg-[#5C1473] text-white font-bold text-xs px-4 py-2 rounded-full transition inline-flex items-center gap-2 border border-[#3B1348]"
            >
              <RefreshCw className="h-4 w-4" />
              Try Syncing FPL Data
            </button>
          </div>
        ) : (
          <>
            <DeadlineActions
              currentGameweek={displayGw}
              deadlineTime={overview.deadlineTime}
              updatedAt={data?.timestamp}
              captain={captain}
              transfer={urgentTransfer}
              riskCount={riskCount}
              onReviewCaptain={() => scrollToSection('captain')}
              onReviewTransfer={() => scrollToSection('transfers')}
              onReviewRisk={() => scrollToSection('squad')}
            />
            {(view === 'team' || view === 'transfers') && <div className="mb-6"><WeeklyChecklist /></div>}
            <div className="flex flex-col lg:flex-row gap-8 items-start">
            {(view === 'team' || view === 'points') && <div id="points" className="w-full lg:w-1/3 space-y-6 scroll-mt-6">
              <TeamOverview
                currentGameweek={displayGw}
                squad={data?.squad || []}
                totalPoints={overview.totalPoints}
                overallRank={overview.overallRank}
                eventPoints={overview.eventPoints}
                averagePoints={overview.averagePoints}
                highestPoints={overview.highestPoints}
                squadValue={overview.squadValue}
                bank={overview.bank}
              />
            </div>}

            <div className="w-full lg:w-2/3 space-y-6">
              {error && (
                <div className="bg-rose-950/40 border border-rose-500/40 rounded-xl p-3 text-xs text-rose-200">
                  {error}
                </div>
              )}
              {(view === 'team' || view === 'points') && <div className="bg-[#1F0A29] border border-[#3B1348] rounded-xl p-3 flex items-center justify-between">
                <button
                  type="button"
                  disabled={displayGw <= 1 || isLoading}
                  onClick={() => loadDashboardData(teamId, displayGw - 1)}
                  className="h-8 w-8 rounded-full bg-[#2B0032] border border-[#3B1348] flex items-center justify-center text-white hover:bg-[#4A0E5C] transition disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Previous gameweek"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="text-center">
                  <span className="text-base font-extrabold text-white block">
                    Gameweek {displayGw}
                    {isLoading && (
                      <Loader2 className="inline-block ml-2 h-4 w-4 text-[#04F5FF] animate-spin align-middle" />
                    )}
                  </span>
                  <span className="text-[11px] text-[#C9B7D4]">
                    Deadline: {formatDeadline(overview.deadlineTime)}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={displayGw >= currentGwCeiling || isLoading}
                  onClick={() => loadDashboardData(teamId, displayGw + 1)}
                  className="h-8 w-8 rounded-full bg-[#2B0032] border border-[#3B1348] flex items-center justify-center text-white hover:bg-[#4A0E5C] transition disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Next gameweek"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>}

              {view === 'insights' && <div id="insights" className="scroll-mt-6"><AiInsights aiInsights={data?.aiInsights} /></div>}
              {view === 'team' && <div id="captain" className="scroll-mt-6"><CaptainPicks captainPicks={data?.captainPicks || []} onSelectPlayer={setSelectedPlayer} /></div>}
              {view === 'transfers' && <>
                <div id="transfers" className="scroll-mt-6"><TransferAlerts transferAlerts={data?.transferAlerts || []} onSelectPlayer={setSelectedPlayer} /></div>
                <PickTeamTransfers pickTeamTransferPlan={data?.pickTeamTransferPlan} />
              </>}

              {view === 'team' && <div id="squad" className="bg-[#1F0A29] border border-[#3B1348] rounded-xl p-5 scroll-mt-6">
                <SquadGrid squad={data?.squad || []} onSelectPlayer={setSelectedPlayer} />
              </div>}

              {view === 'points' && <FormTrendChart
                data={data?.formTrendChartData || []}
                squadPlayers={(data?.squad || [])
                  .filter((p: any) => !p.is_bench)
                  .sort(
                    (a: any, b: any) =>
                      (b.total_points || 0) - (a.total_points || 0)
                  )
                  .slice(0, 6)
                  .map((p: any) => ({
                    id: p.id,
                    web_name: p.web_name,
                  }))}
              />}

              {view === 'insights' && <DifferentialTable differentials={data?.differentialPicks || []} />}
            </div>
            </div>
          </>
        )}
      </main>

      <footer className="bg-[#2B0032] border-t border-[#3B1348] py-4 px-4 text-center text-xs text-[#C9B7D4] mt-8">
        Official Premier League Visual System • FPL Weekly Analyser
      </footer>
      {selectedPlayer && <PlayerDetails player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />}
    </div>
  );
}

interface DashboardData {
  gameweek: number;
  currentGameweek: number;
  squad: Array<ProcessedPlayer & { is_captain?: boolean; is_vice_captain?: boolean; is_bench?: boolean }>;
  captainPicks: ProcessedPlayer[];
  transferAlerts: Array<{ outPlayer: ProcessedPlayer; inPlayerOptions: ProcessedPlayer[]; reason: string }>;
  pickTeamTransferPlan?: PickTeamTransferPlan;
  differentialPicks: ProcessedPlayer[];
  formTrendChartData: Array<Record<string, string | number>>;
  aiInsights?: {
    headline: string;
    teamRating: number;
    summary: string;
    priorityMoves: Array<{
      title: string;
      description: string;
      score: number;
      kind: 'transfer' | 'captain' | 'risk';
    }>;
  };
  overview: {
    teamName?: string;
    playerFirstName?: string;
    playerLastName?: string;
    totalPoints?: number;
    overallRank?: number;
    eventPoints?: number;
    averagePoints?: number;
    highestPoints?: number;
    squadValue?: number;
    bank?: number;
    deadlineTime?: string;
  };
  timestamp?: string;
}
