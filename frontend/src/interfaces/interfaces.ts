export interface LeaderboardEntry {
    username: string;
    wins: number;
    losses: number;
}

export interface GameState {
    game_id: string;
    board: number[];
    current_player: string;
    done: boolean;
    winner?: string | null;
    mode1: string;
    mode2: string;
    difficulty1: Difficulty | null;
    difficulty2: Difficulty | null;
    winning_cells: [number, number][];
}

export type Difficulty = 'easy' | 'medium' | 'hard';
