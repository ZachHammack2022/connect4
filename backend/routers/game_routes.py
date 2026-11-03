from contextlib import asynccontextmanager

from fastapi import APIRouter, Header, HTTPException
from typing import Optional

from backend import online
from backend.types.game_types import Move, NewGame, NewOnlineGame, JoinGame
from backend.types.api_types import ModeChangeInput
from backend.dependencies import get_game_store
from backend.game_store import GameNotFound
from backend.game.base import TurnBasedGame

router = APIRouter(prefix="/games")


# Header carrying an online player's seat token.
SeatToken = Optional[str]


def game_state(game_id: str, game: TurnBasedGame, viewer: Optional[str] = None):
    return {
        "game_id": game_id,
        "game_type": game.game_type,
        "rows": game.ROWS,
        "cols": game.COLS,
        "modes": list(game.player_modes),
        "board": game._get_obs(),
        "done": game.terminated,
        "winner": game.winner,
        "current_player": game.current_player,
        "mode1": game.player1.name,
        "mode2": game.player2.name,
        "difficulty1": game.player1.difficulty,
        "difficulty2": game.player2.difficulty,
        "winning_cells": game.winning_cells,
        # Moves the side to move may play (empty once the game is over).
        "legal_moves": [] if game.terminated else game.valid_actions(),
        "passed": game.passed,
        "history": [{"player": m["player"], "move": m["move"], "cell": m["cell"]} for m in game.history],
        "assisted": game.assisted,
        # Online games: seat names and presence, and which seat (if any) is yours.
        "online": online.public_view(game, viewer) if game.online else None,
    }


def refuse_online(game: TurnBasedGame, what: str):
    if game.online:
        raise HTTPException(status_code=400, detail=f"{what} isn't available in online games.")


@asynccontextmanager
async def open_game(game_id: str):
    """Exclusive access to a game for the rest of the request; 404 if unknown."""
    try:
        async with get_game_store().open(game_id) as game:
            yield game
    except GameNotFound:
        raise HTTPException(status_code=404, detail="Game not found. It may have expired; start a new game.")


@router.post("")
async def create_game(new_game: Optional[NewGame] = None):
    game_type = (new_game or NewGame()).game_type
    game_id, game = await get_game_store().create(game_type)
    return game_state(game_id, game)


@router.post("/online")
async def create_online_game(new_game: NewOnlineGame):
    """Start a game to play with a friend on another device. The creator gets
    seat X and a token; share the game id so the friend can join."""
    game_id, _ = await get_game_store().create(new_game.game_type)
    async with open_game(game_id) as game:
        token = online.make_online(game, new_game.name)
        return {**game_state(game_id, game, "X"), "seat_token": token}


@router.post("/{game_id}/join")
async def join_game(game_id: str, join: JoinGame, x_seat_token: SeatToken = Header(None)):
    """Take the free seat of an online game (or get yours back); once both
    seats are taken, visitors watch."""
    async with open_game(game_id) as game:
        if not game.online:
            raise HTTPException(status_code=400, detail="This isn't an online game.")
        side, token = online.join(game, join.name, x_seat_token)
        return {**game_state(game_id, game, side), "seat_token": token}


@router.get("/{game_id}")
async def get_state(game_id: str, x_seat_token: SeatToken = Header(None)):
    async with open_game(game_id) as game:
        side = online.seat_for(game, x_seat_token)
        online.touch(game, side)  # polling keeps a player shown as connected
        return game_state(game_id, game, side)


@router.post("/{game_id}/move")
async def make_move(game_id: str, move: Move, x_seat_token: SeatToken = Header(None)):
    async with open_game(game_id) as game:
        side = online.seat_for(game, x_seat_token)
        if game.online:
            if side is None:
                raise HTTPException(status_code=403, detail="You're watching this game.")
            if side != game.current_player and not game.terminated:
                raise HTTPException(status_code=403, detail="It's your opponent's turn.")
            online.touch(game, side)
        if game.terminated:
            raise HTTPException(status_code=400, detail="The game is over. Reset the game to play again.")
        if game.check_if_ai_move():
            raise HTTPException(status_code=400, detail="It is not a human player's turn.")
        if not game._is_valid_action(move.move):
            raise HTTPException(status_code=400, detail="Invalid move.")
        await game.play_turn(move.move)
        return game_state(game_id, game, side)


@router.post("/{game_id}/reset")
async def reset_game(game_id: str, x_seat_token: SeatToken = Header(None)):
    async with open_game(game_id) as game:
        side = online.seat_for(game, x_seat_token)
        if game.online:
            # A rematch: either player can start one once the game is over;
            # the players swap sides so the other one moves first.
            if side is None:
                raise HTTPException(status_code=403, detail="You're watching this game.")
            if not game.terminated:
                raise HTTPException(status_code=400, detail="Finish the game before starting a rematch.")
            online.rematch(game)
            side = 'O' if side == 'X' else 'X'
        await game.reset_and_start()
        return game_state(game_id, game, side)


@router.post("/{game_id}/undo")
async def undo_move(game_id: str):
    async with open_game(game_id) as game:
        refuse_online(game, "Undo")
        if game.terminated:
            raise HTTPException(status_code=400, detail="The game is over. Start a new game to play again.")
        if not game.undo():
            raise HTTPException(status_code=400, detail="There is no move of yours to undo.")
        # If it is now an AI's turn (players were changed mid-game), let it move.
        await game.run_ai_turns()
        return game_state(game_id, game)


@router.post("/{game_id}/hint")
async def hint(game_id: str):
    async with open_game(game_id) as game:
        refuse_online(game, "Hints")
        if game.terminated:
            raise HTTPException(status_code=400, detail="The game is over.")
        if game.check_if_ai_move():
            raise HTTPException(status_code=400, detail="It is not a human player's turn.")
        move = await game.hint()
        return {**game_state(game_id, game), "hint": move}


@router.post("/{game_id}/mode")
async def set_mode(game_id: str, mode_change_input: ModeChangeInput):
    async with open_game(game_id) as game:
        refuse_online(game, "Changing players")
        try:
            await game.set_mode(mode_change_input.player, mode_change_input.mode, mode_change_input.difficulty)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        return game_state(game_id, game)
