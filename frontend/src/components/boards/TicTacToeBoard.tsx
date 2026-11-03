import React, { useState } from 'react';
import { BoardProps, activateOnKey, isLastCell, isWinningCell, toRows } from './types';
import './TicTacToeBoard.css';

const Mark: React.FC<{ value: number; animate?: boolean }> = ({ value, animate = true }) =>
    value === -1 ? (
        <svg viewBox="0 0 100 100" className={`ttt-mark ttt-x ${animate ? 'draw' : ''}`} aria-hidden="true">
            <line x1="26" y1="26" x2="74" y2="74" pathLength={1} />
            <line x1="74" y1="26" x2="26" y2="74" pathLength={1} />
        </svg>
    ) : (
        <svg viewBox="0 0 100 100" className={`ttt-mark ttt-o ${animate ? 'draw' : ''}`} aria-hidden="true">
            <circle cx="50" cy="50" r="25" pathLength={1} transform="rotate(-90 50 50)" />
        </svg>
    );

const TicTacToeBoard: React.FC<BoardProps> = ({ board, rows, cols, currentPlayer, winningCells, lastCell, interactive, onMove }) => {
    const [hovered, setHovered] = useState<number | null>(null);
    const grid = toRows(board, rows, cols);
    const winner = winningCells.length > 0
        ? (grid[winningCells[0][0]][winningCells[0][1]] === -1 ? 'X' : 'O') : null;

    return (
        <div
            className={`ttt ${interactive ? 'board-active' : ''} ${winner ? `won-by-${winner}` : ''}`}
            role="grid"
            aria-label="Tic-tac-toe board"
            style={{ '--ttt-cols': cols } as React.CSSProperties}
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
                                className={['ttt-cell', cell === 0 ? 'empty' : '', winning ? 'winning' : '', faded ? 'faded' : '',
                                    cell !== 0 && isLastCell(lastCell, r, c) ? 'last' : ''].filter(Boolean).join(' ')}
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
                                {preview && <span className="ttt-preview"><Mark value={currentPlayer === 'X' ? -1 : 1} animate={false} /></span>}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

export default TicTacToeBoard;
