import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { BoardProps, activateOnKey, isWinningCell, toRows } from './types';
import './Connect4Board.css';

const discClass = (cell: number) => (cell === -1 ? 'disc-red' : cell === 1 ? 'disc-yellow' : '');

const Connect4Board: React.FC<BoardProps> = ({ board, rows, cols, currentPlayer, winningCells, interactive, onMove }) => {
    const theme = useTheme();
    const [hoveredColumn, setHoveredColumn] = useState<number | null>(null);
    const grid = toRows(board, rows, cols);

    // Work out which discs are new since the last render so they can be
    // animated dropping in (covers both the human's and the AI's moves).
    const previousBoard = useRef<number[]>([]);
    const [newDiscs, setNewDiscs] = useState<Set<number>>(new Set());
    useEffect(() => {
        const prev = previousBoard.current;
        const added = new Set<number>();
        // Skip the first load and resets so a restored game doesn't "rain" in.
        const count = (cells: number[]) => cells.filter((c) => c !== 0).length;
        if (prev.length === board.length && count(board) > count(prev)) {
            board.forEach((cell, i) => { if (cell !== 0 && prev[i] === 0) added.add(i); });
        }
        setNewDiscs(added);
        previousBoard.current = board;
    }, [board]);

    // Row a disc would land in for the hovered column, for the preview disc.
    const landingRow = (column: number) => {
        for (let r = rows - 1; r >= 0; r--) {
            if (grid[r][column] === 0) return r;
        }
        return -1;
    };
    const previewRow = interactive && hoveredColumn !== null ? landingRow(hoveredColumn) : -1;
    const previewClass = currentPlayer === 'X' ? 'disc-red' : 'disc-yellow';

    return (
        <div
            className={`c4-board ${interactive ? 'board-active' : ''}`}
            role="grid"
            aria-label="Connect 4 board"
            style={{ background: theme.palette.mode === 'dark' ? '#1d4ed8' : '#2563eb' }}
            onMouseLeave={() => setHoveredColumn(null)}
        >
            {grid.map((row, rowIndex) => (
                <div key={rowIndex} className="c4-row" role="row">
                    {row.map((cell, columnIndex) => {
                        const index = rowIndex * cols + columnIndex;
                        const winning = isWinningCell(winningCells, rowIndex, columnIndex);
                        const faded = winningCells.length > 0 && !winning && cell !== 0;
                        const preview = cell === 0 && rowIndex === previewRow && columnIndex === hoveredColumn;
                        const classes = [
                            'hole',
                            discClass(cell),
                            preview ? `${previewClass} preview` : '',
                            winning ? 'winning' : '',
                            faded ? 'faded' : '',
                            newDiscs.has(index) ? 'dropping' : '',
                        ].filter(Boolean).join(' ');
                        const content = cell === -1 ? 'red' : cell === 1 ? 'yellow' : 'empty';
                        return (
                            <div
                                key={index}
                                className={classes}
                                role="gridcell"
                                // Only the top cell of each column is a tab stop.
                                tabIndex={rowIndex === 0 ? 0 : -1}
                                data-row={rowIndex}
                                data-column={columnIndex}
                                style={{ '--drop-rows': rowIndex + 1 } as React.CSSProperties}
                                onClick={() => onMove(columnIndex)}
                                onKeyDown={(event) => activateOnKey(event, () => onMove(columnIndex))}
                                onMouseEnter={() => setHoveredColumn(columnIndex)}
                                onFocus={() => setHoveredColumn(columnIndex)}
                                aria-label={`Column ${columnIndex + 1}, row ${rowIndex + 1}: ${content}${winning ? ', winning disc' : ''}`}
                            />
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

export default Connect4Board;
