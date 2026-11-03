import React, { useEffect, useRef, useState } from 'react';
import { BoardProps, activateOnKey, isWinningCell, toRows } from './types';
import { reversiFlips } from '../../games';
import './ReversiBoard.css';

const FILES = 'abcdefgh';

const ReversiBoard: React.FC<BoardProps> = ({ board, rows, cols, currentPlayer, winningCells, legalMoves, interactive, onMove }) => {
    const [hovered, setHovered] = useState<number | null>(null);
    const grid = toRows(board, rows, cols);
    const piece = currentPlayer === 'X' ? -1 : 1;

    // Which discs were just placed or flipped, so they can animate. Flips are
    // staggered by distance from the disc that caused them.
    const previous = useRef<number[]>([]);
    const [placed, setPlaced] = useState<Set<number>>(new Set());
    const [flipDelay, setFlipDelay] = useState<Map<number, number>>(new Map());
    useEffect(() => {
        const prev = previous.current;
        const newPlaced = new Set<number>();
        const flipped = new Map<number, number>();
        if (prev.length === board.length) {
            board.forEach((cell, i) => {
                if (cell !== 0 && prev[i] === 0) newPlaced.add(i);
            });
            const origins = Array.from(newPlaced);
            board.forEach((cell, i) => {
                if (cell !== 0 && prev[i] !== 0 && prev[i] !== cell) {
                    const distance = Math.min(...origins.map((o) =>
                        Math.max(Math.abs(Math.floor(o / cols) - Math.floor(i / cols)), Math.abs((o % cols) - (i % cols)))));
                    flipped.set(i, Number.isFinite(distance) ? distance : 1);
                }
            });
            // A reset or a big jump (e.g. a restored game): don't animate.
            if (newPlaced.size > 2) { newPlaced.clear(); flipped.clear(); }
        }
        setPlaced(newPlaced);
        setFlipDelay(flipped);
        previous.current = board;
    }, [board, cols]);

    const legal = new Set(interactive ? legalMoves : []);
    const previewFlips = interactive && hovered !== null && legal.has(hovered)
        ? new Set(reversiFlips(board, hovered, cols, piece)) : new Set<number>();

    return (
        <div className={`rv ${interactive ? 'board-active' : ''} ${winningCells.length ? 'has-winner' : ''}`}>
            <div className="rv-board" role="grid" aria-label="Reversi board" onMouseLeave={() => setHovered(null)}>
                {grid.map((row, r) => (
                    <div key={r} className="rv-row" role="row">
                        {row.map((cell, c) => {
                            const index = r * cols + c;
                            const isLegal = legal.has(index);
                            const winning = isWinningCell(winningCells, r, c);
                            const faded = winningCells.length > 0 && !winning && cell !== 0;
                            const content = cell === -1 ? 'dark' : cell === 1 ? 'light' : isLegal ? 'empty, legal move' : 'empty';
                            const delay = flipDelay.get(index);
                            return (
                                <div
                                    key={index}
                                    className={['rv-cell', isLegal ? 'legal' : '', winning ? 'winning' : '', faded ? 'faded' : ''].filter(Boolean).join(' ')}
                                    role="gridcell"
                                    tabIndex={isLegal ? 0 : -1}
                                    data-cell={index}
                                    onClick={() => onMove(index)}
                                    onKeyDown={(event) => activateOnKey(event, () => onMove(index))}
                                    onMouseEnter={() => setHovered(index)}
                                    onFocus={() => setHovered(index)}
                                    aria-label={`${FILES[c]}${r + 1}: ${content}`}
                                >
                                    {cell !== 0 && (
                                        <span
                                            key={delay !== undefined ? `flip-${cell}` : `disc-${cell}`}
                                            className={[
                                                'rv-disc', cell === -1 ? 'rv-X' : 'rv-O',
                                                placed.has(index) ? 'placed' : '',
                                                delay !== undefined ? 'flipping' : '',
                                                previewFlips.has(index) ? 'will-flip' : '',
                                            ].filter(Boolean).join(' ')}
                                            style={delay !== undefined ? { animationDelay: `${0.12 + delay * 0.06}s` } as React.CSSProperties : undefined}
                                        />
                                    )}
                                    {cell === 0 && isLegal && (
                                        hovered === index
                                            ? <span className={`rv-disc rv-${currentPlayer} preview`} />
                                            : <span className="rv-hint" />
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

export default ReversiBoard;
