from databases import Database

# Idempotent schema setup, run on every startup. It also upgrades older
# databases: duplicate rows are merged, and the per-game `game_type` and
# `draws` columns are added (existing rows count as Connect 4).
SCHEMA_STATEMENTS = [
    """
    CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        wins INT NOT NULL DEFAULT 0,
        losses INT NOT NULL DEFAULT 0
    )
    """,
    "ALTER TABLE games ADD COLUMN IF NOT EXISTS game_type VARCHAR(50) NOT NULL DEFAULT 'connect4'",
    "ALTER TABLE games ADD COLUMN IF NOT EXISTS draws INT NOT NULL DEFAULT 0",
    """
    WITH totals AS (
        SELECT MIN(id) AS keep_id, SUM(wins) AS wins, SUM(losses) AS losses, SUM(draws) AS draws
        FROM games GROUP BY username, game_type HAVING COUNT(*) > 1
    )
    UPDATE games g SET wins = t.wins, losses = t.losses, draws = t.draws
    FROM totals t WHERE g.id = t.keep_id
    """,
    """
    DELETE FROM games g USING games other
    WHERE g.username = other.username AND g.game_type = other.game_type AND g.id > other.id
    """,
    # Usernames used to be unique across all games; now per game type.
    "ALTER TABLE games DROP CONSTRAINT IF EXISTS games_username_key",
    "DROP INDEX IF EXISTS games_username_key",
    "CREATE UNIQUE INDEX IF NOT EXISTS games_username_game_type_key ON games (username, game_type)",
    # Win streaks per player and game.
    "ALTER TABLE games ADD COLUMN IF NOT EXISTS current_streak INT NOT NULL DEFAULT 0",
    "ALTER TABLE games ADD COLUMN IF NOT EXISTS best_streak INT NOT NULL DEFAULT 0",
    # Every result with the AI it was against, for per-opponent leaderboards.
    """
    CREATE TABLE IF NOT EXISTS game_results (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        game_type VARCHAR(50) NOT NULL,
        opponent VARCHAR(50) NOT NULL,
        difficulty VARCHAR(10),
        outcome VARCHAR(4) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
    """,
    "CREATE INDEX IF NOT EXISTS game_results_game_opponent ON game_results (game_type, opponent, difficulty)",
]


async def ensure_schema(database: Database) -> None:
    async with database.transaction():
        for statement in SCHEMA_STATEMENTS:
            await database.execute(statement)
