import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import SeatCard, { Token } from '../components/SeatCard';
import Leaderboard from '../components/Leaderboard';
import NameForm from '../components/NameForm';
import Toast from '../components/Toast';
import { ArrowLeft, Bulb, Keyboard, Refresh, Undo } from '../components/Icons';
import ShortcutsPopover from '../components/ShortcutsPopover';
import { sounds } from '../sound';
import MoveList from '../components/MoveList';
import Connect4Board from '../components/boards/Connect4Board';
import TicTacToeBoard from '../components/boards/TicTacToeBoard';
import ReversiBoard from '../components/boards/ReversiBoard';
import GomokuBoard from '../components/boards/GomokuBoard';
import { BoardProps } from '../components/boards/types';
import { useGameSession } from '../hooks/useGameSession';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { AvailableGame, Side } from '../games';
import { GameState } from '../interfaces/interfaces';
import './GamePage.css';

const BOARDS: Record<string, React.FC<BoardProps>> = {
    connect4: Connect4Board,
    tictactoe: TicTacToeBoard,
    reversi: ReversiBoard,
    gomoku: GomokuBoard,
};

interface GamePageProps {
    game: AvailableGame;
    username: string;
    setUsername: (name: string) => void;
    muted: boolean;
    onToggleMuted: () => void;
}

const modeOf = (state: GameState, side: Side) => (side === 'X' ? state.mode1 : state.mode2);

const GamePage: React.FC<GamePageProps> = ({ game, username, setUsername, muted, onToggleMuted }) => {
    const leaderboard = useLeaderboard(game.id);
    const session = useGameSession(game, username, leaderboard.refresh);
    const { state, busy, currentMode } = session;
    const Board = BOARDS[game.id];

    const modeLabel = (mode: string) => game.modes.find((m) => m.mode === mode)?.label ?? mode;
    // In a human-vs-AI game, the human's side; otherwise null.
    const humanSide: Side | null = state && (state.mode1 === 'human') !== (state.mode2 === 'human')
        ? (state.mode1 === 'human' ? 'X' : 'O') : null;
    const thinking = !!state && busy && !state.done && currentMode !== 'human';

    const result = () => {
        if (!state?.done) return null;
        if (!state.winner) return { title: 'It’s a draw', sub: `Nobody blinked.${scoreLine}`, tone: 'draw' };
        const winner = state.winner;
        if (humanSide) {
            return winner === humanSide
                ? { title: 'You win!', sub: `You beat ${modeLabel(modeOf(state, winner === 'X' ? 'O' : 'X'))}.${scoreLine}`, tone: 'win' }
                : { title: `${modeLabel(modeOf(state, winner))} wins`, sub: `Shake it off and try again.${scoreLine}`, tone: 'loss' };
        }
        return { title: `${game.sideLabels[winner]} wins!`, sub: `Well played, both of you.${scoreLine}`, tone: 'win' };
    };
    const scores = state && game.score ? game.score(state.board) : null;
    const scoreLine = scores ? ` Final score ${scores.X}–${scores.O}.` : '';
    const outcome = result();

    const statusText = () => {
        if (!state) return 'Setting up the board…';
        const side = game.sideLabels[state.current_player];
        if (thinking) return `${modeLabel(currentMode)} is thinking…`;
        if (state.passed) {
            const mover = humanSide === state.current_player ? 'you go again' : `${side} goes again`;
            return `${game.sideLabels[state.passed]} has no moves, ${mover}`;
        }
        if (currentMode === 'human') {
            return humanSide === state.current_player ? 'Your move' : `${side} to move`;
        }
        return `${side} (${modeLabel(currentMode)}) to move`;
    };

    const seat = (side: Side) => {
        const player = side === 'X' ? 1 : 2;
        const mode = state ? modeOf(state, side) : 'human';
        return (
            <SeatCard
                side={side}
                label={game.sideLabels[side]}
                modes={game.modes}
                mode={mode}
                difficulty={state ? (side === 'X' ? state.difficulty1 : state.difficulty2) : null}
                hasDifficulty={game.difficultyModes.includes(mode)}
                active={!!state && !state.done && state.current_player === side}
                thinking={thinking && state?.current_player === side}
                won={!!state?.done && state.winner === side}
                score={scores ? scores[side] : undefined}
                playerName={humanSide === side ? username || 'You' : undefined}
                disabled={!state || busy}
                onModeChange={(m) => session.changeMode(player, m)}
                onDifficultyChange={(d) => session.changeDifficulty(player, d)}
            />
        );
    };

    // Restart asks first if a game is under way.
    const restart = () => {
        if (state && !state.done && (state.history?.length ?? 0) > 0
            && !window.confirm('Restart? The current game will be lost.')) return;
        session.reset();
    };

    const [showShortcuts, setShowShortcuts] = useState(false);

    // Keyboard shortcuts (ignored while typing in a field). Kept in a ref so
    // the listener always sees the latest state without re-subscribing.
    const keyHandler = useRef<(event: KeyboardEvent) => void>(() => {});
    keyHandler.current = (event: KeyboardEvent) => {
        const target = event.target as HTMLElement | null;
        if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
        const key = event.key.toLowerCase();
        if ((event.ctrlKey || event.metaKey) && !event.shiftKey && key === 'z') {
            event.preventDefault();
            session.undo();
            return;
        }
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        if (key === 'h') session.requestHint();
        else if (key === 'r') restart();
        else if (key === 'm') onToggleMuted();
        else if (key === '?') setShowShortcuts((open) => !open);
        else if (key === 'escape') setShowShortcuts(false);
        else if (game.keyMoves && key in game.keyMoves) session.move(game.keyMoves[key]);
    };
    useEffect(() => {
        const onKey = (event: KeyboardEvent) => keyHandler.current(event);
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    // Sounds: a click for each new piece, and a jingle when the game ends.
    const heard = useRef<{ moves: number; done: boolean } | null>(null);
    useEffect(() => {
        if (!state) return;
        const moves = state.history?.length ?? 0;
        const previous = heard.current;
        heard.current = { moves, done: state.done };
        // Stay quiet on the first load, and when moves are taken back.
        if (!previous || muted || moves < previous.moves) return;
        if (moves > previous.moves) {
            const last = state.history[moves - 1];
            sounds.place(last.player);
        }
        if (state.done && !previous.done) {
            const tune = !state.winner ? sounds.draw
                : humanSide && state.winner !== humanSide ? sounds.loss : sounds.win;
            window.setTimeout(tune, 180);
        }
    }, [state, muted, humanSide]);

    const pageStyle = {
        '--x-color': game.sideColors.X,
        '--o-color': game.sideColors.O,
        '--x-accent': game.accentColors?.X ?? game.sideColors.X,
        '--o-accent': game.accentColors?.O ?? game.sideColors.O,
        '--tint': game.tint,
    } as React.CSSProperties;

    const sideNameOf = (side: Side) => (game.sideLabels[side] === side ? side : `${game.sideLabels[side]} (${side})`);

    return (
        <div className="container game-page" style={pageStyle}>
            <div className="game-top">
                <Link to="/" className="icon-btn back-link" aria-label="All games" title="All games"><ArrowLeft /></Link>
                <div className="game-title">
                    <h1>{game.name}</h1>
                    <p>{game.tagline}</p>
                </div>
            </div>

            <section className="card play-area" aria-label={`${game.name} game`}>
                <div className="table">
                    <div className="table-seat table-seat-x">{seat('X')}</div>
                    <div className="table-center">
                        <div className={`status-bar ${outcome ? `is-over tone-${outcome.tone}` : ''}`} aria-live="polite">
                            {outcome ? (
                                <>
                                    <div className="status-result">
                                        {state?.winner && <Token side={state.winner} />}
                                        <div>
                                            <strong>{outcome.title}</strong>
                                            <span>{outcome.sub}</span>
                                        </div>
                                    </div>
                                    <button type="button" className="btn btn-primary" onClick={session.reset} disabled={busy}>
                                        <Refresh /> Play again
                                    </button>
                                </>
                            ) : (
                                <span className="status-turn">
                                    {state && (thinking ? <span className="spinner" /> : <Token side={state.current_player} />)}
                                    {statusText()}
                                </span>
                            )}
                        </div>

                        <div className="board-stage">
                            {state ? (
                                <Board
                                    board={state.board}
                                    rows={state.rows}
                                    cols={state.cols}
                                    currentPlayer={state.current_player}
                                    winningCells={state.winning_cells}
                                    legalMoves={state.legal_moves ?? []}
                                    lastCell={state.history?.length ? state.history[state.history.length - 1].cell : null}
                                    hintCell={session.hintCell}
                                    interactive={session.humanToMove}
                                    onMove={session.move}
                                />
                            ) : <div className="board-loading" aria-hidden="true"><span className="spinner" /></div>}
                        </div>
                    </div>
                    <div className="table-seat table-seat-o">{seat('O')}</div>
                </div>

                {state && <MoveList game={game} history={state.history ?? []} rows={state.rows} />}

                <div className="play-footer">
                    <span className="play-hint">
                        {state?.assisted && humanSide
                            ? <span className="chip chip-practice">Practice game: you used undo or a hint, so this one won’t count</span>
                            : <>{sideNameOf('X')} moves first. Switch either side between a human and an AI at any time.</>}
                    </span>
                    <div className="play-actions">
                        <button type="button" className="btn btn-ghost btn-sm" onClick={session.requestHint}
                            disabled={!session.humanToMove} title="Suggest a move (H)" aria-keyshortcuts="H">
                            {session.hinting ? <span className="spinner" /> : <Bulb />} Hint
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={session.undo} disabled={!session.canUndo}
                            title="Undo (Ctrl+Z)" aria-keyshortcuts="Control+Z Meta+Z">
                            <Undo /> Undo
                        </button>
                        <button type="button" className="btn btn-outline btn-sm" onClick={restart} disabled={!state || busy}
                            title="Restart (R)" aria-keyshortcuts="R">
                            <Refresh /> Restart
                        </button>
                        <div className="shortcuts-anchor">
                            <button type="button" className="icon-btn shortcuts-btn" onClick={() => setShowShortcuts((open) => !open)}
                                aria-label="Keyboard shortcuts" aria-expanded={showShortcuts} title="Keyboard shortcuts (?)">
                                <Keyboard />
                            </button>
                            {showShortcuts && <ShortcutsPopover game={game} onClose={() => setShowShortcuts(false)} />}
                        </div>
                    </div>
                </div>
            </section>

            <Leaderboard
                game={game}
                data={leaderboard.rows}
                username={username}
                loading={leaderboard.loading}
                failed={leaderboard.error}
                opponents={leaderboard.opponents}
                filter={leaderboard.filter}
                onFilterChange={leaderboard.setFilter}
                footer={username ? (
                    <span>Results are saved as <strong>{username}</strong> when you play the AI.</span>
                ) : (
                    <>
                        <span>Add a name to put your results on the board. No account needed.</span>
                        <NameForm username={username} setUsername={setUsername} compact />
                    </>
                )}
            />
            <Toast message={session.error} onClose={session.clearError} />
        </div>
    );
};

export default GamePage;
