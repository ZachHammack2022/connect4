"""Online play: two people on different devices share one game.

An online game has two seats, X and O. Whoever creates the game takes X; the
first person to open the invite link takes O; anyone after that watches.
Claiming a seat returns a random token, which the browser sends back with
every request (X-Seat-Token header). Only a hash of it is stored, and only
the token for the side to move can make a move.
"""
import hashlib
import secrets
import time

# A seat counts as connected if its player polled within this many seconds.
PRESENCE_SECONDS = 6
SIDES = ("X", "O")


def _hash(token):
    return hashlib.sha256(token.encode()).hexdigest()


def _empty_seat():
    return {"name": None, "token_hash": None, "last_seen": 0.0}


def make_online(game, creator_name):
    """Turn a fresh game into an online one with the creator in seat X."""
    game.player1 = game.player_modes['human']()
    game.player2 = game.player_modes['human']()
    game.online = {"seats": {side: _empty_seat() for side in SIDES}}
    return _claim(game, "X", creator_name)


def _claim(game, side, name):
    token = secrets.token_urlsafe(18)
    game.online["seats"][side] = {"name": name, "token_hash": _hash(token), "last_seen": time.time()}
    return token


def seat_for(game, token):
    """The side this token holds, or None (a spectator or a stranger)."""
    if not game.online or not token:
        return None
    hashed = _hash(token)
    for side in SIDES:
        if secrets.compare_digest(game.online["seats"][side]["token_hash"] or "", hashed):
            return side
    return None


def join(game, name, token=None):
    """Take a free seat. Returns (side, token); (None, None) for spectators.
    A player who already holds a seat gets it back."""
    side = seat_for(game, token)
    if side:
        touch(game, side)
        return side, token
    for side in SIDES:
        if game.online["seats"][side]["token_hash"] is None:
            return side, _claim(game, side, name)
    return None, None


def touch(game, side):
    if side:
        game.online["seats"][side]["last_seen"] = time.time()


def rematch(game):
    """Swap seats so the other player moves first, then start again."""
    seats = game.online["seats"]
    seats["X"], seats["O"] = seats["O"], seats["X"]


def public_view(game, viewer):
    """What clients see: names and presence, never token hashes."""
    now = time.time()
    return {
        "seats": {
            side: {
                "name": seat["name"],
                "taken": seat["token_hash"] is not None,
                "connected": seat["token_hash"] is not None and now - seat["last_seen"] < PRESENCE_SECONDS,
            }
            for side, seat in game.online["seats"].items()
        },
        "you": viewer,
    }
