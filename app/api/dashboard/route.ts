import { NextResponse } from 'next/server';
import { query, initDb, executeMany } from '@/lib/db';
import {
  fetchBootstrapStatic,
  fetchFixtures,
  fetchEntry,
  fetchEntryPicks,
  fetchElementSummaries,
} from '@/lib/fpl-api';
import {
  calculateNextFDR,
  calculateFormAdjustedFixtureScore,
  calculateMinutesSecurity,
  calculateDifferentialScore,
  calculatePriceChangeRisk,
  generateTransferSuggestions,
  recommendCaptains,
  buildAiInsights,
  mapPosition,
    mapStatus,
    estimateMinutesSecurity,
    sortHistoryByRound,
} from '@/lib/metrics';
import { ProcessedPlayer, FPLElementHistory, FPLPick } from '@/types/fpl';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

const UPSERT_SQUAD_SQL = `INSERT INTO my_squad (team_id, gameweek, player_id, is_captain, is_vice_captain, is_bench)
 VALUES ($1, $2, $3, $4, $5, $6)
 ON CONFLICT (team_id, gameweek, player_id) DO UPDATE SET
   is_captain = EXCLUDED.is_captain,
   is_vice_captain = EXCLUDED.is_vice_captain,
   is_bench = EXCLUDED.is_bench;`;

async function persistPicks(teamId: number, gameweek: number, picks: FPLPick[]) {
  const rows = picks.map((pick) => {
    const isBench = pick.position > 11 || pick.multiplier === 0;
    return [
      teamId,
      gameweek,
      pick.element,
      pick.is_captain,
      pick.is_vice_captain,
      isBench,
    ];
  });
  await executeMany(UPSERT_SQUAD_SQL, rows);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamIdParam = searchParams.get('teamId');
    const gameweekParam = searchParams.get('gameweek');
    const teamId = teamIdParam
      ? parseInt(teamIdParam, 10)
      : parseInt(process.env.FPL_TEAM_ID || '1523974', 10);

    if (!Number.isFinite(teamId) || teamId <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid team ID' },
        { status: 400 }
      );
    }

    try {
      await initDb();
    } catch (dbErr) {
      console.warn('[Dashboard API] Database unavailable, serving live FPL data only:', dbErr);
    }

    const [bootstrap, fixtures, entry] = await Promise.all([
      fetchBootstrapStatic(),
      fetchFixtures(),
      fetchEntry(teamId),
    ]);

    const teamsMap = new Map<number, { name: string; short_name: string }>();
    bootstrap.teams.forEach((t) => {
      teamsMap.set(t.id, { name: t.name, short_name: t.short_name });
    });

    const currentEvent =
      bootstrap.events.find((e) => e.is_current) ||
      bootstrap.events.find((e) => e.is_next) ||
      bootstrap.events[0];

    if (!currentEvent) {
      throw new Error('Could not determine the current FPL gameweek');
    }

    const requestedGw = gameweekParam ? parseInt(gameweekParam, 10) : currentEvent.id;
    const gameweek = Number.isFinite(requestedGw) && requestedGw > 0
      ? Math.min(requestedGw, currentEvent.id)
      : currentEvent.id;

    const selectedEvent =
      bootstrap.events.find((e) => e.id === gameweek) || currentEvent;

    const picksData = await fetchEntryPicks(teamId, gameweek);
    if (picksData?.picks?.length) {
      try {
        await persistPicks(teamId, gameweek, picksData.picks);
      } catch (persistErr) {
        console.warn('[Dashboard API] Could not persist picks:', persistErr);
      }
    }

    const squadMap = new Map<
      number,
      { is_captain: boolean; is_vice_captain: boolean; is_bench: boolean }
    >();

    if (picksData?.picks?.length) {
      picksData.picks.forEach((pick) => {
        squadMap.set(pick.element, {
          is_captain: Boolean(pick.is_captain),
          is_vice_captain: Boolean(pick.is_vice_captain),
          is_bench: pick.position > 11 || pick.multiplier === 0,
        });
      });
    } else {
      try {
        const squadRows = await query<{
          player_id: number;
          is_captain: boolean | number;
          is_vice_captain: boolean | number;
          is_bench: boolean | number;
        }>(
          `SELECT player_id, is_captain, is_vice_captain, is_bench FROM my_squad WHERE team_id = $1 AND gameweek = $2`,
          [teamId, gameweek]
        );
        squadRows.forEach((r) => {
          squadMap.set(r.player_id, {
            is_captain: Boolean(r.is_captain),
            is_vice_captain: Boolean(r.is_vice_captain),
            is_bench: Boolean(r.is_bench),
          });
        });
      } catch (squadErr) {
        console.warn('[Dashboard API] Could not read cached squad:', squadErr);
      }
    }

    const isHistoricalGw = gameweek < currentEvent.id;
    const allProcessedPlayers: ProcessedPlayer[] = [];
    const playerHistoryCache = new Map<number, FPLElementHistory[]>();

    const squadPlayerIds = Array.from(squadMap.keys());
    const summaries = await fetchElementSummaries(squadPlayerIds, 5);
    summaries.forEach((summary, pid) => {
      if (summary?.history) {
        playerHistoryCache.set(pid, summary.history);
      }
    });

    for (const p of bootstrap.elements) {
      const position = mapPosition(p.element_type);
      const status = mapStatus(p.status);
      const price = Number((p.now_cost / 10).toFixed(1));
      const teamInfo = teamsMap.get(p.team) || {
        name: 'Unknown',
        short_name: 'UNK',
      };
      const avgNext4FDR = calculateNextFDR(p.team, fixtures, gameweek, 4, {
        includeFinished: isHistoricalGw,
      });
      const formScore = calculateFormAdjustedFixtureScore(p.form, avgNext4FDR);

      const history = sortHistoryByRound(playerHistoryCache.get(p.id) || []).filter(
        (h) => h.round <= gameweek
      );
      const minSec =
        history.length > 0
          ? calculateMinutesSecurity(history, 5)
          : estimateMinutesSecurity(p.minutes, gameweek);
      const diffScore = calculateDifferentialScore(
        history,
        p.selected_by_percent,
        p.total_points,
        p.minutes
      );
      const priceRisk = calculatePriceChangeRisk(
        p.transfers_in_event,
        p.transfers_out_event,
        p.cost_change_event
      );

      const last6Points = history.slice(-6).map((h) => ({
        gameweek: h.round,
        points: h.total_points,
      }));

      allProcessedPlayers.push({
        id: p.id,
        web_name: p.web_name,
        team_id: p.team,
        team_name: teamInfo.name,
        team_short_name: teamInfo.short_name,
        position,
        price,
        status,
        total_points: p.total_points,
        selected_by_percent: parseFloat(p.selected_by_percent) || 0.0,
        formAdjustedFixtureScore: formScore,
        minutesSecurityPercent: minSec.percent,
        differentialScore: diffScore,
        priceChangeRisk: priceRisk,
        netTransfersEvent: p.transfers_in_event - p.transfers_out_event,
        avgNext4FDR,
        last_5_gw_minutes: minSec.minutesList,
        last_6_gw_points: last6Points,
        news: p.news,
      });
    }

    const posOrder = { GK: 1, DEF: 2, MID: 3, FWD: 4 };
    const mySquadPlayers = allProcessedPlayers
      .filter((p) => squadMap.has(p.id))
      .map((p) => {
        const flags = squadMap.get(p.id);
        return {
          ...p,
          is_captain: flags?.is_captain || false,
          is_vice_captain: flags?.is_vice_captain || false,
          is_bench: flags?.is_bench || false,
        };
      })
      .sort((a, b) => {
        if (a.is_bench !== b.is_bench) return a.is_bench ? 1 : -1;
        return posOrder[a.position] - posOrder[b.position];
      });

    const starting11 = mySquadPlayers.filter((p) => !p.is_bench);
    const captainPicks = recommendCaptains(starting11);
    const transferAlerts = generateTransferSuggestions(
      mySquadPlayers,
      allProcessedPlayers
    );

    const squadIds = new Set(mySquadPlayers.map((p) => p.id));
    const differentialPicks = allProcessedPlayers
      .filter(
        (p) =>
          !squadIds.has(p.id) &&
          (p.selected_by_percent || 0) <= 15.0 &&
          p.status === 'available' &&
          (p.total_points || 0) > 10
      )
      .sort((a, b) => b.differentialScore - a.differentialScore)
      .slice(0, 10);

    const gwSet = new Set<number>();
    mySquadPlayers.forEach((p) => {
      p.last_6_gw_points?.forEach((pt) => gwSet.add(pt.gameweek));
    });

    const sortedGWs = Array.from(gwSet).sort((a, b) => a - b);
    const formTrendChartData = sortedGWs.map((gw) => {
      const entryRow: Record<string, string | number> = { gameweek: `GW ${gw}` };
      mySquadPlayers.forEach((p) => {
        const pt = p.last_6_gw_points?.find((item) => item.gameweek === gw);
        entryRow[String(p.id)] = pt ? pt.points : 0;
      });
      return entryRow;
    });

    const history = picksData?.entry_history;
    const squadValueFromPlayers = Number(
      mySquadPlayers.reduce((sum, p) => sum + p.price, 0).toFixed(1)
    );
    const aiInsights = buildAiInsights({
      squad: mySquadPlayers,
      captainPicks,
      transferAlerts,
    });

    return NextResponse.json({
      success: true,
      gameweek,
      currentGameweek: currentEvent.id,
      teamId,
      squad: mySquadPlayers,
      captainPicks,
      transferAlerts,
      differentialPicks,
      formTrendChartData,
      aiInsights,
      overview: {
        teamName: entry?.name || 'My FPL Team',
        playerFirstName: entry?.player_first_name || 'FPL',
        playerLastName: entry?.player_last_name || 'Manager',
        totalPoints: history?.total_points ?? entry?.summary_overall_points ?? 0,
        overallRank: history?.overall_rank ?? entry?.summary_overall_rank ?? 0,
        eventPoints: history?.points ?? entry?.summary_event_points ?? 0,
        averagePoints: selectedEvent.average_entry_score ?? 0,
        highestPoints: selectedEvent.highest_score ?? 0,
        squadValue: history?.value
          ? Number((history.value / 10).toFixed(1))
          : entry?.last_deadline_value
          ? Number((entry.last_deadline_value / 10).toFixed(1))
          : squadValueFromPlayers,
        bank: history?.bank
          ? Number((history.bank / 10).toFixed(1))
          : entry?.last_deadline_bank
          ? Number((entry.last_deadline_bank / 10).toFixed(1))
          : 0,
        deadlineTime: selectedEvent.deadline_time || currentEvent.deadline_time,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Dashboard API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load dashboard data' },
      { status: 500 }
    );
  }
}
