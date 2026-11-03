"""Shared logic for two-player, turn-based board games.

A game subclass defines the board size, which player types it offers, and its
rules (legal moves, applying a move, detecting a win). Everything about whose
turn it is, letting AI players move, and saving/loading a game lives here.

Boards are lists of rows holding ' ', 'X' or 'O'. Observations given to AI
players are the board flattened row by row: 0 empty, -1 X, 1 O.
"""
import random

from backend.game.agents.player import AIPlayer


class TurnBasedGame:
    game_type = ""      # registry key, e.g. "connect4"
    ROWS = 0
    COLS = 0
    player_modes = {}   # mode name -> player class

    def __init__(self, player1='human', player2='human'):
        self.player1 = self.player_modes[player1]()
        self.player2 = self.player_modes[player2]()
        self.reset()

    # ---- rules each game implements ------------------------------------
    def _is_valid_action(self, action):
        raise NotImplementedError

    def _make_move(self, action):
        """Place the current player's piece for `action`."""
        raise NotImplementedError

    def find_winning_cells(self, player):
        """[row, col] cells of `player`'s winning line(s), or [] if none."""
        raise NotImplementedError

    @property
    def num_actions(self):
        raise NotImplementedError

    # ---- shared helpers ------------------------------------------------
    def check_winner(self, player):
        return bool(self.find_winning_cells(player))

    def valid_actions(self):
        return [action for action in range(self.num_actions) if self._is_valid_action(action)]

    def ai_context(self):
        """Extra keyword arguments for AI players' make_move (e.g. whose turn it is)."""
        return {}

    def _is_board_full(self):
        return all(cell != ' ' for row in self.board for cell in row)

    def _get_obs(self):
        values = {' ': 0, 'X': -1, 'O': 1}
        return [values[cell] for row in self.board for cell in row]

    def switch_player(self):
        self.current_player = 'O' if self.current_player == 'X' else 'X'

    def reset(self):
        self.board = [[' ' for _ in range(self.COLS)] for _ in range(self.ROWS)]
        self.current_player = 'X'
        self.terminated = False
        self.winner = None
        self.winning_cells = []
        # The side that had to pass on the last turn (games with passing only).
        self.passed = None
        return self._get_obs()

    def render(self, mode='human', close=False):
        if close:
            return
        for row in self.board:
            print('|' + '|'.join(row) + '|')

    # ---- turns -----------------------------------------------------------
    def step(self, action):
        if self.terminated:
            return self._get_obs(), -10, self.terminated, {"msg": "Game terminated."}
        if not self._is_valid_action(action):
            return self._get_obs(), -2, True, {"msg": "Invalid action."}

        self._make_move(action)

        winning_cells = self.find_winning_cells(self.current_player)
        if winning_cells:
            self.winner = self.current_player
            self.winning_cells = winning_cells
            self.terminated = True
            reward = 100
        else:
            reward = 0.01
            self.terminated = self._is_board_full()
            if not self.terminated:
                self.switch_player()
        return self._get_obs(), reward, self.terminated, {"winner": self.winner}

    async def set_mode(self, player_number, player_mode, difficulty=None):
        if player_mode not in self.player_modes:
            raise ValueError(f"Invalid player type: {player_mode}")
        if player_number not in (1, 2):
            raise ValueError("Invalid player number")

        player = self.player_modes[player_mode](difficulty=difficulty)
        if player_number == 1:
            self.player1 = player
        else:
            self.player2 = player

        # If the newly selected player is an AI whose turn it is, let it move.
        await self.run_ai_turns()

    async def ai_move(self, ai_player):
        legal = self.valid_actions()
        ai_action = await ai_player.make_move(self._get_obs(), legal_moves=legal, **self.ai_context())

        # Never let a misbehaving agent stall or crash the game: fall back to
        # a random legal move if it returns something illegal.
        if ai_action is None or not self._is_valid_action(ai_action):
            ai_action = random.choice(legal)

        return self.step(ai_action)

    def get_ai_player(self):
        """Return the AI whose turn it is, or None if it is a human's turn."""
        player = self.player1 if self.current_player == 'X' else self.player2
        return player if isinstance(player, AIPlayer) else None

    def check_if_ai_move(self):
        return self.get_ai_player() is not None

    async def run_ai_turns(self):
        """Play AI moves until it is a human's turn or the game ends."""
        result = (self._get_obs(), 0, self.terminated, {"winner": self.winner})
        while not self.terminated:
            ai_player = self.get_ai_player()
            if ai_player is None:
                break
            result = await self.ai_move(ai_player)
        return result

    async def play_turn(self, action):
        self.step(action)
        return await self.run_ai_turns()

    async def reset_and_start(self):
        """Reset the board and, if player 1 is an AI, let it make its opening move."""
        self.reset()
        await self.run_ai_turns()
        return self._get_obs()

    # ---- saving and loading ----------------------------------------------
    def to_dict(self):
        """Serialisable snapshot of the game, used to store it in the database."""
        return {
            "game_type": self.game_type,
            "board": self.board,
            "current_player": self.current_player,
            "terminated": self.terminated,
            "winner": self.winner,
            "winning_cells": self.winning_cells,
            "passed": self.passed,
            "players": [
                {"mode": player.name, "difficulty": player.difficulty}
                for player in (self.player1, self.player2)
            ],
        }

    @classmethod
    def from_dict(cls, data):
        players = data["players"]
        game = cls()
        game.player1 = cls.player_modes[players[0]["mode"]](difficulty=players[0]["difficulty"])
        game.player2 = cls.player_modes[players[1]["mode"]](difficulty=players[1]["difficulty"])
        game.board = [list(row) for row in data["board"]]
        game.current_player = data["current_player"]
        game.terminated = data["terminated"]
        game.winner = data["winner"]
        game.winning_cells = data["winning_cells"]
        game.passed = data.get("passed")
        return game
