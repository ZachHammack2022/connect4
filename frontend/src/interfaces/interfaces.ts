export interface LeaderboardEntry {
    username: string;
    wins: number;
    losses: number;
    draws: number;
    current_streak?: number;
    best_streak?: number;
}

export interface LeaderboardFilter {
    opponent: string;
    difficulty: Difficulty | null;
}

export interface OpponentSummary extends LeaderboardFilter {
    games: number;
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
    // Moves so far, oldest first; `cell` is where the piece went.
    history: MoveRecord[];
    // A human used undo this game, so its result won't be recorded.
    assisted: boolean;
    // Online games only: who sits where, and which seat (if any) is yours.
    online?: OnlineInfo | null;
}

export interface OnlineSeat {
    name: string | null;
    taken: boolean;
    connected: boolean;
}

export interface OnlineInfo {
    seats: Record<'X' | 'O', OnlineSeat>;
    you: 'X' | 'O' | null;
}

// Creating or joining an online game also returns your seat's secret token.
export type SeatedGameState = GameState & { seat_token: string | null };

export interface MoveRecord {
    player: 'X' | 'O';
    move: number;
    cell: [number, number] | null;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export type Outcome = 'win' | 'loss' | 'draw';
