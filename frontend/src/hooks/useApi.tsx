import axios from 'axios';
import { Difficulty, GameState, LeaderboardEntry, LeaderboardFilter, OpponentSummary, Outcome, SeatedGameState } from '../interfaces/interfaces';

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

export const fetchLeaderboard = async (gameType: string, filter?: LeaderboardFilter | null): Promise<LeaderboardEntry[]> => {
    const params: Record<string, string> = { game_type: gameType };
    if (filter) {
        params.opponent = filter.opponent;
        if (filter.difficulty) params.difficulty = filter.difficulty;
    }
    const response = await axios.get<LeaderboardEntry[]>('/leaderboard/', { params });
    return response.data;
};

export const fetchOpponents = async (gameType: string): Promise<OpponentSummary[]> => {
    const response = await axios.get<OpponentSummary[]>('/leaderboard/opponents', { params: { game_type: gameType } });
    return response.data;
};

export const submitGameResult = async (
    username: string, gameType: string, outcome: Outcome, opponent: string, difficulty: Difficulty | null,
): Promise<void> => {
    await axios.post('/submit_game/', { username, game_type: gameType, outcome, opponent, difficulty });
};

// ---- games ---------------------------------------------------------------

export const createGame = async (gameType: string): Promise<GameState> => {
    const response = await axios.post<GameState>('/games', { game_type: gameType });
    return response.data;
};

// Online players prove which seat they hold with this header.
const seat = (token?: string | null) => (token ? { headers: { 'X-Seat-Token': token } } : {});

export const fetchGameState = async (gameId: string, token?: string | null): Promise<GameState> => {
    const response = await axios.get<GameState>(`/games/${gameId}`, seat(token));
    return response.data;
};

export const makeMove = async (gameId: string, move: number, token?: string | null): Promise<GameState> => {
    const response = await axios.post<GameState>(`/games/${gameId}/move`, { move }, seat(token));
    return response.data;
};

export const createOnlineGame = async (gameType: string, name: string): Promise<SeatedGameState> => {
    const response = await axios.post<SeatedGameState>('/games/online', { game_type: gameType, name });
    return response.data;
};

export const joinGame = async (gameId: string, name: string, token?: string | null): Promise<SeatedGameState> => {
    const response = await axios.post<SeatedGameState>(`/games/${gameId}/join`, { name }, seat(token));
    return response.data;
};

export const changeMode = async (gameId: string, mode: string, player: number, difficulty?: Difficulty | null): Promise<GameState> => {
    const response = await axios.post<GameState>(`/games/${gameId}/mode`, { mode, player, difficulty: difficulty ?? undefined });
    return response.data;
};

export const undoMove = async (gameId: string): Promise<GameState> => {
    const response = await axios.post<GameState>(`/games/${gameId}/undo`);
    return response.data;
};

export const getHint = async (gameId: string): Promise<GameState & { hint: number }> => {
    const response = await axios.post<GameState & { hint: number }>(`/games/${gameId}/hint`);
    return response.data;
};

export const resetGame = async (gameId: string, token?: string | null): Promise<GameState> => {
    const response = await axios.post<GameState>(`/games/${gameId}/reset`, null, seat(token));
    return response.data;
};
