import React from 'react';
import { Link } from 'react-router-dom';
import SeatCard, { Token } from '../components/SeatCard';
import Leaderboard from '../components/Leaderboard';
import NameForm from '../components/NameForm';
import Toast from '../components/Toast';
import { ArrowLeft, Refresh } from '../components/Icons';
import Connect4Board from '../components/boards/Connect4Board';
import TicTacToeBoard from '../components/boards/TicTacToeBoard';
import { BoardProps } from '../components/boards/types';
import { useGameSession } from '../hooks/useGameSession';
import { AvailableGame, Side } from '../games';
import { GameState } from '../interfaces/interfaces';
import './GamePage.css';

const BOARDS: Record<string, React.FC<BoardProps>> = {
    connect4: Connect4Board,
    tictactoe: TicTacToeBoard,
};

interface GamePageProps {
    game: AvailableGame;
    username: string;
    setUsername: (name: string) => void;
}

const modeOf = (state: GameState, side: Side) => (side === 'X' ? state.mode1 : state.mode2);

const GamePage: React.FC<GamePageProps> = ({ game, username, setUsername }) => {
    const session = useGameSession(game, username);
    const { state, busy, currentMode } = session;
    const Board = BOARDS[game.id];

    const modeLabel = (mode: string) => game.modes.find((m) => m.mode === mode)?.label ?? mode;
    // In a human-vs-AI game, the human's side; otherwise null.
    const humanSide: Side | null = state && (state.mode1 === 'human') !== (state.mode2 === 'human')
        ? (state.mode1 === 'human' ? 'X' : 'O') : null;
    const thinking = !!state && busy && !state.done && currentMode !== 'human';

    const result = () => {
        if (!state?.done) return null;
        if (!state.winner) return { title: 'It’s a draw', sub: 'Nobody blinked. Go again?', tone: 'draw' };
        const winner = state.winner;
        if (humanSide) {
            return winner === humanSide
                ? { title: 'You win!', sub: `You beat ${modeLabel(modeOf(state, winner === 'X' ? 'O' : 'X'))}.`, tone: 'win' }
                : { title: `${modeLabel(modeOf(state, winner))} wins`, sub: 'Shake it off and try again.', tone: 'loss' };
        }
        return { title: `${game.sideLabels[winner]} wins!`, sub: 'Well played, both of you.', tone: 'win' };
    };
    const outcome = result();

    const statusText = () => {
        if (!state) return 'Setting up the board…';
        const side = game.sideLabels[state.current_player];
        if (thinking) return `${modeLabel(currentMode)} is thinking…`;
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
                playerName={humanSide === side ? username || 'You' : undefined}
                disabled={!state || busy}
                onModeChange={(m) => session.changeMode(player, m)}
                onDifficultyChange={(d) => session.changeDifficulty(player, d)}
            />
        );
    };

    const pageStyle = {
        '--x-color': game.sideColors.X,
        '--o-color': game.sideColors.O,
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
                                    interactive={session.humanToMove}
                                    onMove={session.move}
                                />
                            ) : <div className="board-loading" aria-hidden="true"><span className="spinner" /></div>}
                        </div>
                    </div>
                    <div className="table-seat table-seat-o">{seat('O')}</div>
                </div>

                <div className="play-footer">
                    <span className="play-hint">
                        {sideNameOf('X')} moves first. Switch either side between a human and an AI at any time.
                    </span>
                    <button type="button" className="btn btn-outline btn-sm" onClick={session.reset} disabled={!state || busy}>
                        <Refresh /> Restart
                    </button>
                </div>
            </section>

            <Leaderboard
                gameName={game.name}
                data={session.leaderboard}
                username={username}
                loading={session.leaderboardLoading}
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
