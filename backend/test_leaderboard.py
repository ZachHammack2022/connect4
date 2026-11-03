"""Leaderboard tests against a real Postgres database.

These run only when TEST_DATABASE_URL is set, e.g.
    TEST_DATABASE_URL=postgresql://user:password@localhost:5432/mydatabase \
        python -m unittest backend.test_leaderboard
WARNING: they empty the `games` table of that database.
"""
import os
import unittest
from concurrent.futures import ThreadPoolExecutor

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")
if TEST_DATABASE_URL:
    os.environ["DATABASE_URL"] = TEST_DATABASE_URL


@unittest.skipUnless(TEST_DATABASE_URL, "set TEST_DATABASE_URL to run database tests")
class TestLeaderboard(unittest.TestCase):
    def setUp(self):
        from fastapi.testclient import TestClient
        from backend.app import app
        self.client = TestClient(app)
        self.client.__enter__()  # runs startup: connect + schema setup
        from backend.dependencies import get_database
        self.db = get_database()
        self.db_call(self.db.execute, "DELETE FROM games")

    def tearDown(self):
        self.client.__exit__(None, None, None)

    def db_call(self, async_fn, *args):
        # Run on the TestClient's event loop, where the database connection lives.
        return self.client.portal.call(async_fn, *args)

    def leaderboard(self, game_type='connect4'):
        rows = self.client.get('/leaderboard/', params={'game_type': game_type}).json()
        return {row['username']: (row['wins'], row['losses'], row['draws']) for row in rows}

    def submit(self, username, outcome, game_type='connect4'):
        return self.client.post('/submit_game/', json={'username': username, 'outcome': outcome, 'game_type': game_type})

    def test_results_accumulate(self):
        for outcome in ('win', 'win', 'loss', 'draw'):
            self.assertEqual(self.submit('ann', outcome).status_code, 200)
        self.assertEqual(self.leaderboard(), {'ann': (2, 1, 1)})

    def test_leaderboards_are_per_game(self):
        self.submit('ann', 'win', 'connect4')
        self.submit('ann', 'draw', 'tictactoe')
        self.submit('bob', 'loss', 'tictactoe')
        self.assertEqual(self.leaderboard('connect4'), {'ann': (1, 0, 0)})
        self.assertEqual(self.leaderboard('tictactoe'), {'ann': (0, 0, 1), 'bob': (0, 1, 0)})
        self.assertEqual(self.submit('ann', 'win', 'chess').status_code, 422)
        self.assertEqual(self.client.get('/leaderboard/', params={'game_type': 'chess'}).status_code, 400)

    def test_concurrent_submissions_create_one_row(self):
        submit = lambda i: self.submit('race', 'win' if i % 2 == 0 else 'loss')
        with ThreadPoolExecutor(8) as pool:
            list(pool.map(submit, range(20)))
        self.assertEqual(self.leaderboard(), {'race': (10, 10, 0)})

    def test_empty_username_rejected(self):
        self.assertEqual(self.submit('', 'win').status_code, 422)
        self.assertEqual(self.submit('ann', 'victory').status_code, 422)

    def test_startup_merges_duplicate_rows(self):
        from backend.db import ensure_schema
        self.db_call(self.db.execute, "DROP INDEX games_username_game_type_key")
        self.db_call(self.db.execute, "INSERT INTO games (username, wins, losses) VALUES ('dup', 1, 0), ('dup', 2, 3)")
        self.db_call(ensure_schema, self.db)
        self.assertEqual(self.leaderboard(), {'dup': (3, 3, 0)})

    def test_upgrade_from_original_schema(self):
        # The original table: no game_type/draws, and a UNIQUE username constraint.
        from backend.db import ensure_schema
        self.db_call(self.db.execute, "DROP TABLE games")
        self.db_call(self.db.execute, """CREATE TABLE games (id SERIAL PRIMARY KEY,
            username VARCHAR(255) NOT NULL UNIQUE, wins INT DEFAULT 0, losses INT DEFAULT 0)""")
        self.db_call(self.db.execute, "INSERT INTO games (username, wins, losses) VALUES ('old', 5, 2)")
        self.db_call(ensure_schema, self.db)
        self.db_call(ensure_schema, self.db)  # idempotent
        self.assertEqual(self.leaderboard('connect4'), {'old': (5, 2, 0)})
        self.submit('old', 'win', 'tictactoe')  # same name, different game: allowed now
        self.assertEqual(self.leaderboard('tictactoe'), {'old': (1, 0, 0)})


if __name__ == '__main__':
    unittest.main()
