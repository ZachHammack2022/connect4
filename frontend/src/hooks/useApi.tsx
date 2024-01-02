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