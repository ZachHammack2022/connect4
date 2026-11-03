import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Token } from '../components/SeatCard';
import MoveList from '../components/MoveList';
import Toast from '../components/Toast';
import { ArrowLeft, Copy, Refresh, Share } from '../components/Icons';
import { BOARDS } from '../components/boards';
import { useOnlineGame } from '../hooks/useOnlineGame';
import { useGameSounds } from '../hooks/useGameSounds';
import { findGame, Side } from '../games';
import { OnlineSeat } from '../interfaces/interfaces';
import './GamePage.css';
import './OnlineGamePage.css';

interface OnlineGamePageProps {
    username: string;
    muted: boolean;
}

const SeatPanel: React.FC<{
    side: Side; label: string; seat: OnlineSeat; you: boolean; active: boolean; won: boolean;
}> = ({ side, label, seat, you, active, won }) => (
    <section className={['seat', `seat-${side}`, 'online-seat', active ? 'is-active' : '', won ? 'is-winner' : ''].filter(Boolean).join(' ')}
        aria-label={`${label} player`}>
        <header className="seat-head">
            <Token side={side} />
            <div className="seat-names">
                <span className="seat-side">{label}{you && <span className="lb-you">You</span>}</span>
                <span className="seat-who">{seat.taken ? seat.name : 'Waiting for a friend…'}</span>
            </div>
            {seat.taken && (
                <span className={`presence ${seat.connected ? 'online' : 'away'}`}
                    title={seat.connected ? 'Connected' : 'Not connected right now'}>
                    {seat.connected ? 'Online' : 'Away'}
                </span>
            )}
        </header>
        <span className="seat-badge" aria-live="polite">{won ? 'Winner' : active ? 'To move' : ''}</span>
    </section>
);

const InvitePanel: React.FC<{ url: string }> = ({ url }) => {
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch { /* clipboard blocked: the link is still selectable */ }
    };
    const canShare = typeof navigator.share === 'function';
    return (
        <div className="invite">
            <div>
                <strong>Invite a friend</strong>
                <p>Send them this link. The game starts as soon as they open it.</p>
            </div>
            <div className="invite-row">
                <input className="input" readOnly value={url} aria-label="Invite link" onFocus={(e) => e.target.select()} />
                <button type="button" className="btn btn-primary" onClick={copy}>
                    <Copy /> {copied ? 'Copied!' : 'Copy link'}
                </button>
                {canShare && (
                    <button type="button" className="btn btn-outline" aria-label="Share"
                        onClick={() => navigator.share({ title: 'Play me in Game Room', url }).catch(() => {})}>
                        <Share />
                    </button>
                )}
            </div>
        </div>
    );
};

const OnlineGamePage: React.FC<OnlineGamePageProps> = ({ username, muted }) => {
    const { gameId = '' } = useParams();
    const online = useOnlineGame(gameId, username);
    const { state, you, seats } = online;
    const game = state ? findGame(state.game_type) : undefined;
    useGameSounds(state, you, muted);

    if (online.missing) {
        return (
            <div className="container game-page">
                <div className="card online-missing">
                    <h1>Game not found</h1>
                    <p>This invite has expired or the link is wrong. Start a new game and send a fresh link.</p>
                    <Link to="/" className="btn btn-primary">Back to all games</Link>
                </div>
            </div>
        );
    }
    if (!state || !game || !seats) {
        return (
            <div className="container game-page">
                <div className="board-loading"><span className="spinner" /></div>
                <Toast message={online.error} onClose={online.clearError} />
            </div>
        );
    }

    const Board = BOARDS[game.id];
    const opponent: Side | null = you ? (you === 'X' ? 'O' : 'X') : null;
    const nameOf = (side: Side) => seats[side].name || game.sideLabels[side];
    const inviteUrl = `${window.location.origin}/play/${gameId}`;

    const status = () => {
        if (state.done) return null;
        if (!online.bothSeated) return you ? 'Waiting for your friend to join…' : 'Waiting for players…';
        if (online.busy) return 'Sending your move…';
        if (you === state.current_player) return 'Your move';
        if (you) return `${nameOf(state.current_player)} is thinking…`;
        return `${nameOf(state.current_player)} (${game.sideLabels[state.current_player]}) to move`;
    };
    const result = () => {
        if (!state.winner) return { title: 'It’s a draw', tone: 'draw' };
        if (you) return state.winner === you
            ? { title: 'You win!', tone: 'win' }
            : { title: `${nameOf(state.winner)} wins`, tone: 'loss' };
        return { title: `${nameOf(state.winner)} wins`, tone: 'win' };
    };
    const outcome = state.done ? result() : null;
    const waitingOnThem = !state.done && online.bothSeated && !!you && you !== state.current_player;

    const pageStyle = {
        '--x-color': game.sideColors.X,
        '--o-color': game.sideColors.O,
        '--x-accent': game.accentColors?.X ?? game.sideColors.X,
        '--o-accent': game.accentColors?.O ?? game.sideColors.O,
        '--tint': game.tint,
    } as React.CSSProperties;

    return (
        <div className="container game-page" style={pageStyle}>
            <div className="game-top">
                <Link to="/" className="icon-btn back-link" aria-label="All games" title="All games"><ArrowLeft /></Link>
                <div className="game-title">
                    <h1>{game.name} <span className="online-tag">Online</span></h1>
                    <p>{you ? `You play ${game.sideLabels[you]}.` : 'You’re watching this game.'} {opponent && seats[opponent].taken
                        ? `Your opponent is ${nameOf(opponent)}.` : ''}</p>
                </div>
            </div>

            {you && !online.bothSeated && <InvitePanel url={inviteUrl} />}

            <section className="card play-area" aria-label={`${game.name} online game`}>
                <div className="seats online-seats">
                    {(['X', 'O'] as Side[]).map((side) => (
                        <SeatPanel key={side} side={side} label={game.sideLabels[side]} seat={seats[side]}
                            you={you === side} won={state.done && state.winner === side}
                            active={!state.done && online.bothSeated && state.current_player === side} />
                    ))}
                </div>

                <div className={`status-bar ${outcome ? `is-over tone-${outcome.tone}` : ''}`} aria-live="polite">
                    {outcome ? (
                        <>
                            <div className="status-result">
                                {state.winner && <Token side={state.winner} />}
                                <div>
                                    <strong>{outcome.title}</strong>
                                    <span>{you ? 'Rematch? You’ll swap sides.' : 'Waiting for a rematch…'}</span>
                                </div>
                            </div>
                            {you && (
                                <button type="button" className="btn btn-primary" onClick={online.rematch} disabled={online.busy}>
                                    <Refresh /> Rematch
                                </button>
                            )}
                        </>
                    ) : (
                        <span className="status-turn">
                            {waitingOnThem || !online.bothSeated ? <span className="spinner" /> : <Token side={state.current_player} />}
                            {status()}
                        </span>
                    )}
                </div>

                <div className="board-stage">
                    <Board
                        board={state.board}
                        rows={state.rows}
                        cols={state.cols}
                        currentPlayer={state.current_player}
                        winningCells={state.winning_cells}
                        legalMoves={state.legal_moves ?? []}
                        lastCell={state.history?.length ? state.history[state.history.length - 1].cell : null}
                        interactive={online.yourTurn}
                        onMove={online.move}
                    />
                </div>

                <MoveList game={game} history={state.history ?? []} rows={state.rows} />

                <div className="play-footer">
                    <span className="play-hint">
                        Online games are just for fun: they don’t count on the leaderboard.
                    </span>
                    <Link to={game.path} className="btn btn-ghost btn-sm">Play the AI instead</Link>
                </div>
            </section>
            <Toast message={online.error} onClose={online.clearError} />
        </div>
    );
};

export default OnlineGamePage;
