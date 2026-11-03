"""Tests for games stored in Postgres. Run only when TEST_DATABASE_URL is set
(see test_leaderboard.py); they empty the game_sessions table."""
import os
import unittest
from concurrent.futures import ThreadPoolExecutor

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")
if TEST_DATABASE_URL:
    os.environ["DATABASE_URL"] = TEST_DATABASE_URL


@unittest.skipUnless(TEST_DATABASE_URL, "set TEST_DATABASE_URL to run database tests")
class TestPostgresGames(unittest.TestCase):
    def setUp(self):
        from fastapi.testclient import TestClient
        from backend.app import app
        from backend.dependencies import get_database, set_game_store
        from backend.game_store import PostgresGameStore
        self.db = get_database()
        set_game_store(PostgresGameStore(self.db))
        self.app = app
        self.client = self.start_client()
        self.db_call(self.db.execute, "DELETE FROM game_sessions")

    def tearDown(self):
        self.client.__exit__(None, None, None)

    def start_client(self):
        from fastapi.testclient import TestClient
        client = TestClient(self.app)
        client.__enter__()  # runs startup: connect + schema setup
        return client

    def db_call(self, async_fn, *args):
        return self.client.portal.call(async_fn, *args)

    def new_game(self):
        return self.client.post('/games').json()['game_id']

    def test_game_survives_restart(self):
        game_id = self.new_game()
        self.client.post(f'/games/{game_id}/mode', json={'player': 2, 'mode': 'minimax', 'difficulty': 'easy'})
        before = self.client.post(f'/games/{game_id}/move', json={'column': 3}).json()
        self.assertEqual(sum(cell != 0 for cell in before['board']), 2)

        # Simulate a restart: shut the app down and start it again.
        self.client.__exit__(None, None, None)
        self.client = self.start_client()
        after = self.client.get(f'/games/{game_id}').json()
        self.assertEqual(after, before)
        self.assertEqual((after['mode2'], after['difficulty2']), ('minimax', 'easy'))

    def test_play_to_a_win_and_reset(self):
        game_id = self.new_game()
        for column in [0, 1, 0, 1, 0, 1]:
            self.client.post(f'/games/{game_id}/move', json={'column': column})
        state = self.client.post(f'/games/{game_id}/move', json={'column': 0}).json()
        self.assertEqual((state['done'], state['winner']), (True, 'X'))
        self.assertEqual(len(state['winning_cells']), 4)
        self.assertEqual(self.client.post(f'/games/{game_id}/move', json={'column': 2}).status_code, 400)
        state = self.client.post(f'/games/{game_id}/reset').json()
        self.assertEqual((state['done'], sum(cell != 0 for cell in state['board'])), (False, 0))

    def test_concurrent_moves_are_serialised(self):
        # Fire many moves at one human-vs-human game at once. Each must see the
        # result of the previous one, so exactly one disc lands per request.
        game_id = self.new_game()
        move = lambda i: self.client.post(f'/games/{game_id}/move', json={'column': i % 7}).status_code
        with ThreadPoolExecutor(8) as pool:
            statuses = list(pool.map(move, range(12)))
        board = self.client.get(f'/games/{game_id}').json()['board']
        self.assertEqual(sum(cell != 0 for cell in board), statuses.count(200))
        self.assertEqual(statuses.count(200), 12)

    def test_failed_request_does_not_save(self):
        game_id = self.new_game()
        self.client.post(f'/games/{game_id}/mode', json={'player': 2, 'mode': 'random'})
        response = self.client.post(f'/games/{game_id}/mode', json={'player': 3, 'mode': 'random'})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(self.client.get(f'/games/{game_id}').json()['mode2'], 'random')

    def test_unknown_and_expired_games(self):
        self.assertEqual(self.client.get('/games/nope').status_code, 404)
        old = self.new_game()
        self.db_call(self.db.execute, "UPDATE game_sessions SET updated_at = now() - interval '2 days'")
        self.new_game()  # creating a game cleans up old ones
        self.assertEqual(self.client.get(f'/games/{old}').status_code, 404)


if __name__ == '__main__':
    unittest.main()
