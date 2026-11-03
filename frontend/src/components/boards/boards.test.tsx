import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import Connect4Board from './Connect4Board';
import TicTacToeBoard from './TicTacToeBoard';
import ReversiBoard from './ReversiBoard';
import { BoardProps } from './types';

const props = (overrides: Partial<BoardProps>): BoardProps => ({
    board: [], rows: 0, cols: 0, currentPlayer: 'X', winningCells: [], legalMoves: [],
    lastCell: null, interactive: true, onMove: jest.fn(), ...overrides,
});

describe('Connect4Board', () => {
    it('plays the clicked column', () => {
        const onMove = jest.fn();
        render(<Connect4Board {...props({ board: Array(42).fill(0), rows: 6, cols: 7, onMove })} />);
        fireEvent.click(screen.getByLabelText('Column 5, row 3: empty'));
        expect(onMove).toHaveBeenCalledWith(4);
    });

    it('marks winning discs and dims the rest', () => {
        const board = Array(42).fill(0);
        [35, 36, 37, 38].forEach((i) => { board[i] = -1; });
        board[28] = 1;
        render(<Connect4Board {...props({ board, rows: 6, cols: 7, interactive: false,
            winningCells: [[5, 0], [5, 1], [5, 2], [5, 3]] })} />);
        expect(screen.getByLabelText('Column 1, row 6: red, winning disc')).toHaveClass('winning');
        expect(screen.getByLabelText('Column 1, row 5: yellow')).toHaveClass('faded');
    });
});

describe('TicTacToeBoard', () => {
    it('plays a square with the keyboard', () => {
        const onMove = jest.fn();
        render(<TicTacToeBoard {...props({ board: Array(9).fill(0), rows: 3, cols: 3, onMove })} />);
        fireEvent.keyDown(screen.getByLabelText('Row 2, column 2: empty'), { key: 'Enter' });
        expect(onMove).toHaveBeenCalledWith(4);
    });

    it('shows no hover preview when it is not your turn', () => {
        const { container } = render(<TicTacToeBoard {...props({ board: Array(9).fill(0), rows: 3, cols: 3, interactive: false })} />);
        fireEvent.mouseEnter(screen.getByLabelText('Row 1, column 1: empty'));
        expect(container.querySelector('.ttt-preview')).toBeNull();
    });
});

describe('ReversiBoard', () => {
    const opening = () => {
        const board = Array(64).fill(0);
        board[27] = 1; board[36] = 1; board[28] = -1; board[35] = -1;
        return board;
    };

    it('marks legal moves only when it is your turn', () => {
        const { container, rerender } = render(<ReversiBoard {...props({ board: opening(), rows: 8, cols: 8, legalMoves: [19, 26, 37, 44] })} />);
        expect(container.querySelectorAll('.rv-hint')).toHaveLength(4);
        rerender(<ReversiBoard {...props({ board: opening(), rows: 8, cols: 8, legalMoves: [19, 26, 37, 44], interactive: false })} />);
        expect(container.querySelectorAll('.rv-hint')).toHaveLength(0);
    });
});
