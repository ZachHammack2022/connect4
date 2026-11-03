"""Pure Reversi rules on a flat 8x8 board of ints: 0 empty, -1 X (dark), 1 O (light).

Shared by the game environment and the AI so both agree on what is legal.
"""
SIZE = 8
DIRECTIONS = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]


def start_cells():
    cells = [0] * (SIZE * SIZE)
    # Standard opening: light on the main diagonal of the centre, dark on the other.
    cells[3 * SIZE + 3] = cells[4 * SIZE + 4] = 1
    cells[3 * SIZE + 4] = cells[4 * SIZE + 3] = -1
    return cells


def flips(cells, index, player):
    """Indices of the opponent's discs that playing `index` would flip."""
    if cells[index] != 0:
        return []
    row, col = divmod(index, SIZE)
    flipped = []
    for dr, dc in DIRECTIONS:
        line = []
        r, c = row + dr, col + dc
        while 0 <= r < SIZE and 0 <= c < SIZE and cells[r * SIZE + c] == -player:
            line.append(r * SIZE + c)
            r, c = r + dr, c + dc
        if line and 0 <= r < SIZE and 0 <= c < SIZE and cells[r * SIZE + c] == player:
            flipped.extend(line)
    return flipped


def legal_moves(cells, player):
    return [i for i in range(SIZE * SIZE) if cells[i] == 0 and flips(cells, i, player)]


def play(cells, index, player):
    """A new board with `player`'s disc at `index` and the flips applied.
    Raises ValueError for an illegal move."""
    flipped = flips(cells, index, player)
    if not flipped:
        raise ValueError("Illegal move")
    result = list(cells)
    result[index] = player
    for i in flipped:
        result[i] = player
    return result
