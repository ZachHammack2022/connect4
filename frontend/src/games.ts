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
    modes: ModeOption[];
    // Modes that have an easy/medium/hard setting.
    difficultyModes: string[];
    // How each side is named on screen, e.g. "Red (X)" in Connect 4.
    sideLabels: Record<Side, string>;
    // Where a move lands on a flat, row-major board (for showing the human's
    // move instantly), or -1 if the move isn't possible.
    landingIndex: (board: number[], move: number, cols: number) => number;
}

export interface ComingSoonGame {
    id: string;
    name: string;
    tagline: string;
    status: 'coming-soon';
}

export type GameInfo = AvailableGame | ComingSoonGame;

export const GAMES: GameInfo[] = [
    {
        id: 'connect4',
        name: 'Connect 4',
        path: '/connect4',
        tagline: 'Drop discs and line up four before your opponent does.',
        status: 'available',
        modes: [
            { mode: 'human', label: 'Human' },
            { mode: 'random', label: 'Random' },
            { mode: 'minimax', label: 'Minimax' },
            { mode: 'mcts', label: 'MCTS' },
            { mode: 'dqn', label: 'DQN' },
        ],
        difficultyModes: ['minimax', 'mcts'],
        sideLabels: { X: 'Red (X)', O: 'Yellow (O)' },
        landingIndex: (board, column, cols) => {
            // Discs fall to the lowest empty cell in the column.
            for (let index = board.length - cols + column; index >= 0; index -= cols) {
                if (board[index] === 0) return index;
            }
            return -1;
        },
    },
    {
        id: 'tictactoe',
        name: 'Tic-Tac-Toe',
        path: '/tictactoe',
        tagline: 'The classic: three in a row on a 3×3 grid. Can you beat a perfect AI?',
        status: 'available',
        modes: [
            { mode: 'human', label: 'Human' },
            { mode: 'random', label: 'Random' },
            { mode: 'minimax', label: 'Minimax' },
        ],
        difficultyModes: ['minimax'],
        sideLabels: { X: 'X', O: 'O' },
        landingIndex: (board, cell) => (board[cell] === 0 ? cell : -1),
    },
    { id: 'reversi', name: 'Reversi', tagline: 'Outflank and flip your opponent’s pieces.', status: 'coming-soon' },
    { id: 'checkers', name: 'Checkers', tagline: 'Jump, capture and crown your pieces.', status: 'coming-soon' },
    { id: 'dots-and-boxes', name: 'Dots and Boxes', tagline: 'Draw lines, close boxes, claim the board.', status: 'coming-soon' },
    { id: 'gomoku', name: 'Gomoku', tagline: 'Five in a row on a big board.', status: 'coming-soon' },
];

export const AVAILABLE_GAMES = GAMES.filter((game): game is AvailableGame => game.status === 'available');

export const findGame = (id: string): AvailableGame | undefined =>
    AVAILABLE_GAMES.find((game) => game.id === id);
