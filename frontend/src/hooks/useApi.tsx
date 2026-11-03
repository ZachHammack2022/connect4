import axios from 'axios';
import { Difficulty, GameState, LeaderboardEntry, Outcome } from '../interfaces/interfaces';

// Extracts a readable message from an API error (FastAPI returns `{ detail }`).
export const getErrorMessage = (error: unknown): string => {
    if (axios.isAxiosError(error)) {
        const detail = error.response?.data?.detail;
        if (typeof detail === 'string') return detail;
        if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
        return error.message;
    }
    return error instanceof Error ? error.message : String(error);
};

export const isNotFound = (error: unknown): boolean =>
    axios.isAxiosError(error) && error.response?.status === 404;

// ---- leaderboard ---------------------------------------------------------

export const fetchLeaderboard = async (gameType: string): Promise<LeaderboardEntry[]> => {
    const response = await axios.get<LeaderboardEntry[]>('/leaderboard/', { params: { game_type: gameType } });
    return response.data;
};

export const submitGameResult = async (username: string, gameType: string, outcome: Outcome): Promise<LeaderboardEntry[]> => {
    await axios.post('/submit_game/', { username, game_type: gameType, outcome });
    return fetchLeaderboard(gameType);
};

// ---- games ---------------------------------------------------------------

export const createGame = async (gameType: string): Promise<GameState> => {
    const response = await axios.post<GameState>('/games', { game_type: gameType });
    return response.data;
};

export const fetchGameState = async (gameId: string): Promise<GameState> => {
    const response = await axios.get<GameState>(`/games/${gameId}`);
    return response.data;
};

export const makeMove = async (gameId: string, move: number): Promise<GameState> => {
    const response = await axios.post<GameState>(`/games/${gameId}/move`, { move });
    return response.data;
};

export const changeMode = async (gameId: string, mode: string, player: number, difficulty?: Difficulty | null): Promise<GameState> => {
    const response = await axios.post<GameState>(`/games/${gameId}/mode`, { mode, player, difficulty: difficulty ?? undefined });
    return response.data;
};

export const resetGame = async (gameId: string): Promise<GameState> => {
    const response = await axios.post<GameState>(`/games/${gameId}/reset`);
    return response.data;
};
