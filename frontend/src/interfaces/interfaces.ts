export interface LeaderboardEntry {
    username: string;
    wins: number;
    losses: number;
    draws: number;
}

export interface GameState {
    game_id: string;
    game_type: string;
    rows: number;
    cols: number;
    modes: string[];
    // Flat, row-major board: 0 empty, -1 X, 1 O.
    board: number[];
    current_player: 'X' | 'O';
    done: boolean;
    winner?: 'X' | 'O' | null;
    mode1: string;
    mode2: string;
    difficulty1: Difficulty | null;
    difficulty2: Difficulty | null;
    winning_cells: [number, number][];
    // Moves the side to move may play (empty once the game is over).
    legal_moves: number[];
    // The side that had to pass on the last turn, in games with passing.
    passed: 'X' | 'O' | null;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export type Outcome = 'win' | 'loss' | 'draw';
