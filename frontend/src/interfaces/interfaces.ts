export interface LeaderboardEntry {
    username: string;
    wins: number;
    losses: number;
}

export interface MoveSuccessResponse {
    board: number[];
    current_player: string;
    done: boolean;
    winner?: string | null;
  }

export interface ErrorResponse {
  message:string;
}