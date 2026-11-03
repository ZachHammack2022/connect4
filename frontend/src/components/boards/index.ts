import React from 'react';
import Connect4Board from './Connect4Board';
import TicTacToeBoard from './TicTacToeBoard';
import ReversiBoard from './ReversiBoard';
import GomokuBoard from './GomokuBoard';
import { BoardProps } from './types';

// The board component for each game id.
export const BOARDS: Record<string, React.FC<BoardProps>> = {
    connect4: Connect4Board,
    tictactoe: TicTacToeBoard,
    reversi: ReversiBoard,
    gomoku: GomokuBoard,
};
