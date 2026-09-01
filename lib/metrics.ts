import {
  FPLFixture,
  FPLElementHistory,
  ProcessedPlayer,
  TransferSuggestion,
} from '@/types/fpl';

export interface AiMove {
  title: string;
  description: string;
  score: number;
  kind: 'transfer' | 'captain' | 'risk';
}

export interface AiInsights {
  headline: string;
  teamRating: number;
  summary: string;
  priorityMoves: AiMove[];
}

export function sortHistoryByRound(
  history: FPLElementHistory[] | undefined | null
): FPLElementHistory[] {
  if (!history || history.length === 0) return [];
  return history.slice().sort((a, b) => a.round - b.round);
}

/**
 * Maps FPL element_type (1, 2, 3, 4) to standard position string ('GK', 'DEF', 'MID', 'FWD')
 */
export function mapPosition(elementType: number): 'GK' | 'DEF' | 'MID' | 'FWD' {
  switch (elementType) {
    case 1:
      return 'GK';
    case 2:
      return 'DEF';
    case 3:
      return 'MID';
    case 4:
      return 'FWD';
    default:
      return 'MID';
  }
}

/**
 * Maps FPL status code ('a', 'i', 'd', 's', 'u') to status string
 */
export function mapStatus(
  status: string
): 'available' | 'injured' | 'doubtful' | 'suspended' {
  switch (status) {
    case 'a':
      return 'available';
    case 'i':
      return 'injured';
    case 'd':
      return 'doubtful';
    case 's':
      return 'suspended';
    case 'u':
      return 'injured';
    default:
      return 'available';
  }
}

/**
 * METRIC 1: Calculate Average Fixture Difficulty Rating (FDR) of next N upcoming fixtures for a team.
 */
export function calculateNextFDR(
  teamId: number,
  fixtures: FPLFixture[],
  currentGameweek: number,
  count: number = 4,
  options: { includeFinished?: boolean } = {}
): number {
  const includeFinished = options.includeFinished === true;
  const upcomingFixtures = fixtures
    .filter(
      (f) =>
        f.event !== null &&
        f.event >= currentGameweek &&
        (f.team_h === teamId || f.team_a === teamId) &&
        (includeFinished || !f.finished)
    )
    .sort((a, b) => (a.event || 0) - (b.event || 0))
    .slice(0, count);

  if (upcomingFixtures.length === 0) return 3.0; // Default neutral FDR

  const totalFDR = upcomingFixtures.reduce((sum, f) => {
    const fdr = f.team_h === teamId ? f.team_h_difficulty : f.team_a_difficulty;
    return sum + fdr;
  }, 0);

  return Number((totalFDR / upcomingFixtures.length).toFixed(2));
}

/**
 * METRIC 1: Form-adjusted fixture score.
 * Formula: Player's recent form weighted against difficulty of next 4 fixtures.
 * Easier upcoming fixtures + rising form = higher score.
 *
 * Customize metrics weights here:
 * - formWeight: impact of player's recent points per game
 * - fixtureEaseMultiplier: ease scale where FDR 1 (easiest) gives highest multiplier
 */
export function calculateFormAdjustedFixtureScore(
  formStr: string,
  avgNext4FDR: number
): number {
  const form = parseFloat(formStr) || 0.0;
  // FDR scale is 1 (easiest) to 5 (hardest).
  // Fixture Ease = 6 - FDR (ranges from 1 for FDR 5 to 5 for FDR 1).
  const fixtureEase = Math.max(1.0, 6.0 - avgNext4FDR);

  // Score = form * (fixtureEase / 3.0)
  // Base scale normalized around 0 to 10
  const score = form * (fixtureEase / 3.0);
  return Number(score.toFixed(2));
}

/**
 * METRIC 2: Minutes Security.
 * Formula: % of possible minutes played over last N gameweeks (default 5).
 * Flags rotation risk even for in-form players.
 */
export function calculateMinutesSecurity(
  history: FPLElementHistory[],
  lastNGameweeks: number = 5
): { percent: number; minutesList: number[] } {
  const chronological = sortHistoryByRound(history);
  if (chronological.length === 0) {
    return { percent: 0, minutesList: [] };
  }

  const recentHistory = chronological.slice(-lastNGameweeks);

  const totalPlayedMinutes = recentHistory.reduce((sum, h) => sum + h.minutes, 0);
  const maxPossibleMinutes = recentHistory.length * 90;

  if (maxPossibleMinutes === 0) return { percent: 0, minutesList: [] };

  const percent = Number(
    ((totalPlayedMinutes / maxPossibleMinutes) * 100).toFixed(1)
  );
  const minutesList = recentHistory.map((h) => h.minutes);

  return { percent, minutesList };
}

/**
 * Approximate minutes security from season totals when match history is missing.
 */
export function estimateMinutesSecurity(
  totalMinutes: number,
  currentGameweek: number
): { percent: number; minutesList: number[] } {
  const gwCount = Math.max(1, currentGameweek);
  const maxMins = gwCount * 90;
  const percent = Number(
    Math.min(100, (Math.max(0, totalMinutes) / maxMins) * 100).toFixed(1)
  );
  return { percent, minutesList: [] };
}

/**
 * METRIC 3: Differential Score.
 * Formula: Points-per-90 relative to ownership %.
 * Surfaces high-performing players with low ownership.
 */
export function calculateDifferentialScore(
  history: FPLElementHistory[],
  selectedByPercentStr: string,
  totalPoints: number,
  totalMinutes: number
): number {
  const parsedOwnership = parseFloat(selectedByPercentStr);
  const ownership = Number.isFinite(parsedOwnership) ? parsedOwnership : 0;

  // Calculate points per 90 from recent history if available, else overall season
  let pointsPer90 = 0;
  const chronological = sortHistoryByRound(history);
  if (chronological.length > 0) {
    const recent = chronological.slice(-5);
    const recentMins = recent.reduce((sum, h) => sum + h.minutes, 0);
    const recentPts = recent.reduce((sum, h) => sum + h.total_points, 0);
    if (recentMins > 0) {
      pointsPer90 = (recentPts / recentMins) * 90;
    }
  }

  if (pointsPer90 === 0 && totalMinutes > 0) {
    pointsPer90 = (totalPoints / totalMinutes) * 90;
  }

  // Differential formula: Points-Per-90 / (Ownership % + 0.1)
  const score = pointsPer90 / (ownership + 0.1);
  return Number(score.toFixed(2));
}

/**
 * METRIC 4: Price Change Risk.
 * Flags players trending toward a price rise/fall based on net transfers in/out.
 */
export function calculatePriceChangeRisk(
  transfersInEvent: number,
  transfersOutEvent: number,
  costChangeEvent: number
): 'rising' | 'falling' | 'stable' {
  const netTransfers = transfersInEvent - transfersOutEvent;

  if (costChangeEvent > 0 || netTransfers > 40000) {
    return 'rising';
  } else if (costChangeEvent < 0 || netTransfers < -40000) {
    return 'falling';
  }
  return 'stable';
}

/**
 * METRIC 5: Transfer Suggestions.
 * Suggest 2 replacement candidates in the same position and similar price bracket
 * for red-flagged squad members.
 */
export function generateTransferSuggestions(
  squadPlayers: ProcessedPlayer[],
  allPlayers: ProcessedPlayer[]
): TransferSuggestion[] {
  const suggestions: TransferSuggestion[] = [];

  // Flag squad players with formAdjustedFixtureScore < 4.0 or minutesSecurityPercent < 60
  const underperforming = squadPlayers.filter(
    (p) => p.formAdjustedFixtureScore < 4.0 || p.minutesSecurityPercent < 65 || p.status !== 'available'
  );

  for (const outPlayer of underperforming) {
    // Find candidates in same position, price <= outPlayer.price + 0.5, not in current squad
    const squadIds = new Set(squadPlayers.map((s) => s.id));
    const candidates = allPlayers
      .filter(
        (cand) =>
          cand.position === outPlayer.position &&
          cand.id !== outPlayer.id &&
          !squadIds.has(cand.id) &&
          cand.price <= outPlayer.price + 0.5 &&
          cand.status === 'available' &&
          cand.formAdjustedFixtureScore > outPlayer.formAdjustedFixtureScore
      )
      .sort(
        (a, b) => b.formAdjustedFixtureScore - a.formAdjustedFixtureScore
      )
      .slice(0, 2);

    if (candidates.length > 0) {
      let reason = '';
      if (outPlayer.status !== 'available') {
        reason = `Flagged due to status (${outPlayer.status}).`;
      } else if (outPlayer.minutesSecurityPercent < 65) {
        reason = `High rotation risk (${outPlayer.minutesSecurityPercent}% minutes).`;
      } else {
        reason = `Low form-adjusted fixture score (${outPlayer.formAdjustedFixtureScore}).`;
      }

      suggestions.push({
        outPlayer,
        inPlayerOptions: candidates,
        reason,
      });
    }
  }

  return suggestions;
}

/**
 * METRIC 6: Captain Recommendation.
 * Rank starting 11 by (form-adjusted fixture score × fixture ease) and return top 3.
 */
export function recommendCaptains(
  starting11: ProcessedPlayer[]
): ProcessedPlayer[] {
  const eligible = starting11.filter((p) => p.status === 'available');
  const pool = eligible.length > 0 ? eligible : starting11;
  return pool
    .slice()
    .sort((a, b) => {
      const aEase = Math.max(1, 6 - a.avgNext4FDR);
      const bEase = Math.max(1, 6 - b.avgNext4FDR);
      const aScore = a.formAdjustedFixtureScore * aEase;
      const bScore = b.formAdjustedFixtureScore * bEase;
      return bScore - aScore;
    })
    .slice(0, 3);
}

export function buildAiInsights({
  squad,
  captainPicks,
  transferAlerts,
}: {
  squad: ProcessedPlayer[];
  captainPicks?: ProcessedPlayer[];
  transferAlerts?: TransferSuggestion[];
}): AiInsights {
  const available = squad.filter((p) => p.status === 'available');
  const avgForm =
    available.length > 0
      ? available.reduce((sum, p) => sum + (p.formAdjustedFixtureScore || 0), 0) /
        available.length
      : 0;
  const avgMinutes =
    available.length > 0
      ? available.reduce((sum, p) => sum + (p.minutesSecurityPercent || 0), 0) /
        available.length
      : 0;
  const riskyPlayers = squad.filter(
    (p) => p.status !== 'available' || (p.minutesSecurityPercent || 0) < 60
  ).length;

  const baseRating =
    Math.min(
      95,
      Math.max(
        45,
        Math.round(avgForm * 7 + avgMinutes * 0.35 - riskyPlayers * 5 + 20)
      )
    );

  const transferLead = transferAlerts?.[0];
  const captainLead = captainPicks?.[0];
  const headline =
    baseRating >= 80
      ? 'AI Team Rating: strong outlook with a clean route to points.'
      : baseRating >= 65
      ? 'AI Team Rating: solid but a few weak spots need attention.'
      : 'AI Team Rating: the squad needs a sharper plan to stay competitive.';

  const summary =
    available.length > 0
      ? `Your squad averages ${avgForm.toFixed(1)} form-fixture points and ${avgMinutes.toFixed(0)}% minutes security across the available XI. ${riskyPlayers > 0 ? `${riskyPlayers} player${riskyPlayers > 1 ? 's are' : ' is'} carrying risk this round.` : 'No major rotation concerns stand out.'}`
      : 'No available squad data is currently loaded for this gameweek.';

  const priorityMoves: AiMove[] = [
    {
      title: 'Transfer priority',
      description: transferLead
        ? `${transferLead.outPlayer.web_name} is the clearest upgrade target. ${transferLead.inPlayerOptions[0]?.web_name || 'A higher-upside option'} offers a better risk-adjusted profile.`
        : 'No urgent transfer signal is flashing yet. Keep your XI stable unless a major news story drops.',
      score: transferLead ? Math.min(98, Math.round((transferLead.outPlayer.minutesSecurityPercent || 0) + 20)) : 70,
      kind: 'transfer',
    },
    {
      title: 'Captain plan',
      description: captainLead
        ? `${captainLead.web_name} is the current top captaincy pick based on form, fixture ease and minutes security.`
        : 'No captaincy option is standing out strongly. Consider a differential route if your core picks are locked.',
      score: captainLead ? Math.min(99, Math.round((captainLead.formAdjustedFixtureScore || 0) * 10)) : 72,
      kind: 'captain',
    },
  ];

  if (riskyPlayers > 0) {
    priorityMoves.push({
      title: 'Risk watch',
      description: `${riskyPlayers} player${riskyPlayers > 1 ? 's' : ''} are either injured, doubtful or below 60% minutes security. Review bench coverage before locking your XI.`,
      score: Math.max(40, 100 - riskyPlayers * 12),
      kind: 'risk',
    });
  }

  return {
    headline,
    teamRating: baseRating,
    summary,
    priorityMoves: priorityMoves.slice(0, 3),
  };
}
