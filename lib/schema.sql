-- Database Schema for FPL Weekly Analyser

CREATE TABLE IF NOT EXISTS players (
  id INT PRIMARY KEY,
  web_name TEXT NOT NULL,
  team_id INT NOT NULL,
  position TEXT NOT NULL, -- GK / DEF / MID / FWD
  price DECIMAL NOT NULL,
  status TEXT NOT NULL -- available / injured / doubtful / suspended
);

CREATE TABLE IF NOT EXISTS player_gameweek_stats (
  player_id INT NOT NULL,
  gameweek INT NOT NULL,
  minutes INT NOT NULL,
  points INT NOT NULL,
  form DECIMAL NOT NULL,
  selected_by_percent DECIMAL NOT NULL,
  price DECIMAL NOT NULL,
  fixture_difficulty INT NOT NULL, -- avg FDR of next 4 fixtures at time of snapshot
  PRIMARY KEY (player_id, gameweek)
);

CREATE TABLE IF NOT EXISTS my_squad (
  team_id INT NOT NULL DEFAULT 1,
  gameweek INT NOT NULL,
  player_id INT NOT NULL,
  is_captain BOOLEAN NOT NULL DEFAULT FALSE,
  is_vice_captain BOOLEAN NOT NULL DEFAULT FALSE,
  is_bench BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (team_id, gameweek, player_id)
);
