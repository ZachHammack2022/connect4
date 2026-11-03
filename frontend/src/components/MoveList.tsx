import React, { useEffect, useRef } from 'react';
import { MoveRecord } from '../interfaces/interfaces';
import { AvailableGame, squareName } from '../games';
import { Token } from './SeatCard';
import './MoveList.css';

interface MoveListProps {
    game: AvailableGame;
    history: MoveRecord[];
    rows: number;
}

// The game so far as a strip of numbered moves, newest on the right.
const MoveList: React.FC<MoveListProps> = ({ game, history, rows }) => {
    const listRef = useRef<HTMLOListElement>(null);
    useEffect(() => {
        const list = listRef.current;
        if (list) list.scrollLeft = list.scrollWidth;
    }, [history.length]);

    return (
        <div className="move-list">
            <span className="move-list-label">Moves</span>
            {history.length === 0 ? (
                <span className="move-list-empty">No moves yet</span>
            ) : (
                <ol ref={listRef} aria-label="Moves played">
                    {history.map((m, i) => (
                        <li key={i} className={i === history.length - 1 ? 'latest' : ''}>
                            <span className="move-number">{i + 1}</span>
                            <Token side={m.player} />
                            <span>{m.cell ? squareName(game, m.cell, rows) : '—'}</span>
                        </li>
                    ))}
                </ol>
            )}
        </div>
    );
};

export default MoveList;
