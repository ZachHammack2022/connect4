"""All playable game types, keyed by the id used in the API and the database."""
from backend.game.game import Connect4Env
from backend.game.tictactoe import TicTacToeEnv

GAME_TYPES = {
    Connect4Env.game_type: Connect4Env,
    TicTacToeEnv.game_type: TicTacToeEnv,
}
DEFAULT_GAME_TYPE = Connect4Env.game_type


def game_from_dict(data):
    # Games saved before multiple game types existed are all Connect 4.
    return GAME_TYPES[data.get("game_type", DEFAULT_GAME_TYPE)].from_dict(data)
