"""API tests for per-user games using the in-memory game store. They don't
touch the database: the TestClient is used without its context manager, so
startup doesn't run. Postgres-backed games are tested in test_postgres_games."""
import asyncio
import unittest
from fastapi.testclient import TestClient

from backend.app import app
from backend.dependencies import set_game_store
from backend.game_store import GameNotFound, MemoryGameStore


class TestGameApi(unittest.TestCase):
    def setUp(self):
        set_game_store(MemoryGameStore())
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

    def test_difficulty_and_winning_cells_in_state(self):
        game_id = self.new_game()['game_id']
        state = self.client.post(f'/games/{game_id}/mode', json={'player': 2, 'mode': 'minimax', 'difficulty': 'easy'}).json()
        self.assertEqual((state['difficulty1'], state['difficulty2']), (None, 'easy'))
        self.assertEqual(state['winning_cells'], [])
        bad = self.client.post(f'/games/{game_id}/mode', json={'player': 2, 'mode': 'minimax', 'difficulty': 'max'})
        self.assertEqual(bad.status_code, 422)

    def test_tictactoe_game(self):
        state = self.client.post('/games', json={'game_type': 'tictactoe'}).json()
        self.assertEqual((state['game_type'], state['rows'], state['cols']), ('tictactoe', 3, 3))
        self.assertEqual(state['modes'], ['human', 'random', 'minimax'])
        game_id = state['game_id']
        self.client.post(f'/games/{game_id}/mode', json={'player': 2, 'mode': 'minimax', 'difficulty': 'hard'})
        state = self.client.post(f'/games/{game_id}/move', json={'move': 4}).json()
        self.assertEqual(sum(cell != 0 for cell in state['board']), 2)
        self.assertEqual(state['board'][4], -1)
        self.assertEqual(self.client.post(f'/games/{game_id}/move', json={'move': 4}).status_code, 400)
        self.assertEqual(self.client.post(f'/games/{game_id}/mode', json={'player': 2, 'mode': 'mcts'}).status_code, 400)

    def test_reversi_game(self):
        state = self.client.post('/games', json={'game_type': 'reversi'}).json()
        self.assertEqual((state['game_type'], state['rows'], state['cols']), ('reversi', 8, 8))
        self.assertEqual(sorted(state['legal_moves']), [19, 26, 37, 44])
        self.assertIsNone(state['passed'])
        game_id = state['game_id']
        self.assertEqual(self.client.post(f'/games/{game_id}/move', json={'move': 0}).status_code, 400)
        self.client.post(f'/games/{game_id}/mode', json={'player': 2, 'mode': 'minimax', 'difficulty': 'easy'})
        state = self.client.post(f'/games/{game_id}/move', json={'move': 19}).json()
        # Dark's move and the AI's reply: two new discs.
        self.assertEqual(sum(cell != 0 for cell in state['board']), 6)
        self.assertEqual(state['current_player'], 'X')
        self.assertTrue(state['legal_moves'])

    def test_undo_and_history(self):
        game_id = self.new_game()['game_id']
        self.assertEqual(self.client.post(f'/games/{game_id}/undo').status_code, 400)
        self.client.post(f'/games/{game_id}/mode', json={'player': 2, 'mode': 'random'})
        state = self.client.post(f'/games/{game_id}/move', json={'move': 3}).json()
        self.assertEqual(len(state['history']), 2)
        self.assertEqual(state['history'][0], {'player': 'X', 'move': 3, 'cell': [5, 3]})
        self.assertFalse(state['assisted'])
        state = self.client.post(f'/games/{game_id}/undo').json()
        self.assertEqual(state['history'], [])
        self.assertTrue(state['assisted'])
        self.assertEqual(state['current_player'], 'X')

    def test_default_game_is_connect4(self):
        state = self.client.post('/games').json()
        self.assertEqual((state['game_type'], state['rows'], state['cols']), ('connect4', 6, 7))

    def test_invalid_requests(self):
        game_id = self.new_game()['game_id']
        self.assertEqual(self.client.post(f'/games/{game_id}/move', json={'column': -1}).status_code, 422)
        self.assertEqual(self.client.post(f'/games/{game_id}/move', json={'column': 7}).status_code, 400)
        self.assertEqual(self.client.post('/games', json={'game_type': 'chess'}).status_code, 422)
        self.assertEqual(self.client.post(f'/games/{game_id}/mode', json={'player': 1, 'mode': 'bogus'}).status_code, 400)

    def test_reset_with_ai_first(self):
        game_id = self.new_game()['game_id']
        self.client.post(f'/games/{game_id}/mode', json={'player': 1, 'mode': 'random'})
        state = self.client.post(f'/games/{game_id}/reset').json()
        self.assertEqual(state['current_player'], 'O')
        self.assertEqual(sum(cell != 0 for cell in state['board']), 1)


class TestMemoryGameStore(unittest.IsolatedAsyncioTestCase):
    async def assert_missing(self, store, game_id):
        with self.assertRaises(GameNotFound):
            async with store.open(game_id):
                pass

    async def test_idle_games_expire(self):
        store = MemoryGameStore(idle_timeout=0)
        game_id, _ = await store.create()
        await self.assert_missing(store, game_id)

    async def test_size_cap_evicts_least_recently_used(self):
        store = MemoryGameStore(max_games=2)
        first, _ = await store.create()
        second, _ = await store.create()
        async with store.open(first):  # first is now the most recently used
            pass
        await store.create()           # evicts second
        async with store.open(first):
            pass
        await self.assert_missing(store, second)
        self.assertEqual(len(store), 2)


if __name__ == '__main__':
    unittest.main()
