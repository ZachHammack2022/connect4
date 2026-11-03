import React, { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { BoardProps, activateOnKey, isWinningCell, toRows } from './types';
import './TicTacToeBoard.css';

const Mark: React.FC<{ value: number }> = ({ value }) =>
    value === -1 ? (
        <svg viewBox="0 0 100 100" className="ttt-mark ttt-x" aria-hidden="true">
            <line x1="22" y1="22" x2="78" y2="78" />
            <line x1="78" y1="22" x2="22" y2="78" />
        </svg>
    ) : (
        <svg viewBox="0 0 100 100" className="ttt-mark ttt-o" aria-hidden="true">
            <circle cx="50" cy="50" r="29" />
        </svg>
    );

const TicTacToeBoard: React.FC<BoardProps> = ({ board, rows, cols, currentPlayer, winningCells, interactive, onMove }) => {
    const theme = useTheme();
    const [hovered, setHovered] = useState<number | null>(null);
    const grid = toRows(board, rows, cols);
    const lineColor = theme.palette.mode === 'dark' ? theme.palette.grey[600] : theme.palette.grey[400];

    return (
        <div
            className={`ttt-board ${interactive ? 'board-active' : ''}`}
            role="grid"
            aria-label="Tic-tac-toe board"
            style={{ '--ttt-line': lineColor } as React.CSSProperties}
            onMouseLeave={() => setHovered(null)}
        >
            {grid.map((row, r) => (
                <div key={r} className="ttt-row" role="row">
                    {row.map((cell, c) => {
                        const index = r * cols + c;
                        const winning = isWinningCell(winningCells, r, c);
                        const faded = winningCells.length > 0 && !winning && cell !== 0;
                        const preview = interactive && cell === 0 && hovered === index;
                        const content = cell === -1 ? 'X' : cell === 1 ? 'O' : 'empty';
                        return (
                            <div
                                key={index}
                                className={['ttt-cell', winning ? 'winning' : '', faded ? 'faded' : ''].filter(Boolean).join(' ')}
                                role="gridcell"
                                tabIndex={cell === 0 ? 0 : -1}
                                data-cell={index}
                                onClick={() => onMove(index)}
                                onKeyDown={(event) => activateOnKey(event, () => onMove(index))}
                                onMouseEnter={() => setHovered(index)}
                                onFocus={() => setHovered(index)}
                                aria-label={`Row ${r + 1}, column ${c + 1}: ${content}${winning ? ', winning' : ''}`}
                            >
                                {cell !== 0 && <Mark value={cell} />}
                                {preview && <span className="ttt-preview"><Mark value={currentPlayer === 'X' ? -1 : 1} /></span>}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

export default TicTacToeBoard;
