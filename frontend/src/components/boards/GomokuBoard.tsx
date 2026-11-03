import React, { useState } from 'react';
import { BoardProps, activateOnKey, isLastCell, isWinningCell, toRows } from './types';
import './GomokuBoard.css';

// Star points (hoshi) on a 15x15 board.
const STARS = new Set(['3,3', '3,11', '7,7', '11,3', '11,11']);
const FILES = 'abcdefghijklmnopqrstuvwxyz';

const GomokuBoard: React.FC<BoardProps> = ({ board, rows, cols, currentPlayer, winningCells, lastCell, hintCell, interactive, onMove }) => {
    const [hovered, setHovered] = useState<number | null>(null);
    const grid = toRows(board, rows, cols);

    return (
        <div className={`gk ${interactive ? 'board-active' : ''}`}>
            <div className="gk-board" role="grid" aria-label="Gomoku board" onMouseLeave={() => setHovered(null)}
                style={{ '--gk-cols': cols } as React.CSSProperties}>
                {grid.map((row, r) => (
                    <div key={r} className="gk-row" role="row">
                        {row.map((cell, c) => {
                            const index = r * cols + c;
                            const winning = isWinningCell(winningCells, r, c);
                            const faded = winningCells.length > 0 && !winning && cell !== 0;
                            const classes = [
                                'gk-cell',
                                r === 0 ? 'edge-t' : '', r === rows - 1 ? 'edge-b' : '',
                                c === 0 ? 'edge-l' : '', c === cols - 1 ? 'edge-r' : '',
                                cell === 0 ? 'empty' : '',
                                winning ? 'winning' : '', faded ? 'faded' : '',
                                cell !== 0 && isLastCell(lastCell, r, c) ? 'last' : '',
                                isLastCell(hintCell ?? null, r, c) ? 'hinted' : '',
                            ].filter(Boolean).join(' ');
                            const content = cell === -1 ? 'black' : cell === 1 ? 'white' : 'empty';
                            return (
                                <div
                                    key={index}
                                    className={classes}
                                    role="gridcell"
                                    tabIndex={cell === 0 && interactive ? 0 : -1}
                                    data-cell={index}
                                    onClick={() => onMove(index)}
                                    onKeyDown={(event) => activateOnKey(event, () => onMove(index))}
                                    onMouseEnter={() => setHovered(index)}
                                    onFocus={() => setHovered(index)}
                                    aria-label={`${FILES[c]}${rows - r}: ${content}`}
                                >
                                    {STARS.has(`${r},${c}`) && cell === 0 && <span className="gk-star" />}
                                    {cell !== 0 && <span className={`gk-stone gk-${cell === -1 ? 'X' : 'O'}`} />}
                                    {cell === 0 && interactive && hovered === index && (
                                        <span className={`gk-stone gk-${currentPlayer} preview`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GomokuBoard;
