"""Gomoku helpers on a flat 15x15 board of ints: 0 empty, -1 X (black), 1 O (white).

Freestyle rules: five or more in a row wins.
"""
SIZE = 15
DIRECTIONS = [(0, 1), (1, 0), (1, 1), (1, -1)]


def winning_line(cells, player):
    """Cells (as [row, col]) of every run of 5+ for `player`, or []."""
    found = []
    for r in range(SIZE):
        for c in range(SIZE):
            if cells[r * SIZE + c] != player:
                continue
            for dr, dc in DIRECTIONS:
                # Only start counting at the beginning of a run.
                pr, pc = r - dr, c - dc
                if 0 <= pr < SIZE and 0 <= pc < SIZE and cells[pr * SIZE + pc] == player:
                    continue
                run = []
                rr, cc = r, c
                while 0 <= rr < SIZE and 0 <= cc < SIZE and cells[rr * SIZE + cc] == player:
                    run.append([rr, cc])
                    rr, cc = rr + dr, cc + dc
                if len(run) >= 5:
                    found.extend(cell for cell in run if cell not in found)
    return found


def windows_through(index):
    """Every line of 5 cells (as index lists) that contains `index`."""
    r, c = divmod(index, SIZE)
    result = []
    for dr, dc in DIRECTIONS:
        for offset in range(5):
            sr, sc = r - dr * offset, c - dc * offset
            # (sr, sc) is where the window starts
            er, ec = sr + dr * 4, sc + dc * 4
            if 0 <= sr < SIZE and 0 <= sc < SIZE and 0 <= er < SIZE and 0 <= ec < SIZE:
                result.append([(sr + dr * k) * SIZE + (sc + dc * k) for k in range(5)])
    return result
