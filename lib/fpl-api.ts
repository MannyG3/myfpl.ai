import {
  FPLBootstrapData,
  FPLFixture,
  FPLElementSummary,
  FPLPicksResponse,
  FPLEntry,
} from '@/types/fpl';

const FPL_BASE_URL = 'https://fantasy.premierleague.com/api';

const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'application/json',
};

async function fetchJson<T>(
  path: string,
  timeoutMs: number
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${FPL_BASE_URL}${path}`, {
      headers: DEFAULT_HEADERS,
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!res.ok) {
      const error = new Error(
        `Failed to fetch ${path}: ${res.status} ${res.statusText}`
      ) as Error & { status?: number };
      error.status = res.status;
      throw error;
    }
    return (await res.json()) as T;
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error(`FPL request timed out after ${timeoutMs}ms: ${path}`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchBootstrapStatic(): Promise<FPLBootstrapData> {
  return fetchJson<FPLBootstrapData>('/bootstrap-static/', 12000);
}

export async function fetchFixtures(): Promise<FPLFixture[]> {
  return fetchJson<FPLFixture[]>('/fixtures/', 12000);
}

export async function fetchElementSummary(
  playerId: number
): Promise<FPLElementSummary> {
  return fetchJson<FPLElementSummary>(`/element-summary/${playerId}/`, 8000);
}

export async function fetchEntry(teamId: number): Promise<FPLEntry | null> {
  try {
    return await fetchJson<FPLEntry>(`/entry/${teamId}/`, 8000);
  } catch (err: any) {
    if (err?.status === 404) {
      console.warn(`FPL entry not found for team ${teamId}`);
      return null;
    }
    console.error(`Error fetching FPL entry ${teamId}:`, err);
    return null;
  }
}

export async function fetchEntryPicks(
  teamId: number,
  gameweek: number
): Promise<FPLPicksResponse | null> {
  try {
    return await fetchJson<FPLPicksResponse>(
      `/entry/${teamId}/event/${gameweek}/picks/`,
      8000
    );
  } catch (err: any) {
    if (err?.status === 404) {
      console.warn(`Picks not available for team ${teamId} in GW ${gameweek}`);
      return null;
    }
    console.error(`Error fetching picks for team ${teamId} GW ${gameweek}:`, err);
    return null;
  }
}

export async function fetchElementSummaries(
  playerIds: number[],
  concurrency = 5
): Promise<Map<number, FPLElementSummary>> {
  const results = new Map<number, FPLElementSummary>();
  if (playerIds.length === 0) return results;

  let cursor = 0;
  const workerCount = Math.min(concurrency, playerIds.length);

  async function worker() {
    while (cursor < playerIds.length) {
      const id = playerIds[cursor++];
      try {
        results.set(id, await fetchElementSummary(id));
      } catch (e) {
        console.warn(`Failed to fetch history for player ${id}`);
      }
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}
