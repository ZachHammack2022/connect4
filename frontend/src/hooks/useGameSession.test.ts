import { act, renderHook, waitFor } from '@testing-library/react';
import { useGameSession } from './useGameSession';
import { findGame } from '../games';
import { GameState } from '../interfaces/interfaces';
import * as api from './useApi';

jest.mock('./useApi', () => ({
    createGame: jest.fn(),
    fetchGameState: jest.fn(),
    makeMove: jest.fn(),
    changeMode: jest.fn(),
    resetGame: jest.fn(),
    undoMove: jest.fn(),
    getHint: jest.fn(),
    submitGameResult: jest.fn(),
    getErrorMessage: (error: { message?: string }) => error?.message ?? String(error),
    isNotFound: (error: { response?: { status?: number } }) => error?.response?.status === 404,
}));
const mocked = api as jest.Mocked<typeof api>;

const ttt = findGame('tictactoe')!;

const gameState = (overrides: Partial<GameState> = {}): GameState => ({
    game_id: 'g1', game_type: 'tictactoe', rows: 3, cols: 3, modes: ['human', 'random', 'minimax'],
    board: Array(9).fill(0), current_player: 'X', done: false, winner: null,
    mode1: 'human', mode2: 'minimax', difficulty1: null, difficulty2: 'hard',
    winning_cells: [], legal_moves: [0, 1, 2, 3, 4, 5, 6, 7, 8], passed: null, history: [], assisted: false,
    ...overrides,
});

const notFound = Object.assign(new Error('Not found'), { response: { status: 404 } });

beforeEach(() => {
    jest.resetAllMocks();
    sessionStorage.clear();
    mocked.createGame.mockResolvedValue(gameState());
    mocked.submitGameResult.mockResolvedValue(undefined);
});

const start = async (username = 'ann', onRecorded?: () => void) => {
    const hook = renderHook(() => useGameSession(ttt, username, onRecorded));
    await waitFor(() => expect(hook.result.current.state).not.toBeNull());
    return hook;
};

it('starts a new game and remembers it for this tab', async () => {
    const { result } = await start();
    expect(mocked.createGame).toHaveBeenCalledWith('tictactoe');
    expect(result.current.humanToMove).toBe(true);
    expect(sessionStorage.getItem('gameId:tictactoe')).toBe('g1');
});

it('resumes the saved game instead of starting another', async () => {
    sessionStorage.setItem('gameId:tictactoe', 'saved');
    mocked.fetchGameState.mockResolvedValue(gameState({ game_id: 'saved' }));
    const { result } = await start();
    expect(mocked.createGame).not.toHaveBeenCalled();
    expect(result.current.state?.game_id).toBe('saved');
});

it('rolls back an optimistic move when the server rejects it', async () => {
    const { result } = await start();
    mocked.makeMove.mockRejectedValue(new Error('Invalid move.'));
    mocked.fetchGameState.mockResolvedValue(gameState());
    await act(() => result.current.move(4));
    expect(result.current.state?.board[4]).toBe(0);
    expect(result.current.error).toMatch(/Invalid move/);
});

it('submits a finished game against the AI once, with the opponent', async () => {
    const onRecorded = jest.fn();
    const { result } = await start('ann', onRecorded);
    const won = gameState({ done: true, winner: 'X', board: [-1, -1, -1, 1, 1, 0, 0, 0, 0], legal_moves: [] });
    mocked.makeMove.mockResolvedValue(won);
    await act(() => result.current.move(2));
    await waitFor(() => expect(onRecorded).toHaveBeenCalled());
    expect(mocked.submitGameResult).toHaveBeenCalledWith('ann', 'tictactoe', 'win', 'minimax', 'hard');

    // Changing modes after the game doesn't submit it again.
    mocked.changeMode.mockResolvedValue({ ...won, mode2: 'random', difficulty2: null });
    await act(() => result.current.changeMode(2, 'random'));
    expect(mocked.submitGameResult).toHaveBeenCalledTimes(1);
});

it('does not submit practice games', async () => {
    const { result } = await start();
    mocked.makeMove.mockResolvedValue(gameState({ done: true, winner: 'O', assisted: true }));
    await act(() => result.current.move(0));
    expect(result.current.state?.done).toBe(true);
    expect(mocked.submitGameResult).not.toHaveBeenCalled();
});

it('does not submit games without a name', async () => {
    const { result } = await start('');
    mocked.makeMove.mockResolvedValue(gameState({ done: true, winner: 'O' }));
    await act(() => result.current.move(0));
    expect(result.current.state?.done).toBe(true);
    expect(mocked.submitGameResult).not.toHaveBeenCalled();
});

it('starts a fresh game when the server has forgotten this one', async () => {
    const { result } = await start();
    mocked.makeMove.mockRejectedValue(notFound);
    mocked.createGame.mockResolvedValue(gameState({ game_id: 'g2' }));
    await act(() => result.current.move(4));
    expect(result.current.state?.game_id).toBe('g2');
    expect(result.current.error).toMatch(/expired/);
});

it('ignores moves when it is not a human turn', async () => {
    mocked.createGame.mockResolvedValue(gameState({ current_player: 'O' }));
    const { result } = await start();
    await act(() => result.current.move(4));
    expect(mocked.makeMove).not.toHaveBeenCalled();
});
