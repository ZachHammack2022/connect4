"""API tests for per-user games. They don't touch the database: the
TestClient is used without its context manager, so startup doesn't run."""
import unittest
from fastapi.testclient import TestClient

from backend.app import app
from backend.game_store import GameStore


class TestGameApi(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def new_game(self):
        response = self.client.post('/games')
        self.assertEqual(response.status_code, 200)
        return response.json()

    def test_games_are_independent(self):
        a, b = self.new_game(), self.new_game()
        self.assertNotEqual(a['game_id'], b['game_id'])
        self.client.post(f"/games/{a['game_id']}/move", json={'column': 3})
        state_a = self.client.get(f"/games/{a['game_id']}").json()
        state_b = self.client.get(f"/games/{b['game_id']}").json()
        self.assertEqual(sum(cell != 0 for cell in state_a['board']), 1)
        self.assertEqual(sum(cell != 0 for cell in state_b['board']), 0)

    def test_unknown_game_is_404(self):
        self.assertEqual(self.client.get('/games/nope').status_code, 404)
        self.assertEqual(self.client.post('/games/nope/move', json={'column': 0}).status_code, 404)

    def test_mode_is_reported_and_ai_replies(self):
        game_id = self.new_game()['game_id']
        state = self.client.post(f'/games/{game_id}/mode', json={'player': 2, 'mode': 'minimax'}).json()
        self.assertEqual((state['mode1'], state['mode2']), ('human', 'minimax'))
        state = self.client.post(f'/games/{game_id}/move', json={'column': 3}).json()
        self.assertEqual(state['current_player'], 'X')
        self.assertEqual(sum(cell != 0 for cell in state['board']), 2)

    def test_invalid_requests(self):
        game_id = self.new_game()['game_id']
        self.assertEqual(self.client.post(f'/games/{game_id}/move', json={'column': -1}).status_code, 422)
        self.assertEqual(self.client.post(f'/games/{game_id}/move', json={'column': 7}).status_code, 422)
        self.assertEqual(self.client.post(f'/games/{game_id}/mode', json={'player': 1, 'mode': 'bogus'}).status_code, 400)

    def test_reset_with_ai_first(self):
        game_id = self.new_game()['game_id']
        self.client.post(f'/games/{game_id}/mode', json={'player': 1, 'mode': 'random'})
        state = self.client.post(f'/games/{game_id}/reset').json()
        self.assertEqual(state['current_player'], 'O')
        self.assertEqual(sum(cell != 0 for cell in state['board']), 1)


class TestGameStore(unittest.TestCase):
    def test_idle_games_expire(self):
        store = GameStore(idle_timeout=0)
        game_id, _ = store.create()
        with self.assertRaises(KeyError):
            store.get(game_id)

    def test_size_cap_evicts_least_recently_used(self):
        store = GameStore(max_games=2)
        first, _ = store.create()
        second, _ = store.create()
        store.get(first)          # first is now the most recently used
        store.create()            # evicts second
        store.get(first)
        with self.assertRaises(KeyError):
            store.get(second)
        self.assertEqual(len(store), 2)


if __name__ == '__main__':
    unittest.main()
