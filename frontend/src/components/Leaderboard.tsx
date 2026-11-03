import React from 'react';
import { LeaderboardEntry } from '../interfaces/interfaces';
import { Avatar } from './NameForm';
import { Trophy } from './Icons';
import './Leaderboard.css';

interface LeaderboardProps {
    gameName: string;
    data: LeaderboardEntry[];
    username: string;
    loading: boolean;
    footer?: React.ReactNode;
}

const winRate = ({ wins, losses, draws }: LeaderboardEntry) => {
    const total = wins + losses + draws;
    return total > 0 ? wins / total : 0;
};

const Leaderboard: React.FC<LeaderboardProps> = ({ gameName, data, username, loading, footer }) => (
    <section className="card leaderboard" aria-labelledby="leaderboard-title">
        <header className="lb-head">
            <span className="lb-icon"><Trophy /></span>
            <div>
                <h2 id="leaderboard-title">Leaderboard</h2>
                <p>{gameName} · games vs the AI</p>
            </div>
        </header>

        {loading && data.length === 0 ? (
            <ol className="lb-list" aria-busy="true">
                {[0, 1, 2].map((i) => <li key={i} className="lb-row lb-skeleton"><span /><span /><span /></li>)}
            </ol>
        ) : data.length === 0 ? (
            <div className="lb-empty">
                <Trophy />
                <p><strong>No results yet.</strong></p>
                <p>Finish a game against the AI to claim the top spot.</p>
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
                                    {entry.username}{me && <span className="lb-you">You</span>}
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

export default Leaderboard;
