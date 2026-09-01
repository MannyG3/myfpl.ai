import { neon } from '@neondatabase/serverless';
import { Pool } from 'pg';
import path from 'path';

let sqliteDb: any = null;
let pgPool: Pool | null = null;
let skipPostgres = false;
let warnedPlaceholder = false;
let sqliteLoadError: string | null = null;

function isPlaceholderConnectionString(url: string) {
  const lower = url.toLowerCase();
  return (
    lower.includes('ep-sample') ||
    lower.includes('user:password@') ||
    lower.includes('changeme') ||
    lower.includes('your-password')
  );
}

function getConnectionString() {
  if (skipPostgres) return '';
  const raw = process.env.POSTGRES_URL || process.env.DATABASE_URL || '';
  if (!raw) return '';
  if (isPlaceholderConnectionString(raw)) {
    if (!warnedPlaceholder) {
      console.warn(
        'Placeholder Postgres URL detected; using local SQLite (fpl_local.db).'
      );
      warnedPlaceholder = true;
    }
    skipPostgres = true;
    return '';
  }
  return raw;
}

function isNeonUrl(url: string) {
  return url.includes('neon.tech') || url.includes('vercel-storage');
}

function getSqliteDb() {
  if (!sqliteDb) {
    try {
      const Database = require('better-sqlite3');
      const dbPath = path.join(process.cwd(), 'fpl_local.db');
      sqliteDb = new Database(dbPath);
      sqliteDb.pragma('journal_mode = WAL');
      sqliteLoadError = null;
    } catch (e) {
      sqliteLoadError = String((e as Error)?.message || e);
      console.warn('SQLite initialization failed:', sqliteLoadError);
    }
  }
  return sqliteDb;
}

function getPgPool() {
  const connectionString = getConnectionString();
  if (!connectionString) return null;
  if (!pgPool) {
    pgPool = new Pool({ connectionString });
  }
  return pgPool;
}

function toSqliteSql(sql: string) {
  return sql.replace(/\$\d+\b/g, '?');
}

function bindParams(params: any[]) {
  return params.map((p) => (typeof p === 'boolean' ? (p ? 1 : 0) : p));
}

function isReadQuery(sql: string) {
  return /^\s*(select|with)\b/i.test(sql);
}

function shouldFallbackToSqlite(err: unknown) {
  if (process.env.NODE_ENV === 'production' && !isPlaceholderConnectionString(
    process.env.POSTGRES_URL || process.env.DATABASE_URL || ''
  )) {
    return false;
  }
  const message = [
    (err as any)?.message,
    (err as any)?.detail,
    (err as any)?.code,
    (err as any)?.name,
    String(err),
  ]
    .filter(Boolean)
    .join(' ');
  return /password authentication failed|authentication failed|NeonDbError|ENOTFOUND|ECONNREFUSED|getaddrinfo|28P01|ETIMEDOUT|certificate/i.test(
    message
  );
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const connectionString = getConnectionString();
  if (connectionString) {
    try {
      if (isNeonUrl(connectionString)) {
        const sqlClient = neon(connectionString);
        const result = await sqlClient(sql, params);
        return result as T[];
      }
      const pool = getPgPool()!;
      const res = await pool.query(sql, params);
      return res.rows as T[];
    } catch (err) {
      console.error('Postgres query error:', err);
      if (shouldFallbackToSqlite(err)) {
        skipPostgres = true;
        console.warn('Falling back to local SQLite after Postgres connection failure.');
        return query<T>(sql, params);
      }
      throw err;
    }
  }

  const db = getSqliteDb();
  if (!db) {
    throw new Error(
      sqliteLoadError
        ? `No database connection available (${sqliteLoadError}).`
        : 'No database connection available (neither POSTGRES_URL nor local SQLite).'
    );
  }

  const sqliteSql = toSqliteSql(sql);
  const boundParams = bindParams(params);
  const stmt = db.prepare(sqliteSql);
  if (isReadQuery(sql)) {
    return stmt.all(...boundParams) as T[];
  }
  stmt.run(...boundParams);
  return [] as T[];
}

export async function execute(sql: string, params: any[] = []): Promise<void> {
  await query(sql, params);
}

export async function executeMany(sql: string, rows: any[][]): Promise<void> {
  if (!rows.length) return;

  if (getConnectionString()) {
    for (const row of rows) {
      await execute(sql, row);
    }
    return;
  }

  const db = getSqliteDb();
  if (!db) {
    throw new Error('No database connection available.');
  }

  const stmt = db.prepare(toSqliteSql(sql));
  const tx = db.transaction((items: any[][]) => {
    for (const row of items) {
      stmt.run(...bindParams(row));
    }
  });
  tx(rows);
}

async function tableHasColumn(table: string, column: string): Promise<boolean> {
  if (getConnectionString()) {
    const rows = await query<{ column_exists: number }>(
      `SELECT 1 AS column_exists
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2
       LIMIT 1`,
      [table, column]
    );
    return rows.length > 0;
  }

  const db = getSqliteDb();
  if (!db) return false;
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return cols.some((c) => c.name === column);
}

async function migrateMySquadTeamId() {
  const hasTable = getConnectionString()
    ? (
        await query<{ table_exists: number }>(
          `SELECT 1 AS table_exists FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'my_squad' LIMIT 1`
        )
      ).length > 0
    : Boolean(
        getSqliteDb()?.prepare(
          `SELECT name FROM sqlite_master WHERE type='table' AND name='my_squad'`
        ).get()
      );

  if (!hasTable) return;
  if (!(await tableHasColumn('my_squad', 'team_id'))) {
    if (getConnectionString()) {
      await execute(`ALTER TABLE my_squad ADD COLUMN team_id INT NOT NULL DEFAULT 1`);
    } else {
      const db = getSqliteDb();
      if (!db) return;
      db.exec(`ALTER TABLE my_squad ADD COLUMN team_id INT NOT NULL DEFAULT 1;`);
    }
  }

  if (getConnectionString()) {
    await execute(
      `CREATE UNIQUE INDEX IF NOT EXISTS my_squad_team_gw_player
       ON my_squad (team_id, gameweek, player_id)`
    );
    return;
  }

  const db = getSqliteDb();
  if (!db) return;
  const tableSqlRow = db
    .prepare(
      `SELECT sql FROM sqlite_master WHERE type='table' AND name='my_squad'`
    )
    .get() as { sql?: string } | undefined;
  const tableSql = tableSqlRow?.sql || '';
  const hasCompositePk = /PRIMARY KEY\s*\(\s*team_id\s*,\s*gameweek\s*,\s*player_id\s*\)/i.test(
    tableSql
  );
  if (hasCompositePk) return;

  db.exec(`
    CREATE TABLE IF NOT EXISTS my_squad_migrated (
      team_id INT NOT NULL DEFAULT 1,
      gameweek INT NOT NULL,
      player_id INT NOT NULL,
      is_captain BOOLEAN NOT NULL DEFAULT FALSE,
      is_vice_captain BOOLEAN NOT NULL DEFAULT FALSE,
      is_bench BOOLEAN NOT NULL DEFAULT FALSE,
      PRIMARY KEY (team_id, gameweek, player_id)
    );
    INSERT OR IGNORE INTO my_squad_migrated (team_id, gameweek, player_id, is_captain, is_vice_captain, is_bench)
    SELECT COALESCE(team_id, 1), gameweek, player_id, is_captain, is_vice_captain, is_bench FROM my_squad;
    DROP TABLE my_squad;
    ALTER TABLE my_squad_migrated RENAME TO my_squad;
  `);
}

const PLAYERS_SQL = `
  CREATE TABLE IF NOT EXISTS players (
    id INT PRIMARY KEY,
    web_name TEXT NOT NULL,
    team_id INT NOT NULL,
    position TEXT NOT NULL,
    price DECIMAL NOT NULL,
    status TEXT NOT NULL
  );
`;

const STATS_SQL = `
  CREATE TABLE IF NOT EXISTS player_gameweek_stats (
    player_id INT NOT NULL,
    gameweek INT NOT NULL,
    minutes INT NOT NULL,
    points INT NOT NULL,
    form DECIMAL NOT NULL,
    selected_by_percent DECIMAL NOT NULL,
    price DECIMAL NOT NULL,
    fixture_difficulty INT NOT NULL,
    PRIMARY KEY (player_id, gameweek)
  );
`;

const SQUAD_SQL = `
  CREATE TABLE IF NOT EXISTS my_squad (
    team_id INT NOT NULL DEFAULT 1,
    gameweek INT NOT NULL,
    player_id INT NOT NULL,
    is_captain BOOLEAN NOT NULL DEFAULT FALSE,
    is_vice_captain BOOLEAN NOT NULL DEFAULT FALSE,
    is_bench BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (team_id, gameweek, player_id)
  );
`;

export async function initDb() {
  const connectionString = getConnectionString();
  if (connectionString) {
    try {
      if (isNeonUrl(connectionString)) {
        const sqlClient = neon(connectionString);
        await sqlClient(PLAYERS_SQL);
        await sqlClient(STATS_SQL);
        await sqlClient(SQUAD_SQL);
      } else {
        const pool = getPgPool()!;
        await pool.query(`${PLAYERS_SQL}${STATS_SQL}${SQUAD_SQL}`);
      }
      await migrateMySquadTeamId();
      await execute(
        `CREATE UNIQUE INDEX IF NOT EXISTS my_squad_team_gw_player
         ON my_squad (team_id, gameweek, player_id)`
      );
      return;
    } catch (err) {
      if (!shouldFallbackToSqlite(err)) throw err;
      skipPostgres = true;
      console.warn('Falling back to local SQLite after Postgres init failure.');
    }
  }

  const db = getSqliteDb();
  if (db) {
    db.exec(`${PLAYERS_SQL}${STATS_SQL}${SQUAD_SQL}`);
    await migrateMySquadTeamId();
    await execute(
      `CREATE UNIQUE INDEX IF NOT EXISTS my_squad_team_gw_player
       ON my_squad (team_id, gameweek, player_id)`
    );
    return;
  }

  throw new Error(
    sqliteLoadError
      ? `Could not initialize local SQLite: ${sqliteLoadError}`
      : 'Could not initialize a database connection.'
  );
}
