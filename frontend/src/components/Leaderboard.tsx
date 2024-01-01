import React, { useState, useEffect } from 'react';
import axios from 'axios';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';

interface LeaderboardEntry {
    username: string;
    wins: number;
    losses: number;
}

const Leaderboard: React.FC = () => {
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);

    useEffect(() => {
        axios.get('http://backend:8000/leaderboard')
            .then(response => setLeaderboardData(response.data))
            .catch(error => console.error('Error fetching leaderboard data:', error));
    }, []);

    return (
        <>
            <h3>Leaderboard</h3>
            <List>
                {leaderboardData.map((entry, index) => (
                    <ListItem key={index}>
                        {entry.username}: {entry.wins} wins, {entry.losses} losses
                    </ListItem>
                ))}
            </List>
        </>
    );
};

export default Leaderboard;
