import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from '@mui/material';

interface LeaderboardEntry {
    username: string;
    wins: number;
    losses: number;
}

interface LeaderboardProps {
    data: LeaderboardEntry[];
}

const Leaderboard: React.FC<LeaderboardProps> = ({ data }) => {
    const calculateWinPercentage = (wins: number, losses: number) => {
        const totalGames = wins + losses;
        return totalGames > 0 ? ((wins / totalGames) * 100).toFixed(2) + '%' : 'N/A';
    };

    return (
        <>
            <Typography variant="h6" component="h3">
                Leaderboard
            </Typography>
            <TableContainer component={Paper}>
                <Table aria-label="leaderboard table">
                    <TableHead>
                        <TableRow>
                            <TableCell>Username</TableCell>
                            <TableCell align="right">Wins</TableCell>
                            <TableCell align="right">Losses</TableCell>
                            <TableCell align="right">Win %</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.slice(0, 5).map((entry, index) => (
                            <TableRow key={index}>
                                <TableCell component="th" scope="row">
                                    {entry.username}
                                </TableCell>
                                <TableCell align="right">{entry.wins}</TableCell>
                                <TableCell align="right">{entry.losses}</TableCell>
                                <TableCell align="right">
                                    {calculateWinPercentage(entry.wins, entry.losses)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    );
};

export default Leaderboard;

