import { NextResponse } from 'next/server';
import { initDb, execute, executeMany } from '@/lib/db';
import {
  fetchBootstrapStatic,
  fetchFixtures,
  fetchEntryPicks,
} from '@/lib/fpl-api';
import {
  mapPosition,
  mapStatus,
  calculateNextFDR,
} from '@/lib/metrics';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

function isAuthorizedCronRequest(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const auth = request.headers.get('authorization');
  if (auth === `Bearer ${secret}`) return true;
  // Dashboard "Sync" is a browser call and cannot send the cron secret.
  return process.env.NODE_ENV !== 'production';
}

export async function GET(request: Request) {
  try {
    if (!isAuthorizedCronRequest(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const teamIdParam = searchParams.get('teamId');
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
    } catch (dbErr: any) {
      return NextResponse.json(
        {
          success: false,
          error:
            dbErr?.message ||
            'Database is unavailable. Set a real POSTGRES_URL or install better-sqlite3.',
        },
        { status: 503 }
      );
    }

    const bootstrap = await fetchBootstrapStatic();
    const fixtures = await fetchFixtures();

    const currentEvent =
      bootstrap.events.find((e) => e.is_current) ||
      bootstrap.events.find((e) => e.is_next) ||
      bootstrap.events[0];

    if (!currentEvent) {
      throw new Error('Could not determine the current FPL gameweek');
    }

    const gameweek = currentEvent.id;
    console.log(`[Cron] Syncing data for Gameweek ${gameweek}...`);

    const playerRows: any[][] = [];
    const statsRows: any[][] = [];

    for (const p of bootstrap.elements) {
      const position = mapPosition(p.element_type);
      const status = mapStatus(p.status);
      const price = Number((p.now_cost / 10).toFixed(1));
      const form = parseFloat(p.form) || 0.0;
      const selectedByPercent = parseFloat(p.selected_by_percent) || 0.0;
      const avgFDR = Math.round(calculateNextFDR(p.team, fixtures, gameweek, 4));

      playerRows.push([p.id, p.web_name, p.team, position, price, status]);
      statsRows.push([
        p.id,
        gameweek,
        p.minutes,
        p.event_points || 0,
        form,
        selectedByPercent,
        price,
        avgFDR,
      ]);
    }

    await executeMany(
      `INSERT INTO players (id, web_name, team_id, position, price, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         web_name = EXCLUDED.web_name,
         team_id = EXCLUDED.team_id,
         position = EXCLUDED.position,
         price = EXCLUDED.price,
         status = EXCLUDED.status;`,
      playerRows
    );

    await executeMany(
      `INSERT INTO player_gameweek_stats (player_id, gameweek, minutes, points, form, selected_by_percent, price, fixture_difficulty)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (player_id, gameweek) DO UPDATE SET
         minutes = EXCLUDED.minutes,
         points = EXCLUDED.points,
         form = EXCLUDED.form,
         selected_by_percent = EXCLUDED.selected_by_percent,
         price = EXCLUDED.price,
         fixture_difficulty = EXCLUDED.fixture_difficulty;`,
      statsRows
    );

    let squadCount = 0;
    const picksData = await fetchEntryPicks(teamId, gameweek);

    if (picksData?.picks?.length) {
      await execute(`DELETE FROM my_squad WHERE team_id = $1 AND gameweek = $2;`, [
        teamId,
        gameweek,
      ]);

      const squadRows = picksData.picks.map((pick) => {
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

      await executeMany(
        `INSERT INTO my_squad (team_id, gameweek, player_id, is_captain, is_vice_captain, is_bench)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (team_id, gameweek, player_id) DO UPDATE SET
           is_captain = EXCLUDED.is_captain,
           is_vice_captain = EXCLUDED.is_vice_captain,
           is_bench = EXCLUDED.is_bench;`,
        squadRows
      );
      squadCount = squadRows.length;
    }

    return NextResponse.json({
      success: true,
      gameweek,
      teamId,
      playersProcessed: playerRows.length,
      squadCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Cron] Update stats failed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Cron sync failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
