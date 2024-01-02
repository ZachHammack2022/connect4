import axios from 'axios';
import { LeaderboardEntry,MoveSuccessResponse,ErrorResponse } from '../interfaces/interfaces';


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
    const handleChangeMode = async (newMode: string) => {
        await axios.post('/set_mode', { mode: newMode });
        return newMode;
    };
    return { handleChangeMode };
};

// useHandleColumnClick hook
export const useHandleColumnClick = () => {
    const handleColumnClick = async (column: number) => {
        try {
            const response = await axios.post<MoveSuccessResponse>('/move', { column });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                // If it's an Axios error, extract and throw the ErrorResponse
                throw error.response?.data as ErrorResponse;
            }
            // If it's not an Axios error, throw a generic error object
            throw new Error("An unknown error occurred while handling column click.");
        }
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