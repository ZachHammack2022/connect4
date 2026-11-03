from databases import Database

# Idempotent schema setup, run on every startup. It also upgrades databases
# created before usernames were unique by merging duplicate rows first.
SCHEMA_STATEMENTS = [
    """
    CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        wins INT NOT NULL DEFAULT 0,
        losses INT NOT NULL DEFAULT 0
    )
    """,
    """
    WITH totals AS (
        SELECT MIN(id) AS keep_id, username, SUM(wins) AS wins, SUM(losses) AS losses
        FROM games GROUP BY username HAVING COUNT(*) > 1
    )
    UPDATE games g SET wins = t.wins, losses = t.losses
    FROM totals t WHERE g.id = t.keep_id
    """,
    """
    DELETE FROM games g USING games other
    WHERE g.username = other.username AND g.id > other.id
    """,
    "CREATE UNIQUE INDEX IF NOT EXISTS games_username_key ON games (username)",
]


async def ensure_schema(database: Database) -> None:
    async with database.transaction():
        for statement in SCHEMA_STATEMENTS:
            await database.execute(statement)
