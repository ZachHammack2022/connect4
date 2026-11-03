import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from '@mui/material';
import { LeaderboardEntry } from '../interfaces/interfaces';

interface LeaderboardProps {
    title: string;
    data: LeaderboardEntry[];
}

const winPercentage = ({ wins, losses, draws }: LeaderboardEntry) => {
    const total = wins + losses + draws;
    return total > 0 ? `${((wins / total) * 100).toFixed(1)}%` : 'N/A';
};

const Leaderboard: React.FC<LeaderboardProps> = ({ title, data }) => (
    <>
        <Typography variant="h6" component="h2">{title}</Typography>
        <TableContainer component={Paper}>
            <Table aria-label={title} size="small"
                sx={{ '& td, & th': { px: { xs: 1, sm: 2 }, whiteSpace: 'nowrap' } }}>
                <TableHead>
                    <TableRow>
                        <TableCell>Username</TableCell>
                        <TableCell align="right">Wins</TableCell>
                        <TableCell align="right">Losses</TableCell>
                        <TableCell align="right">Draws</TableCell>
                        <TableCell align="right">Win %</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} align="center">No games yet. Beat an AI to get on the board!</TableCell>
                        </TableRow>
                    )}
                    {data.slice(0, 10).map((entry) => (
                        <TableRow key={entry.username}>
                            <TableCell component="th" scope="row">{entry.username}</TableCell>
                            <TableCell align="right">{entry.wins}</TableCell>
                            <TableCell align="right">{entry.losses}</TableCell>
                            <TableCell align="right">{entry.draws}</TableCell>
                            <TableCell align="right">{winPercentage(entry)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    </>
);

export default Leaderboard;
