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

    def leaderboard(self):
        return {row['username']: (row['wins'], row['losses']) for row in self.client.get('/leaderboard/').json()}

    def test_results_accumulate(self):
        for won in (True, True, False):
            self.assertEqual(self.client.post('/submit_game/', json={'username': 'ann', 'won': won}).status_code, 200)
        self.assertEqual(self.leaderboard(), {'ann': (2, 1)})

    def test_concurrent_submissions_create_one_row(self):
        submit = lambda i: self.client.post('/submit_game/', json={'username': 'race', 'won': i % 2 == 0})
        with ThreadPoolExecutor(8) as pool:
            list(pool.map(submit, range(20)))
        self.assertEqual(self.leaderboard(), {'race': (10, 10)})

    def test_empty_username_rejected(self):
        self.assertEqual(self.client.post('/submit_game/', json={'username': '', 'won': True}).status_code, 422)

    def test_startup_merges_duplicate_rows(self):
        from backend.db import ensure_schema
        self.db_call(self.db.execute, "DROP INDEX games_username_key")
        self.db_call(self.db.execute, "INSERT INTO games (username, wins, losses) VALUES ('dup', 1, 0), ('dup', 2, 3)")
        self.db_call(ensure_schema, self.db)
        self.assertEqual(self.leaderboard(), {'dup': (3, 3)})


if __name__ == '__main__':
    unittest.main()
