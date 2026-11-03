import axios from 'axios';
import { LeaderboardEntry,MoveSuccessResponse } from '../interfaces/interfaces';

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


export const useFetchLeaderboard = () => {
    const fetchLeaderboard = async () => {
        try {
            const response = await axios.get('/leaderboard/');
            return response.data;
        } catch (error) {
            throw error;
        }
    };

    return { fetchLeaderboard };
};

// useSubmitGameResult hook
export const useSubmitGameResult = (username: string, fetchLeaderboard: () => Promise<LeaderboardEntry[]>) => {
    const submitGameResult = async (won: boolean) => {
        if (!username) return;
        try {
            await axios.post('/submit_game/', { username, won });
            return await fetchLeaderboard();
        } catch (error) {
            throw error;
        }
    };
    return { submitGameResult };
};

// useFetchGameState hook
export const useFetchGameState = () => {
    const fetchGameState = async () => {
        try {
            const response = await axios.get('/state');
            return response.data;
        } catch (error) {
            throw error;
        }
    };
    return { fetchGameState };
};

// useChangeMode hook
export const useChangeMode = () => {
    const handleChangeMode = async (newMode: string,player:number) => {
        const response = await axios.post('/set_mode', { mode: newMode,player:player });
        return response.data;
    };
    return { handleChangeMode };
};

// useHandleColumnClick hook
export const useHandleColumnClick = () => {
    const handleColumnClick = async (column: number) => {
        const response = await axios.post<MoveSuccessResponse>('/move', { column });
        return response.data;
    };
    return { handleColumnClick };
};


// useResetGame hook
export const useResetGame = () => {
    const resetGame = async () => {
        try {
            const response = await axios.post('/reset');
            return response.data;
        } catch (error) {
            throw error;
        }
    };
    return { resetGame };
};