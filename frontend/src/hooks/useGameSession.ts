import { useCallback, useEffect, useRef, useState } from 'react';
import * as api from './useApi';
import { getErrorMessage, isNotFound } from './useApi';
import { Difficulty, GameState, LeaderboardEntry, Outcome } from '../interfaces/interfaces';
import { AvailableGame } from '../games';

// Each browser tab keeps one game per game type; sessionStorage survives a refresh.
const storageKey = (gameType: string) => `gameId:${gameType}`;
const loadGameId = (gameType: string): string | null => {
    try { return sessionStorage.getItem(storageKey(gameType)); } catch { return null; }
};
const saveGameId = (gameType: string, gameId: string) => {
    try { sessionStorage.setItem(storageKey(gameType), gameId); } catch { /* storage unavailable */ }
};

/** Everything a game page needs: the game state from the server, actions to
 *  play it, and the game's leaderboard. Results of human-vs-AI games are
 *  submitted to the leaderboard once, from the human's side. */
export const useGameSession = (game: AvailableGame, username: string) => {
    const gameType = game.id;
    const [state, setState] = useState<GameState | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [leaderboardLoading, setLeaderboardLoading] = useState(true);
    const clearError = useCallback(() => setError(null), []);

    const gameIdRef = useRef<string | null>(null);
    const busyRef = useRef(false);
    // Whether the current game has already finished, so a result is only
    // submitted once (e.g. not again when switching modes after the game).
    const gameOverRef = useRef(false);
    // Read when a game ends, which may be inside an older closure.
    const usernameRef = useRef(username);
    usernameRef.current = username;
    // Each side remembers its last difficulty so switching AI keeps it.
    const lastDifficulty = useRef<Record<number, Difficulty>>({ 1: 'medium', 2: 'medium' });

    const submitResult = async (outcome: Outcome) => {
        if (!usernameRef.current) return;
        try {
            setLeaderboard(await api.submitGameResult(usernameRef.current, gameType, outcome));
        } catch (err) {
            setError(`Error while submitting game result: ${getErrorMessage(err)}`);
        }
    };

    const updateGame = (next: GameState) => {
        gameIdRef.current = next.game_id;
        saveGameId(gameType, next.game_id);
        if (next.difficulty1) lastDifficulty.current[1] = next.difficulty1;
        if (next.difficulty2) lastDifficulty.current[2] = next.difficulty2;
        setState(next);

        const justFinished = next.done && !gameOverRef.current;
        gameOverRef.current = next.done;
        if (!justFinished) return;
        // Only human-vs-AI games count towards the leaderboard.
        const human1 = next.mode1 === 'human';
        const human2 = next.mode2 === 'human';
        if (human1 === human2) return;
        // Games where a human took moves back are practice: not recorded.
        if (next.assisted) return;
        const humanSide = human1 ? 'X' : 'O';
        submitResult(!next.winner ? 'draw' : next.winner === humanSide ? 'win' : 'loss');
    };

    const startNewGame = async () => {
        gameOverRef.current = false;
        updateGame(await api.createGame(gameType));
    };

    // Runs a request against the current game. If the server no longer knows
    // the game (it expired), start a fresh one. Ignores calls while busy.
    const withGame = async (action: string, request: (gameId: string) => Promise<GameState>) => {
        if (busyRef.current) return;
        busyRef.current = true;
        setBusy(true);
        try {
            if (!gameIdRef.current) {
                await startNewGame();
            }
            updateGame(await request(gameIdRef.current as string));
        } catch (err) {
            if (isNotFound(err)) {
                try {
                    await startNewGame();
                    setError('Your game expired, so a new one was started.');
                } catch (createError) {
                    setError(`Error while starting a new game: ${getErrorMessage(createError)}`);
                }
            } else {
                setError(`Error while ${action}: ${getErrorMessage(err)}`);
                // Undo any optimistic update by reloading the real state.
                try {
                    if (gameIdRef.current) updateGame(await api.fetchGameState(gameIdRef.current));
                } catch { /* keep the error already shown */ }
            }
        } finally {
            busyRef.current = false;
            setBusy(false);
        }
    };

    const currentMode = state ? (state.current_player === 'X' ? state.mode1 : state.mode2) : 'human';
    const humanToMove = !!state && !state.done && !busy && currentMode === 'human';

    const move = async (moveIndex: number) => {
        if (!state || !humanToMove) return;
        if (state.legal_moves && !state.legal_moves.includes(moveIndex)) return;
        const piece = state.current_player === 'X' ? -1 : 1;
        const board = game.applyMove(state.board, moveIndex, state.cols, piece);
        if (!board) return;  // full column / taken cell: nothing to do
        // Show the human's move straight away and hand the turn over, rather
        // than waiting for the response (which includes any AI reply).
        const cellIndex = board.findIndex((cell, i) => cell !== 0 && state.board[i] === 0);
        const cell: [number, number] | null = cellIndex >= 0 ? [Math.floor(cellIndex / state.cols), cellIndex % state.cols] : null;
        setState({
            ...state, board, current_player: state.current_player === 'X' ? 'O' : 'X', legal_moves: [], passed: null,
            history: [...(state.history ?? []), { player: state.current_player, move: moveIndex, cell }],
        });
        await withGame('making a move', (gameId) => api.makeMove(gameId, moveIndex));
    };

    const changeMode = (player: number, mode: string, difficulty?: Difficulty) =>
        withGame(`changing mode for player ${player}`, (gameId) =>
            api.changeMode(gameId, mode, player, difficulty ?? lastDifficulty.current[player]));

    const changeDifficulty = (player: number, difficulty: Difficulty) => {
        if (!state) return;
        return changeMode(player, player === 1 ? state.mode1 : state.mode2, difficulty);
    };

    // Whether there is a human move to take back (the server has the final say).
    const humanSides = state ? (['X', 'O'] as const).filter((side) => (side === 'X' ? state.mode1 : state.mode2) === 'human') : [];
    const canUndo = !!state && !state.done && !busy
        && (state.history ?? []).some((m) => (humanSides as readonly string[]).includes(m.player));

    const undo = async () => {
        if (!canUndo) return;
        await withGame('undoing a move', api.undoMove);
    };

    // The cell a hint suggested, shown briefly on the board.
    const [hintCell, setHintCell] = useState<[number, number] | null>(null);
    const hintTimer = useRef<number | undefined>(undefined);
    const showHint = (cell: [number, number] | null) => {
        window.clearTimeout(hintTimer.current);
        setHintCell(cell);
        if (cell) hintTimer.current = window.setTimeout(() => setHintCell(null), 3000);
    };
    useEffect(() => () => window.clearTimeout(hintTimer.current), []);
    // Any change to the board (a move, undo, reset) clears the hint.
    const boardKey = state?.board.join(',');
    useEffect(() => { showHint(null); }, [boardKey]);

    const [hinting, setHinting] = useState(false);
    const requestHint = async () => {
        if (!humanToMove) return;
        setHinting(true);
        await withGame('getting a hint', async (gameId) => {
            const next = await api.getHint(gameId);
            const piece = next.current_player === 'X' ? -1 : 1;
            const after = game.applyMove(next.board, next.hint, next.cols, piece);
            // For Connect 4 the move is a column; find where the disc would land.
            const index = after ? after.findIndex((cell, i) => cell !== 0 && next.board[i] === 0) : -1;
            showHint(index >= 0 ? [Math.floor(index / next.cols), index % next.cols] : null);
            return next;
        });
        setHinting(false);
    };

    const reset = async () => {
        gameOverRef.current = false;
        await withGame('resetting the game', api.resetGame);
    };

    // Load (or start) this tab's game and the leaderboard when the game type changes.
    useEffect(() => {
        let cancelled = false;
        gameIdRef.current = null;
        gameOverRef.current = false;
        setState(null);
        setLeaderboard([]);
        setLeaderboardLoading(true);

        api.fetchLeaderboard(gameType)
            .then((rows) => { if (!cancelled) setLeaderboard(rows); })
            .catch(() => { if (!cancelled) setError('Couldn’t load the leaderboard.'); })
            .finally(() => { if (!cancelled) setLeaderboardLoading(false); });

        const init = async () => {
            const savedId = loadGameId(gameType);
            if (savedId) {
                try {
                    const saved = await api.fetchGameState(savedId);
                    if (cancelled) return;
                    if (saved.game_type === gameType) {
                        gameOverRef.current = saved.done;  // resuming: don't re-submit a finished game
                        updateGame(saved);
                        return;
                    }
                } catch (err) {
                    if (!isNotFound(err)) {
                        if (!cancelled) setError(`Error while fetching game state: ${getErrorMessage(err)}`);
                        return;
                    }
                    // Saved game is gone; fall through and start a new one.
                }
            }
            try {
                const fresh = await api.createGame(gameType);
                if (!cancelled) updateGame(fresh);
            } catch (err) {
                if (!cancelled) setError(`Error while starting a new game: ${getErrorMessage(err)}`);
            }
        };
        init();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameType]);

    return {
        state, busy, error, clearError, leaderboard, leaderboardLoading,
        currentMode, humanToMove, move, changeMode, changeDifficulty, reset, undo, canUndo, requestHint, hintCell, hinting,
    };
};
