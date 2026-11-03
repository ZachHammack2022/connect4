import React from 'react';
import { LeaderboardEntry, LeaderboardFilter, OpponentSummary } from '../interfaces/interfaces';
import { AvailableGame } from '../games';
import { Avatar } from './NameForm';
import { Flame, Trophy } from './Icons';
import './Leaderboard.css';

interface LeaderboardProps {
    game: AvailableGame;
    data: LeaderboardEntry[];
    username: string;
    loading: boolean;
    failed: boolean;
    // AI opponents with recorded results, offered as filters.
    opponents: OpponentSummary[];
    filter: LeaderboardFilter | null;
    onFilterChange: (filter: LeaderboardFilter | null) => void;
    footer?: React.ReactNode;
}

// A streak this long earns a flame on the leaderboard.
const STREAK_BADGE = 3;

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const winRate = ({ wins, losses, draws }: LeaderboardEntry) => {
    const total = wins + losses + draws;
    return total > 0 ? wins / total : 0;
};

const Leaderboard: React.FC<LeaderboardProps> = ({
    game, data, username, loading, failed, opponents, filter, onFilterChange, footer,
}) => {
    const opponentLabel = ({ opponent, difficulty }: LeaderboardFilter) => {
        const name = game.modes.find((m) => m.mode === opponent)?.label ?? opponent;
        return difficulty ? `${name} · ${capitalize(difficulty)}` : name;
    };
    const isSelected = (o: LeaderboardFilter) =>
        !!filter && filter.opponent === o.opponent && filter.difficulty === o.difficulty;
    const filterName = filter ? opponentLabel(filter) : 'the AI';

    return (
    <section className="card leaderboard" aria-labelledby="leaderboard-title">
        <header className="lb-head">
            <span className="lb-icon"><Trophy /></span>
            <div>
                <h2 id="leaderboard-title">Leaderboard</h2>
                <p>{game.name} · games vs {filterName}</p>
            </div>
        </header>

        {opponents.length > 0 && (
            <div className="lb-filters" role="group" aria-label="Filter by AI opponent">
                <button type="button" aria-pressed={!filter} onClick={() => onFilterChange(null)}>All</button>
                {opponents.map((o) => (
                    <button key={`${o.opponent}-${o.difficulty}`} type="button" aria-pressed={isSelected(o)}
                        onClick={() => onFilterChange({ opponent: o.opponent, difficulty: o.difficulty })}>
                        {opponentLabel(o)}
                    </button>
                ))}
            </div>
        )}

        {failed && data.length === 0 ? (
            <div className="lb-empty"><p>Couldn’t load the leaderboard.</p></div>
        ) : loading && data.length === 0 ? (
            <ol className="lb-list" aria-busy="true">
                {[0, 1, 2].map((i) => <li key={i} className="lb-row lb-skeleton"><span /><span /><span /></li>)}
            </ol>
        ) : data.length === 0 ? (
            <div className="lb-empty">
                <Trophy />
                <p><strong>No results yet.</strong></p>
                <p>Finish a game against {filterName} to claim the top spot.</p>
            </div>
        ) : (
            <ol className="lb-list">
                {data.slice(0, 10).map((entry, i) => {
                    const rate = winRate(entry);
                    const me = !!username && entry.username === username;
                    return (
                        <li key={entry.username} className={`lb-row ${me ? 'is-me' : ''}`}>
                            <span className={`lb-rank rank-${i + 1}`}>{i + 1}</span>
                            <Avatar name={entry.username} size={30} />
                            <div className="lb-name">
                                <span className="lb-username">
                                    <span className="lb-username-text">{entry.username}</span>
                                    {me && <span className="lb-you">You</span>}
                                    {(entry.current_streak ?? 0) >= STREAK_BADGE && (
                                        <span className="lb-streak" title={`${entry.current_streak} wins in a row (best ${entry.best_streak})`}>
                                            <Flame /> {entry.current_streak}
                                        </span>
                                    )}
                                </span>
                                <span className="lb-record">
                                    {entry.wins}W · {entry.losses}L · {entry.draws}D
                                </span>
                            </div>
                            <div className="lb-rate" title="Win rate">
                                <span>{Math.round(rate * 100)}%</span>
                                <span className="lb-bar"><span style={{ width: `${rate * 100}%` }} /></span>
                            </div>
                        </li>
                    );
                })}
            </ol>
        )}
        {footer && <div className="lb-footer">{footer}</div>}
    </section>
    );
};

export default Leaderboard;
