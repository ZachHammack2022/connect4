import React from 'react';
import { Difficulty } from '../interfaces/interfaces';
import { ModeOption, Side } from '../games';
import './SeatCard.css';

interface SeatCardProps {
    side: Side;
    label: string;
    modes: ModeOption[];
    mode: string;
    difficulty: Difficulty | null;
    hasDifficulty: boolean;
    // This seat moves next (and the game is still on).
    active: boolean;
    thinking: boolean;
    won: boolean;
    // Pieces on the board, for games scored by count.
    score?: number;
    // The human player's name, when this seat is the only human one.
    playerName?: string;
    disabled: boolean;
    onModeChange: (mode: string) => void;
    onDifficultyChange: (difficulty: Difficulty) => void;
}

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

const MODE_HINTS: Record<string, string> = {
    human: 'Moves by tapping the board',
    random: 'Picks any legal move',
    dqn: 'Experimental learned policy',
};

export const Token: React.FC<{ side: Side }> = ({ side }) => (
    <span className={`token token-${side}`} aria-hidden="true" />
);

const SeatCard: React.FC<SeatCardProps> = ({
    side, label, modes, mode, difficulty, hasDifficulty, active, thinking, won, score, playerName,
    disabled, onModeChange, onDifficultyChange,
}) => {
    const modeLabel = modes.find((m) => m.mode === mode)?.label ?? mode;
    const who = mode === 'human' ? (playerName || 'Human') : /\bAI$/.test(modeLabel) ? modeLabel : `${modeLabel} AI`;
    const classes = ['seat', `seat-${side}`, active ? 'is-active' : '', won ? 'is-winner' : ''].filter(Boolean).join(' ');

    return (
        <section className={classes} aria-label={`${label} player`}>
            <header className="seat-head">
                <Token side={side} />
                <div className="seat-names">
                    <span className="seat-side">
                        {label}
                        {score !== undefined && <span className="seat-score" aria-label={`${score} discs`}>{score}</span>}
                    </span>
                    <span className="seat-who">{who}</span>
                </div>
                <span className="seat-badge" aria-live="polite">
                    {won ? 'Winner' : thinking ? <><span className="spinner" /> Thinking</> : active ? 'To move' : ''}
                </span>
            </header>

            <div className="segmented seat-modes" role="group" aria-label={`Who plays ${label}`}>
                {modes.map((m) => (
                    <button key={m.mode} type="button" aria-pressed={m.mode === mode}
                        disabled={disabled} onClick={() => m.mode !== mode && onModeChange(m.mode)}>
                        {m.label}
                    </button>
                ))}
            </div>

            <div className="seat-extra">
                {hasDifficulty ? (
                    <div className="difficulty" role="group" aria-label={`${label} AI difficulty`}>
                        {DIFFICULTIES.map((d) => (
                            <button key={d} type="button" aria-pressed={difficulty === d} disabled={disabled}
                                className={`difficulty-${d}`}
                                onClick={() => difficulty !== d && onDifficultyChange(d)}>
                                {d}
                            </button>
                        ))}
                    </div>
                ) : (
                    <span className="seat-hint">{MODE_HINTS[mode] ?? ''}</span>
                )}
            </div>
        </section>
    );
};

export default SeatCard;
