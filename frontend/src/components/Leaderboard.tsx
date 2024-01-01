import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,Typography } from '@mui/material';

interface LeaderboardEntry {
    username: string;
    wins: number;
    losses: number;
}

interface LeaderboardProps {
    data: LeaderboardEntry[];
}

const Leaderboard: React.FC<LeaderboardProps> = ({ data }) => {
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
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.slice(0, 4).map((entry, index) => (
                            <TableRow key={index}>
                                <TableCell component="th" scope="row">
                                    {entry.username}
                                </TableCell>
                                <TableCell align="right">{entry.wins}</TableCell>
                                <TableCell align="right">{entry.losses}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    );
};


export default Leaderboard;
