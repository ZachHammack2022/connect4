// Props every game board receives from the game page.
export interface BoardProps {
    board: number[];                  // flat, row-major: 0 empty, -1 X, 1 O
    rows: number;
    cols: number;
    currentPlayer: 'X' | 'O';
    winningCells: [number, number][];
    legalMoves: number[];
    // Where the most recent piece went, to mark it.
    lastCell: [number, number] | null;
    // A suggested move to highlight, if the player asked for a hint.
    hintCell?: [number, number] | null;
    // True when a human may move now; boards show previews/pointer only then.
    interactive: boolean;
    onMove: (move: number) => void;
}

export const toRows = (board: number[], rows: number, cols: number): number[][] =>
    Array.from({ length: rows }, (_, r) => board.slice(r * cols, (r + 1) * cols));

export const isWinningCell = (cells: [number, number][], row: number, col: number) =>
    cells.some(([r, c]) => r === row && c === col);

// Enter/Space activate a focused cell, like a click.
export const activateOnKey = (event: React.KeyboardEvent, action: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        action();
    }
};

export const isLastCell = (lastCell: [number, number] | null, row: number, col: number) =>
    !!lastCell && lastCell[0] === row && lastCell[1] === col;
