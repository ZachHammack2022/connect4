import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, CircularProgress, Grid, Link, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ModeButtonGroup from '../components/ModeButtonGroup';
import Leaderboard from '../components/Leaderboard';
import ErrorPopup from '../components/ErrorPopup';
import Connect4Board from '../components/boards/Connect4Board';
import TicTacToeBoard from '../components/boards/TicTacToeBoard';
import { BoardProps } from '../components/boards/types';
import { useGameSession } from '../hooks/useGameSession';
import { AvailableGame, Side } from '../games';
import './GamePage.css';

const BOARDS: Record<string, React.FC<BoardProps>> = {
    connect4: Connect4Board,
    tictactoe: TicTacToeBoard,
};

interface GamePageProps {
    game: AvailableGame;
    username: string;
}

const GamePage: React.FC<GamePageProps> = ({ game, username }) => {
    const session = useGameSession(game, username);
    const { state, busy, currentMode } = session;
    const Board = BOARDS[game.id];

    const modeLabel = (mode: string) => game.modes.find((m) => m.mode === mode)?.label ?? mode;

    const statusText = () => {
        if (!state) return 'Loading…';
        if (state.done) {
            return state.winner ? `${game.sideLabels[state.winner]} wins!` : 'Draw!';
        }
        const who = `${game.sideLabels[state.current_player]} — ${modeLabel(currentMode)}`;
        return busy && currentMode !== 'human' ? `${who} is thinking…` : `${who} to move`;
    };

    const sidePanel = (player: 1 | 2) => {
        const side: Side = player === 1 ? 'X' : 'O';
        const mode = state ? (player === 1 ? state.mode1 : state.mode2) : 'human';
        const difficulty = state ? (player === 1 ? state.difficulty1 : state.difficulty2) : null;
        const buttons = game.modes.map(({ mode: m, label }) => ({
            label, mode: m, onClick: () => session.changeMode(player, m),
        }));
        return (
            <Box className={`mode-group mode-group-${player}`}>
                <Typography variant="subtitle2" className={`player-label ${game.id}-side-${side}`}>
                    {game.sideLabels[side]}
                </Typography>
                <ModeButtonGroup buttons={buttons} currentMode={mode}
                    difficulty={difficulty} onDifficultyChange={(d) => session.changeDifficulty(player, d)} />
            </Box>
        );
    };

    return (
        <>
            <Box sx={{ px: 2, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button component={RouterLink} to="/" startIcon={<ArrowBackIcon />} color="inherit">
                    All games
                </Button>
                <Typography variant="h5" component="h1" sx={{ flexGrow: 1, textAlign: 'center', mr: { sm: 15 } }}>
                    {game.name}
                </Typography>
            </Box>
            <Grid container spacing={2}>
                <Grid item xs={12} md={7} className="gameboard-padding">
                    <Box className="game-layout">
                        {sidePanel(1)}
                        <Box className="board-column">
                            <Box className="status" aria-live="polite">
                                <Typography variant="h6" component="p">{statusText()}</Typography>
                                {busy && <CircularProgress size={18} sx={{ ml: 1 }} />}
                            </Box>
                            {state ? (
                                <Board
                                    board={state.board}
                                    rows={state.rows}
                                    cols={state.cols}
                                    currentPlayer={state.current_player}
                                    winningCells={state.winning_cells}
                                    interactive={session.humanToMove}
                                    onMove={session.move}
                                />
                            ) : <CircularProgress sx={{ m: 6 }} />}
                            <Button variant="outlined" color="inherit" onClick={session.reset} sx={{ mt: 2 }}>
                                Reset Game
                            </Button>
                            {!username && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    Set a name on the <Link component={RouterLink} to="/">home page</Link> to appear on the leaderboard.
                                </Typography>
                            )}
                        </Box>
                        {sidePanel(2)}
                    </Box>
                </Grid>
                <Grid item xs={12} md={5} className="leaderboard-padding">
                    <Leaderboard title={`${game.name} leaderboard`} data={session.leaderboard} />
                </Grid>
            </Grid>
            <ErrorPopup open={!!session.error} errorMessage={session.error || ''} handleClose={session.clearError} />
        </>
    );
};

export default GamePage;
