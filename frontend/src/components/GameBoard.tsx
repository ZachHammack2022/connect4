import React, { useEffect, useRef, useState } from 'react';
import ModeButtonGroup, { LeanModeButtonProps } from './ModeButtonGroup';
import UnderGameBar from './UnderGameBar';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Difficulty } from '../interfaces/interfaces';
import './GameBoard.css';

interface GameBoardProps {
    board: number[][];
    currentPlayer: string;
    gameOver: boolean;
    winner: string | null;
    // True while a request is in flight (e.g. the AI is thinking).
    busy: boolean;
    handleColumnClick: (column: number) => Promise<void>;
    buttons1: LeanModeButtonProps[];
    currentMode1: string;
    buttons2: LeanModeButtonProps[];
    currentMode2: string;
    difficulty1: Difficulty | null;
    difficulty2: Difficulty | null;
    onDifficultyChange: (player: number, difficulty: Difficulty) => void;
    winningCells: [number, number][];
    resetGame: () => Promise<void>;
}

const PLAYERS: Record<string, { value: number; name: string; className: string }> = {
    X: { value: -1, name: 'Red', className: 'disc-red' },
    O: { value: 1, name: 'Yellow', className: 'disc-yellow' },
};
const discClass = (cell: number) => (cell === -1 ? 'disc-red' : cell === 1 ? 'disc-yellow' : '');
const MODE_LABELS: Record<string, string> = {
    human: 'Human', random: 'Random', minimax: 'Minimax', mcts: 'MCTS', dqn: 'DQN',
};

const GameBoard: React.FC<GameBoardProps> = ({
    board,
    currentPlayer,
    gameOver,
    winner,
    busy,
    handleColumnClick,
    buttons1,
    currentMode1,
    buttons2,
    currentMode2,
    difficulty1,
    difficulty2,
    onDifficultyChange,
    winningCells,
    resetGame
}) => {
    const theme = useTheme();
    const [hoveredColumn, setHoveredColumn] = useState<number | null>(null);

    // Work out which discs are new since the last render so they can be
    // animated dropping in (covers both the human's and the AI's moves).
    const previousBoard = useRef<number[][]>([]);
    const [newDiscs, setNewDiscs] = useState<Set<string>>(new Set());
    useEffect(() => {
        const prev = previousBoard.current;
        const added = new Set<string>();
        // Skip the first load and resets so a restored game doesn't "rain" in.
        const prevCount = prev.flat().filter((c) => c !== 0).length;
        const count = board.flat().filter((c) => c !== 0).length;
        if (prev.length && count > prevCount) {
            board.forEach((row, r) => row.forEach((cell, c) => {
                if (cell !== 0 && prev[r]?.[c] === 0) added.add(`${r}-${c}`);
            }));
        }
        setNewDiscs(added);
        previousBoard.current = board;
    }, [board]);

    const isWinningCell = (row: number, column: number) =>
        winningCells.some(([r, c]) => r === row && c === column);

    const currentMode = currentPlayer === 'X' ? currentMode1 : currentMode2;
    const humanToMove = !gameOver && !busy && currentMode === 'human';

    // Row a disc would land in for the hovered column, for the preview disc.
    const landingRow = (column: number) => {
        for (let r = board.length - 1; r >= 0; r--) {
            if (board[r][column] === 0) return r;
        }
        return -1;
    };
    const previewRow = humanToMove && hoveredColumn !== null ? landingRow(hoveredColumn) : -1;

    const statusText = () => {
        if (gameOver) {
            return winner ? `${PLAYERS[winner].name} (${winner}) wins!` : 'Draw!';
        }
        const who = `${PLAYERS[currentPlayer].name} (${currentPlayer}) — ${MODE_LABELS[currentMode] ?? currentMode}`;
        return busy && currentMode !== 'human' ? `${who} is thinking…` : `${who} to move`;
    };

    const onKeyDown = (event: React.KeyboardEvent, column: number) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleColumnClick(column);
        }
    };

    return (
        <Box className="game-layout">
            <Box className="mode-group mode-group-1">
                <Typography variant="subtitle2" className={`player-label ${PLAYERS.X.className}-text`}>Red (X)</Typography>
                <ModeButtonGroup buttons={buttons1} currentMode={currentMode1}
                    difficulty={difficulty1} onDifficultyChange={(d) => onDifficultyChange(1, d)} />
            </Box>

            <Box className="board-column">
                <Box className="status" aria-live="polite">
                    <Typography variant="h6" component="p">{statusText()}</Typography>
                    {busy && <CircularProgress size={18} sx={{ ml: 1 }} />}
                </Box>
                <div
                    className={`board ${humanToMove ? 'board-active' : ''}`}
                    role="grid"
                    aria-label="Connect 4 board"
                    style={{ background: theme.palette.mode === 'dark' ? '#1d4ed8' : '#2563eb' }}
                    onMouseLeave={() => setHoveredColumn(null)}
                >
                    {board.map((row, rowIndex) => (
                        <div key={rowIndex} className="board-row" role="row">
                            {row.map((cell, columnIndex) => {
                                const winning = isWinningCell(rowIndex, columnIndex);
                                const faded = winningCells.length > 0 && !winning && cell !== 0;
                                const preview = cell === 0 && rowIndex === previewRow && columnIndex === hoveredColumn;
                                const classes = [
                                    'hole',
                                    discClass(cell),
                                    preview ? `${PLAYERS[currentPlayer].className} preview` : '',
                                    winning ? 'winning' : '',
                                    faded ? 'faded' : '',
                                    newDiscs.has(`${rowIndex}-${columnIndex}`) ? 'dropping' : '',
                                ].filter(Boolean).join(' ');
                                const content = cell === -1 ? 'red' : cell === 1 ? 'yellow' : 'empty';
                                return (
                                    <div
                                        key={`${rowIndex}-${columnIndex}`}
                                        className={classes}
                                        role="gridcell"
                                        // Only the top cell of each column is a tab stop.
                                        tabIndex={rowIndex === 0 ? 0 : -1}
                                        data-row={rowIndex}
                                        data-column={columnIndex}
                                        style={{ '--drop-rows': rowIndex + 1 } as React.CSSProperties}
                                        onClick={() => handleColumnClick(columnIndex)}
                                        onKeyDown={(event) => onKeyDown(event, columnIndex)}
                                        onMouseEnter={() => setHoveredColumn(columnIndex)}
                                        onFocus={() => setHoveredColumn(columnIndex)}
                                        aria-label={`Column ${columnIndex + 1}, row ${rowIndex + 1}: ${content}${winning ? ', winning disc' : ''}`}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>
                <UnderGameBar resetGame={resetGame} />
            </Box>

            <Box className="mode-group mode-group-2">
                <Typography variant="subtitle2" className={`player-label ${PLAYERS.O.className}-text`}>Yellow (O)</Typography>
                <ModeButtonGroup buttons={buttons2} currentMode={currentMode2}
                    difficulty={difficulty2} onDifficultyChange={(d) => onDifficultyChange(2, d)} />
            </Box>
        </Box>
    );
};

export default GameBoard;
