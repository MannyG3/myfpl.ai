import assert from 'node:assert';
import test from 'node:test';
import {
  calculateNextFDR,
  calculateFormAdjustedFixtureScore,
  calculateMinutesSecurity,
  calculateDifferentialScore,
  calculatePriceChangeRisk,
  recommendCaptains,
  buildAiInsights,
  buildPickTeamTransferPlan,
  mapStatus,
  estimateMinutesSecurity,
} from '../metrics';
import { FPLFixture, FPLElementHistory, ProcessedPlayer } from '../../types/fpl';

test('calculateNextFDR calculates average difficulty correctly', () => {
  const mockFixtures: FPLFixture[] = [
    { id: 1, event: 3, team_h: 1, team_a: 2, team_h_difficulty: 2, team_a_difficulty: 4, finished: false, kickoff_time: '' },
    { id: 2, event: 4, team_h: 3, team_a: 1, team_h_difficulty: 5, team_a_difficulty: 3, finished: false, kickoff_time: '' },
    { id: 3, event: 5, team_h: 1, team_a: 4, team_h_difficulty: 2, team_a_difficulty: 3, finished: false, kickoff_time: '' },
    { id: 4, event: 6, team_h: 5, team_a: 1, team_h_difficulty: 4, team_a_difficulty: 3, finished: false, kickoff_time: '' },
  ];

  // Team 1 upcoming FDRs: event 3 (2), event 4 (3), event 5 (2), event 6 (3) => avg = (2+3+2+3)/4 = 2.5
  const avgFDR = calculateNextFDR(1, mockFixtures, 3, 4);
  assert.strictEqual(avgFDR, 2.5);
});

test('calculateFormAdjustedFixtureScore weights form against fixture ease', () => {
  // Form = 6.0, FDR = 2.0 => Ease = 4.0 => Score = 6.0 * (4.0 / 3.0) = 8.0
  const scoreHighEase = calculateFormAdjustedFixtureScore('6.0', 2.0);
  assert.strictEqual(scoreHighEase, 8.0);

  // Form = 6.0, FDR = 5.0 => Ease = 1.0 => Score = 6.0 * (1.0 / 3.0) = 2.0
  const scoreLowEase = calculateFormAdjustedFixtureScore('6.0', 5.0);
  assert.strictEqual(scoreLowEase, 2.0);
  assert.ok(scoreHighEase > scoreLowEase);
});

test('calculateMinutesSecurity calculates percentage accurately', () => {
  const mockHistory: FPLElementHistory[] = [
    { element: 1, fixture: 1, opponent_team: 2, total_points: 6, was_home: true, kickoff_time: '', round: 1, minutes: 90, goals_scored: 0, assists: 0, clean_sheets: 1, goals_conceded: 0, bonus: 0, bps: 20 },
    { element: 1, fixture: 2, opponent_team: 3, total_points: 2, was_home: false, kickoff_time: '', round: 2, minutes: 90, goals_scored: 0, assists: 0, clean_sheets: 0, goals_conceded: 1, bonus: 0, bps: 10 },
    { element: 1, fixture: 3, opponent_team: 4, total_points: 1, was_home: true, kickoff_time: '', round: 3, minutes: 45, goals_scored: 0, assists: 0, clean_sheets: 0, goals_conceded: 0, bonus: 0, bps: 5 },
    { element: 1, fixture: 4, opponent_team: 5, total_points: 0, was_home: false, kickoff_time: '', round: 4, minutes: 0, goals_scored: 0, assists: 0, clean_sheets: 0, goals_conceded: 0, bonus: 0, bps: 0 },
    { element: 1, fixture: 5, opponent_team: 6, total_points: 8, was_home: true, kickoff_time: '', round: 5, minutes: 90, goals_scored: 1, assists: 0, clean_sheets: 0, goals_conceded: 1, bonus: 2, bps: 30 },
  ];

  // Total minutes = 90 + 90 + 45 + 0 + 90 = 315 out of 450 => 70%
  const result = calculateMinutesSecurity(mockHistory, 5);
  assert.strictEqual(result.percent, 70.0);
  assert.deepStrictEqual(result.minutesList, [90, 90, 45, 0, 90]);
});

test('calculateDifferentialScore rewards high PPG90 with low ownership', () => {
  const mockHistory: FPLElementHistory[] = [
    { element: 1, fixture: 1, opponent_team: 2, total_points: 10, was_home: true, kickoff_time: '', round: 1, minutes: 90, goals_scored: 1, assists: 1, clean_sheets: 0, goals_conceded: 0, bonus: 3, bps: 40 },
    { element: 1, fixture: 2, opponent_team: 3, total_points: 8, was_home: false, kickoff_time: '', round: 2, minutes: 90, goals_scored: 1, assists: 0, clean_sheets: 0, goals_conceded: 0, bonus: 2, bps: 35 },
  ];

  // PPG90 = 18 pts / 180 mins * 90 = 9 pts/90
  // Low ownership 2.0% => score = 9 / 2.1 = 4.29
  const diffScoreLowOwnership = calculateDifferentialScore(mockHistory, '2.0', 18, 180);
  // High ownership 40.0% => score = 9 / 40.1 = 0.22
  const diffScoreHighOwnership = calculateDifferentialScore(mockHistory, '40.0', 18, 180);

  assert.ok(diffScoreLowOwnership > diffScoreHighOwnership);
});

test('calculatePriceChangeRisk flags net transfer activity', () => {
  assert.strictEqual(calculatePriceChangeRisk(50000, 5000, 0), 'rising');
  assert.strictEqual(calculatePriceChangeRisk(2000, 60000, 0), 'falling');
  assert.strictEqual(calculatePriceChangeRisk(10000, 12000, 0), 'stable');
});

test('recommendCaptains skips unavailable players when alternatives exist', () => {
  const injuredTop: ProcessedPlayer = {
    id: 99,
    web_name: 'Injured Star',
    team_id: 1,
    position: 'FWD',
    price: 12.0,
    status: 'injured',
    formAdjustedFixtureScore: 9.9,
    avgNext4FDR: 1.0,
    minutesSecurityPercent: 0,
    differentialScore: 1.0,
    priceChangeRisk: 'stable',
    netTransfersEvent: 0,
  };
  const squad: ProcessedPlayer[] = [
    injuredTop,
    { id: 1, web_name: 'Player A', team_id: 1, position: 'MID', price: 10.0, status: 'available', formAdjustedFixtureScore: 8.5, avgNext4FDR: 2.0, minutesSecurityPercent: 100, differentialScore: 1.0, priceChangeRisk: 'stable', netTransfersEvent: 0 },
    { id: 2, web_name: 'Player B', team_id: 2, position: 'FWD', price: 12.0, status: 'available', formAdjustedFixtureScore: 5.0, avgNext4FDR: 4.0, minutesSecurityPercent: 90, differentialScore: 0.5, priceChangeRisk: 'stable', netTransfersEvent: 0 },
    { id: 3, web_name: 'Player C', team_id: 3, position: 'MID', price: 8.5, status: 'available', formAdjustedFixtureScore: 7.0, avgNext4FDR: 2.5, minutesSecurityPercent: 100, differentialScore: 1.5, priceChangeRisk: 'stable', netTransfersEvent: 0 },
    { id: 4, web_name: 'Player D', team_id: 4, position: 'DEF', price: 5.5, status: 'available', formAdjustedFixtureScore: 4.0, avgNext4FDR: 3.0, minutesSecurityPercent: 80, differentialScore: 0.2, priceChangeRisk: 'stable', netTransfersEvent: 0 },
  ];
  const captains = recommendCaptains(squad);
  assert.strictEqual(captains[0].web_name, 'Player A');
  assert.ok(!captains.some((p) => p.web_name === 'Injured Star'));
});

test('recommendCaptains ranks top 3 candidates', () => {
  const squad: ProcessedPlayer[] = [
    { id: 1, web_name: 'Player A', team_id: 1, position: 'MID', price: 10.0, status: 'available', formAdjustedFixtureScore: 8.5, avgNext4FDR: 2.0, minutesSecurityPercent: 100, differentialScore: 1.0, priceChangeRisk: 'stable', netTransfersEvent: 0 },
    { id: 2, web_name: 'Player B', team_id: 2, position: 'FWD', price: 12.0, status: 'available', formAdjustedFixtureScore: 5.0, avgNext4FDR: 4.0, minutesSecurityPercent: 90, differentialScore: 0.5, priceChangeRisk: 'stable', netTransfersEvent: 0 },
    { id: 3, web_name: 'Player C', team_id: 3, position: 'MID', price: 8.5, status: 'available', formAdjustedFixtureScore: 7.0, avgNext4FDR: 2.5, minutesSecurityPercent: 100, differentialScore: 1.5, priceChangeRisk: 'stable', netTransfersEvent: 0 },
    { id: 4, web_name: 'Player D', team_id: 4, position: 'DEF', price: 5.5, status: 'available', formAdjustedFixtureScore: 4.0, avgNext4FDR: 3.0, minutesSecurityPercent: 80, differentialScore: 0.2, priceChangeRisk: 'stable', netTransfersEvent: 0 },
  ];

  const captains = recommendCaptains(squad);
  assert.strictEqual(captains.length, 3);
  assert.strictEqual(captains[0].web_name, 'Player A');
});

test('buildAiInsights rates team health and surfaces the top transfer', () => {
  const squad: ProcessedPlayer[] = [
    { id: 1, web_name: 'Star Mid', team_id: 1, position: 'MID', price: 8.5, status: 'available', formAdjustedFixtureScore: 8.5, avgNext4FDR: 2.2, minutesSecurityPercent: 92, differentialScore: 2.1, priceChangeRisk: 'rising', netTransfersEvent: 50000 },
    { id: 2, web_name: 'Risky Forward', team_id: 2, position: 'FWD', price: 7.4, status: 'available', formAdjustedFixtureScore: 3.4, avgNext4FDR: 3.8, minutesSecurityPercent: 46, differentialScore: 0.8, priceChangeRisk: 'stable', netTransfersEvent: 0 },
    { id: 3, web_name: 'Solid Defender', team_id: 3, position: 'DEF', price: 5.2, status: 'available', formAdjustedFixtureScore: 6.7, avgNext4FDR: 2.8, minutesSecurityPercent: 88, differentialScore: 1.4, priceChangeRisk: 'stable', netTransfersEvent: 2000 },
  ];

  const insights = buildAiInsights({
    squad,
    captainPicks: [squad[0]],
    transferAlerts: [{
      outPlayer: squad[1],
      inPlayerOptions: [{ ...squad[0], id: 99, web_name: 'New Target' }],
      reason: 'High rotation risk (46% minutes).',
    }],
  });

  assert.ok(insights.teamRating >= 70 && insights.teamRating <= 100);
  assert.strictEqual(insights.headline.includes('AI'), true);
  assert.strictEqual(insights.priorityMoves[0].title, 'Transfer priority');
  assert.strictEqual(insights.priorityMoves[1].title, 'Captain plan');
});

test('mapStatus treats unavailable as injured, not available', () => {
  assert.strictEqual(mapStatus('a'), 'available');
  assert.strictEqual(mapStatus('i'), 'injured');
  assert.strictEqual(mapStatus('u'), 'injured');
  assert.strictEqual(mapStatus('s'), 'suspended');
});

test('buildPickTeamTransferPlan creates recommended transfers and 3-week analysis', () => {
  const squad: ProcessedPlayer[] = [
    { id: 1, web_name: 'Star Mid', team_id: 1, position: 'MID', price: 8.5, status: 'available', formAdjustedFixtureScore: 8.8, avgNext4FDR: 2.1, minutesSecurityPercent: 92, differentialScore: 2.1, priceChangeRisk: 'rising', netTransfersEvent: 50000 },
    { id: 2, web_name: 'Risky Forward', team_id: 2, position: 'FWD', price: 7.4, status: 'available', formAdjustedFixtureScore: 3.4, avgNext4FDR: 3.8, minutesSecurityPercent: 46, differentialScore: 0.8, priceChangeRisk: 'stable', netTransfersEvent: 0 },
    { id: 3, web_name: 'Solid Defender', team_id: 3, position: 'DEF', price: 5.2, status: 'available', formAdjustedFixtureScore: 6.7, avgNext4FDR: 2.8, minutesSecurityPercent: 88, differentialScore: 1.4, priceChangeRisk: 'stable', netTransfersEvent: 2000 },
  ];
  const allPlayers: ProcessedPlayer[] = [
    ...squad,
    { id: 99, web_name: 'Upgrade Mid', team_id: 10, position: 'MID', price: 8.8, status: 'available', formAdjustedFixtureScore: 9.1, avgNext4FDR: 2.0, minutesSecurityPercent: 90, differentialScore: 1.9, priceChangeRisk: 'stable', netTransfersEvent: 1000 },
    { id: 100, web_name: 'Upgrade Forward', team_id: 11, position: 'FWD', price: 7.7, status: 'available', formAdjustedFixtureScore: 5.3, avgNext4FDR: 2.9, minutesSecurityPercent: 78, differentialScore: 1.2, priceChangeRisk: 'stable', netTransfersEvent: 5000 },
  ];

  const plan = buildPickTeamTransferPlan({ squad, allPlayers, currentGameweek: 7 });
  assert.ok(plan.pickTeamTransfers.length >= 1);
  assert.strictEqual(plan.nextThreeWeekAnalysis.length, 3);
  assert.strictEqual(plan.nextThreeWeekAnalysis[0].gameweek, 8);
  assert.ok(plan.nextThreeWeekAnalysis[0].summary.length > 0);
});

test('calculateMinutesSecurity is 0 when history is missing', () => {
  const empty = calculateMinutesSecurity([]);
  assert.strictEqual(empty.percent, 0);
});

test('estimateMinutesSecurity uses season minutes against possible minutes', () => {
  // 270 minutes over 4 GWs = 270/360 = 75%
  const estimated = estimateMinutesSecurity(270, 4);
  assert.strictEqual(estimated.percent, 75);
});

test('calculateNextFDR can include finished fixtures for historical gameweeks', () => {
  const mockFixtures: FPLFixture[] = [
    { id: 1, event: 1, team_h: 1, team_a: 2, team_h_difficulty: 2, team_a_difficulty: 4, finished: true, kickoff_time: '' },
    { id: 2, event: 2, team_h: 3, team_a: 1, team_h_difficulty: 5, team_a_difficulty: 3, finished: true, kickoff_time: '' },
  ];
  const liveOnly = calculateNextFDR(1, mockFixtures, 1, 4);
  const historical = calculateNextFDR(1, mockFixtures, 1, 4, { includeFinished: true });
  assert.strictEqual(liveOnly, 3.0);
  assert.strictEqual(historical, 2.5);
});

test('calculateMinutesSecurity uses most recent rounds even if history is unsorted', () => {
  const mockHistory: FPLElementHistory[] = [
    { element: 1, fixture: 5, opponent_team: 6, total_points: 8, was_home: true, kickoff_time: '', round: 5, minutes: 90, goals_scored: 1, assists: 0, clean_sheets: 0, goals_conceded: 1, bonus: 2, bps: 30 },
    { element: 1, fixture: 1, opponent_team: 2, total_points: 6, was_home: true, kickoff_time: '', round: 1, minutes: 0, goals_scored: 0, assists: 0, clean_sheets: 1, goals_conceded: 0, bonus: 0, bps: 20 },
  ];
  const result = calculateMinutesSecurity(mockHistory, 2);
  assert.deepStrictEqual(result.minutesList, [0, 90]);
  assert.strictEqual(result.percent, 50);
});
