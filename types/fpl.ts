export interface FPLBootstrapElement {
  id: number;
  web_name: string;
  first_name: string;
  second_name: string;
  team: number;
  element_type: number; // 1: GKP, 2: DEF, 3: MID, 4: FWD
  now_cost: number; // e.g. 60 = 6.0m
  status: string; // 'a', 'i', 'd', 's', 'u'
  form: string;
  selected_by_percent: string;
  total_points: number;
  event_points?: number;
  transfers_in_event: number;
  transfers_out_event: number;
  cost_change_event: number;
  cost_change_fall: number;
  cost_change_start: number;
  minutes: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  goals_conceded: number;
  chance_of_playing_next_round: number | null;
  news: string;
}

export interface FPLTeam {
  id: number;
  name: string;
  short_name: string;
  strength: number;
}

export interface FPLEvent {
  id: number;
  name: string;
  deadline_time: string;
  is_previous: boolean;
  is_current: boolean;
  is_next: boolean;
  finished: boolean;
  average_entry_score?: number;
  highest_score?: number | null;
}

export interface FPLBootstrapData {
  elements: FPLBootstrapElement[];
  teams: FPLTeam[];
  events: FPLEvent[];
  element_types: {
    id: number;
    singular_name: string;
    singular_name_short: string;
  }[];
}

export interface FPLFixture {
  id: number;
  event: number | null;
  team_h: number;
  team_a: number;
  team_h_difficulty: number;
  team_a_difficulty: number;
  finished: boolean;
  kickoff_time: string;
}

export interface FPLElementHistory {
  element: number;
  fixture: number;
  opponent_team: number;
  total_points: number;
  was_home: boolean;
  kickoff_time: string;
  round: number;
  minutes: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  goals_conceded: number;
  bonus: number;
  bps: number;
}

export interface FPLElementSummary {
  fixtures: any[];
  history: FPLElementHistory[];
  history_past: any[];
}

export interface FPLPick {
  element: number;
  position: number;
  multiplier: number;
  is_captain: boolean;
  is_vice_captain: boolean;
}

export interface FPLEntry {
  id: number;
  name: string;
  player_first_name: string;
  player_last_name: string;
  summary_overall_points: number;
  summary_overall_rank: number | null;
  summary_event_points: number;
  current_event: number | null;
  last_deadline_bank: number;
  last_deadline_value: number;
}

export interface FPLPicksResponse {
  active_chip: string | null;
  automatic_subs: any[];
  entry_history: {
    event: number;
    points: number;
    total_points: number;
    rank: number;
    overall_rank: number;
    bank: number;
    value: number;
  };
  picks: FPLPick[];
}

// Database entities & Custom Computed Metrics
export interface PlayerRecord {
  id: number;
  web_name: string;
  team_id: number;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  price: number; // in millions e.g. 6.0
  status: string; // 'available' | 'injured' | 'doubtful' | 'suspended'
}

export interface PlayerGameweekStatsRecord {
  player_id: number;
  gameweek: number;
  minutes: number;
  points: number;
  form: number;
  selected_by_percent: number;
  price: number;
  fixture_difficulty: number;
}

export interface MySquadRecord {
  team_id?: number;
  gameweek: number;
  player_id: number;
  is_captain: boolean;
  is_vice_captain: boolean;
  is_bench: boolean;
}

export interface ComputedMetrics {
  formAdjustedFixtureScore: number;
  minutesSecurityPercent: number;
  differentialScore: number;
  priceChangeRisk: 'rising' | 'falling' | 'stable';
  netTransfersEvent: number;
  avgNext4FDR: number;
}

export interface ProcessedPlayer extends PlayerRecord, ComputedMetrics {
  team_name?: string;
  team_short_name?: string;
  total_points?: number;
  selected_by_percent?: number;
  last_5_gw_minutes?: number[];
  last_6_gw_points?: { gameweek: number; points: number }[];
  news?: string;
}

export interface TransferSuggestion {
  outPlayer: ProcessedPlayer;
  inPlayerOptions: ProcessedPlayer[];
  reason: string;
}
