import { findGame, reversiFlips, squareName, GAMES, AVAILABLE_GAMES } from './games';

const empty = (n: number) => Array(n).fill(0);

describe('game catalog', () => {
    it('lists available games with unique ids and paths', () => {
        const ids = GAMES.map((g) => g.id);
        expect(new Set(ids).size).toBe(ids.length);
        expect(AVAILABLE_GAMES.map((g) => g.path)).toEqual(AVAILABLE_GAMES.map((g) => `/${g.id}`));
    });

    it('drops Connect 4 discs to the lowest empty cell', () => {
        const c4 = findGame('connect4')!;
        const board = empty(42);
        const once = c4.applyMove(board, 3, 7, -1)!;
        expect(once[5 * 7 + 3]).toBe(-1);
        const twice = c4.applyMove(once, 3, 7, 1)!;
        expect(twice[4 * 7 + 3]).toBe(1);
        expect(board.every((c) => c === 0)).toBe(true); // original untouched
    });

    it('refuses a full Connect 4 column', () => {
        const c4 = findGame('connect4')!;
        const board = empty(42);
        for (let r = 0; r < 6; r++) board[r * 7] = 1;
        expect(c4.applyMove(board, 0, 7, -1)).toBeNull();
    });

    it('places tic-tac-toe marks only on empty squares', () => {
        const ttt = findGame('tictactoe')!;
        const board = ttt.applyMove(empty(9), 4, 3, -1)!;
        expect(board[4]).toBe(-1);
        expect(ttt.applyMove(board, 4, 3, 1)).toBeNull();
    });

    it('flips Reversi discs like the backend', () => {
        const board = empty(64);
        board[27] = 1; board[36] = 1; board[28] = -1; board[35] = -1; // standard opening
        expect(reversiFlips(board, 19, 8, -1)).toEqual([27]);
        expect(reversiFlips(board, 0, 8, -1)).toEqual([]);
        const after = findGame('reversi')!.applyMove(board, 19, 8, -1)!;
        expect(after[19]).toBe(-1);
        expect(after[27]).toBe(-1);
        expect(findGame('reversi')!.score!(after)).toEqual({ X: 4, O: 1 });
    });

    it('names squares for the move list', () => {
        expect(squareName(findGame('connect4')!, [5, 3], 6)).toBe('d1');
        expect(squareName(findGame('tictactoe')!, [0, 2], 3)).toBe('c1');
    });
});
