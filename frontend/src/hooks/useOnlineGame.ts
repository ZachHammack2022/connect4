import { useCallback, useEffect, useRef, useState } from 'react';
import * as api from './useApi';
import { getErrorMessage, isNotFound } from './useApi';
import { GameState } from '../interfaces/interfaces';
import { findGame } from '../games';

// The seat token for each online game this browser has joined.
const tokenKey = (gameId: string) => `seat:${gameId}`;
const loadToken = (gameId: string) => {
    try { return localStorage.getItem(tokenKey(gameId)); } catch { return null; }
};
const saveToken = (gameId: string, token: string) => {
    try { localStorage.setItem(tokenKey(gameId), token); } catch { /* storage unavailable */ }
};
export const rememberSeat = saveToken;

const POLL_MS = 1000;

/** An online game shared between browsers: join (or rejoin) on load, then
 *  poll for the other player's moves. */
export const useOnlineGame = (gameId: string, username: string) => {
    const [state, setState] = useState<GameState | null>(null);
    const [missing, setMissing] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const clearError = useCallback(() => setError(null), []);
    const token = useRef<string | null>(loadToken(gameId));
    // Bumped by every move/rematch, so a poll that started earlier can't
    // overwrite the newer state it returns.
    const version = useRef(0);

    useEffect(() => {
        let cancelled = false;
        let timer: number | undefined;
        let polling = false;

        const poll = async () => {
            if (polling || document.hidden) return;
            polling = true;
            const started = version.current;
            try {
                const next = await api.fetchGameState(gameId, token.current);
                if (!cancelled && started === version.current) setState(next);
            } catch (err) {
                if (!cancelled && isNotFound(err)) setMissing(true);
            } finally {
                polling = false;
            }
        };

        (async () => {
            try {
                const joined = await api.joinGame(gameId, username || 'Guest', token.current);
                if (cancelled) return;
                if (joined.seat_token) {
                    token.current = joined.seat_token;
                    saveToken(gameId, joined.seat_token);
                }
                setState(joined);
                timer = window.setInterval(poll, POLL_MS);
            } catch (err) {
                if (cancelled) return;
                if (isNotFound(err)) setMissing(true);
                else setError(`Couldn’t join the game: ${getErrorMessage(err)}`);
            }
        })();
        return () => { cancelled = true; window.clearInterval(timer); };
        // Join once per game; a name change later doesn't need a rejoin.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameId]);

    const you = state?.online?.you ?? null;
    const seats = state?.online?.seats;
    const bothSeated = !!seats && seats.X.taken && seats.O.taken;
    const yourTurn = !!state && !state.done && !busy && bothSeated && you === state.current_player;

    const act = async (label: string, request: () => Promise<GameState>, optimistic?: GameState) => {
        version.current += 1;
        setBusy(true);
        if (optimistic) setState(optimistic);
        try {
            const next = await request();
            version.current += 1;
            setState(next);
        } catch (err) {
            setError(`Error while ${label}: ${getErrorMessage(err)}`);
            try { setState(await api.fetchGameState(gameId, token.current)); } catch { /* keep the error shown */ }
        } finally {
            setBusy(false);
        }
    };

    const move = async (moveIndex: number) => {
        if (!state || !yourTurn || !state.legal_moves.includes(moveIndex)) return;
        const game = findGame(state.game_type);
        const piece = state.current_player === 'X' ? -1 : 1;
        const board = game?.applyMove(state.board, moveIndex, state.cols, piece);
        const optimistic = board ? {
            ...state, board, legal_moves: [], current_player: state.current_player === 'X' ? 'O' as const : 'X' as const,
        } : undefined;
        await act('making a move', () => api.makeMove(gameId, moveIndex, token.current), optimistic);
    };

    const rematch = () => act('starting a rematch', () => api.resetGame(gameId, token.current));

    return { state, missing, busy, error, clearError, you, seats, bothSeated, yourTurn, move, rematch };
};
