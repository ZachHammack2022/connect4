"""Online play between two browsers (in-memory game store)."""
import unittest
from fastapi.testclient import TestClient

from backend.app import app
from backend.dependencies import set_game_store
from backend.game_store import MemoryGameStore


class TestOnlinePlay(unittest.TestCase):
    def setUp(self):
        set_game_store(MemoryGameStore())
        self.client = TestClient(app)
        created = self.client.post('/games/online', json={'game_type': 'tictactoe', 'name': 'ann'}).json()
        self.game_id = created['game_id']
        self.ann = created['seat_token']
        self.created = created

    def call(self, method, path, token=None, **kwargs):
        headers = {'X-Seat-Token': token} if token else {}
        return getattr(self.client, method)(f'/games/{self.game_id}{path}', headers=headers, **kwargs)

    def join(self, name='bob', token=None):
        return self.call('post', '/join', token, json={'name': name}).json()

    def test_creator_takes_x_and_waits(self):
        online = self.created['online']
        self.assertEqual(online['you'], 'X')
        self.assertEqual(online['seats']['X'], {'name': 'ann', 'taken': True, 'connected': True})
        self.assertFalse(online['seats']['O']['taken'])
        self.assertEqual((self.created['mode1'], self.created['mode2']), ('human', 'human'))
        self.assertNotIn('token_hash', str(self.created))

    def test_second_visitor_takes_o_and_third_watches(self):
        bob = self.join('bob')
        self.assertEqual(bob['online']['you'], 'O')
        self.assertTrue(bob['seat_token'])
        carl = self.join('carl')
        self.assertIsNone(carl['online']['you'])
        self.assertIsNone(carl['seat_token'])
        self.assertEqual(carl['online']['seats']['O']['name'], 'bob')

    def test_rejoining_keeps_your_seat(self):
        bob = self.join('bob')
        again = self.join('bob', bob['seat_token'])
        self.assertEqual(again['online']['you'], 'O')
        self.assertEqual(again['seat_token'], bob['seat_token'])

    def test_only_the_side_to_move_can_move(self):
        bob = self.join('bob')['seat_token']
        self.assertEqual(self.call('post', '/move', bob, json={'move': 4}).status_code, 403)
        self.assertEqual(self.call('post', '/move', None, json={'move': 4}).status_code, 403)
        self.assertEqual(self.call('post', '/move', 'forged', json={'move': 4}).status_code, 403)
        state = self.call('post', '/move', self.ann, json={'move': 4}).json()
        self.assertEqual(state['board'][4], -1)
        self.assertEqual(self.call('post', '/move', self.ann, json={'move': 0}).status_code, 403)
        state = self.call('post', '/move', bob, json={'move': 0}).json()
        self.assertEqual(state['current_player'], 'X')

    def test_others_see_the_same_board(self):
        self.join('bob')
        self.call('post', '/move', self.ann, json={'move': 4})
        spectator = self.call('get', '').json()
        self.assertEqual(spectator['board'][4], -1)
        self.assertIsNone(spectator['online']['you'])

    def test_rematch_swaps_sides(self):
        bob = self.join('bob')['seat_token']
        self.assertEqual(self.call('post', '/reset', self.ann).status_code, 400)  # not over yet
        for token, move in [(self.ann, 0), (bob, 3), (self.ann, 1), (bob, 4), (self.ann, 2)]:
            self.call('post', '/move', token, json={'move': move})
        self.assertEqual(self.call('post', '/reset', None).status_code, 403)
        state = self.call('post', '/reset', bob).json()
        self.assertFalse(state['done'])
        self.assertEqual(state['online']['you'], 'X')
        self.assertEqual(state['online']['seats']['X']['name'], 'bob')
        self.assertEqual(self.call('post', '/move', bob, json={'move': 4}).status_code, 200)

    def test_local_only_features_are_refused(self):
        self.assertEqual(self.call('post', '/undo', self.ann).status_code, 400)
        self.assertEqual(self.call('post', '/hint', self.ann).status_code, 400)
        self.assertEqual(self.call('post', '/mode', self.ann, json={'player': 2, 'mode': 'minimax'}).status_code, 400)

    def test_cannot_join_a_local_game(self):
        local = self.client.post('/games').json()['game_id']
        self.assertEqual(self.client.post(f'/games/{local}/join', json={'name': 'x'}).status_code, 400)
        state = self.client.get(f'/games/{local}').json()
        self.assertIsNone(state['online'])
