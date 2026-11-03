// The game catalog: everything the frontend needs to know about each game.
// To add a game: implement it in the backend (backend/game/registry.py), add a
// board component, and add an entry here.

export type Side = 'X' | 'O';

export interface ModeOption {
    mode: string;
    label: string;
}

export interface AvailableGame {
    id: string;              // matches the backend game_type
    name: string;
    path: string;
    tagline: string;
    status: 'available';
    // Card/hero tint and the colour of each side's pieces.
    tint: string;
    sideColors: Record<Side, string>;
    // Highlight colour for each side's seat when the piece colour won't show
    // up as a border (e.g. black and white discs). Defaults to sideColors.
    accentColors?: Record<Side, string>;
    modes: ModeOption[];
    // Modes that have an easy/medium/hard setting.
    difficultyModes: string[];
    // How each side is named on screen, e.g. "Red" in Connect 4.
    sideLabels: Record<Side, string>;
    // The board after `piece` (-1 X, 1 O) plays `move`, used to show the
    // human's move instantly; null if the move isn't possible.
    applyMove: (board: number[], move: number, cols: number, piece: number) => number[] | null;
    // Move list notation: squares are named file letter + rank; Connect 4
    // counts ranks from the bottom, the others from the top.
    rankFromBottom?: boolean;
    // Pieces each side has on the board, for games scored by count.
    score?: (board: number[]) => Record<Side, number>;
}

export interface ComingSoonGame {
    id: string;
    name: string;
    tagline: string;
    status: 'coming-soon';
    tint: string;
}

export type GameInfo = AvailableGame | ComingSoonGame;

const place = (board: number[], cells: number[], piece: number) => {
    const next = [...board];
    cells.forEach((i) => { next[i] = piece; });
    return next;
};

// Opponent discs that playing `cell` would flip in Reversi (mirrors the backend rules).
export const reversiFlips = (board: number[], cell: number, cols: number, piece: number): number[] => {
    if (board[cell] !== 0) return [];
    const rows = board.length / cols;
    const row = Math.floor(cell / cols);
    const col = cell % cols;
    const flipped: number[] = [];
    for (const [dr, dc] of [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]) {
        const line: number[] = [];
        let r = row + dr;
        let c = col + dc;
        while (r >= 0 && r < rows && c >= 0 && c < cols && board[r * cols + c] === -piece) {
            line.push(r * cols + c);
            r += dr;
            c += dc;
        }
        if (line.length && r >= 0 && r < rows && c >= 0 && c < cols && board[r * cols + c] === piece) {
            flipped.push(...line);
        }
    }
    return flipped;
};

export const GAMES: GameInfo[] = [
    {
        id: 'connect4',
        name: 'Connect 4',
        path: '/connect4',
        tagline: 'Drop discs and line up four before your opponent does.',
        status: 'available',
        tint: '#3354ff',
        sideColors: { X: '#ff4d5e', O: '#ffc23d' },
        modes: [
            { mode: 'human', label: 'Human' },
            { mode: 'random', label: 'Random' },
            { mode: 'minimax', label: 'Minimax' },
            { mode: 'mcts', label: 'MCTS' },
            { mode: 'dqn', label: 'DQN' },
        ],
        difficultyModes: ['minimax', 'mcts'],
        sideLabels: { X: 'Red', O: 'Yellow' },
        rankFromBottom: true,
        applyMove: (board, column, cols, piece) => {
            // Discs fall to the lowest empty cell in the column.
            for (let index = board.length - cols + column; index >= 0; index -= cols) {
                if (board[index] === 0) return place(board, [index], piece);
            }
            return null;
        },
    },
    {
        id: 'tictactoe',
        name: 'Tic-Tac-Toe',
        path: '/tictactoe',
        tagline: 'Three in a row on a 3×3 grid. Can you hold a perfect AI to a draw?',
        status: 'available',
        tint: '#e0458f',
        sideColors: { X: '#38c8ff', O: '#ff5fae' },
        modes: [
            { mode: 'human', label: 'Human' },
            { mode: 'random', label: 'Random' },
            { mode: 'minimax', label: 'Minimax' },
        ],
        difficultyModes: ['minimax'],
        sideLabels: { X: 'X', O: 'O' },
        applyMove: (board, cell, _cols, piece) => (board[cell] === 0 ? place(board, [cell], piece) : null),
    },
    {
        id: 'reversi',
        name: 'Reversi',
        path: '/reversi',
        tagline: 'Outflank and flip your opponent’s discs. Most discs at the end wins.',
        status: 'available',
        tint: '#17a35b',
        sideColors: { X: '#20232b', O: '#f3f0e8' },
        accentColors: { X: '#2fd27f', O: '#2fd27f' },
        modes: [
            { mode: 'human', label: 'Human' },
            { mode: 'random', label: 'Random' },
            { mode: 'minimax', label: 'Minimax' },
        ],
        difficultyModes: ['minimax'],
        sideLabels: { X: 'Dark', O: 'Light' },
        applyMove: (board, cell, cols, piece) => {
            const flipped = reversiFlips(board, cell, cols, piece);
            return flipped.length ? place(board, [cell, ...flipped], piece) : null;
        },
        score: (board) => ({ X: board.filter((c) => c === -1).length, O: board.filter((c) => c === 1).length }),
    },
    { id: 'checkers', name: 'Checkers', tagline: 'Jump, capture and crown your pieces.', status: 'coming-soon', tint: '#d9582b' },
    { id: 'dots-and-boxes', name: 'Dots and Boxes', tagline: 'Draw lines, close boxes, claim the board.', status: 'coming-soon', tint: '#2fa7d8' },
    { id: 'gomoku', name: 'Gomoku', tagline: 'Five in a row on a big board.', status: 'coming-soon', tint: '#c68a2e' },
];

export const squareName = (game: AvailableGame, [row, col]: [number, number], rows: number) =>
    `${'abcdefghijklmnopqrstuvwxyz'[col]}${game.rankFromBottom ? rows - row : row + 1}`;

export const AVAILABLE_GAMES = GAMES.filter((game): game is AvailableGame => game.status === 'available');

export const findGame = (id: string): AvailableGame | undefined =>
    AVAILABLE_GAMES.find((game) => game.id === id);
