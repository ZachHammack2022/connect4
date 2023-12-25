import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GameBoard: React.FC = () => {
  const [board, setBoard] = useState<number[][]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<string>('X');
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [hoveredColumn, setHoveredColumn] = useState<number | null>(null);

  interface MoveSuccessResponse {
    board: number[];
    current_player: string;
    done: boolean;
    winner?: string;
  }
  
  interface MoveErrorResponse {
    error: string;
  }
  
  const fetchGameState = async () => {
    const response = await axios.get('/state');
    updateGameBoard(response.data.board);
    setCurrentPlayer(response.data.current_player);
  };

  const isColumnFull = (column: number) => {
    return board[0][column] !== 0;
  };

  const handleColumnClick = async (column: number) => {
    if (isColumnFull(column) ) {
      alert("This column is full. Try a different one.");
      return;
    }
    if (gameOver) {
        alert("The game is over. Reset the game to play again.");
        return;
      }

    try {
      const response = await axios.post<MoveSuccessResponse>('/move', { column });
      updateGameBoard(response.data.board);
      setCurrentPlayer(response.data.current_player);
      if (response.data.done) {
        setGameOver(true);
        setWinner(response.data.winner || null);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data as MoveErrorResponse;
        alert(errorData.error);
      }
    }
  };

  const updateGameBoard = (flatBoard: number[]) => {
    const board2D = [];
    for (let row = 0; row < 6; row++) {
      board2D.push(flatBoard.slice(row * 7, (row + 1) * 7));
    }
    setBoard(board2D);
  };

  const handleKeyDown = async (event: React.KeyboardEvent, column: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      await handleColumnClick(column);
    }
  };

  const resetGame = async () => {
    const response = await axios.post('/reset');
    updateGameBoard(response.data.board);
    setCurrentPlayer(response.data.current_player);
    setGameOver(false);
    setWinner(null);
    fetchGameState();
  };

  const handleMouseEnter = (columnIndex: number) => {
    setHoveredColumn(columnIndex);
  };

  const handleMouseLeave = () => {
    setHoveredColumn(null);
  };

  const getColumnStyle = (columnIndex: number, cell: number) => {
    return {
      width: 50,
      height: 50,
      backgroundColor: hoveredColumn === columnIndex && cell === 0 ? '#e0e0e0' : cell === 0 ? 'white' : cell === 1 ? 'red' : 'yellow',
      border: '1px solid black',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      cursor: 'pointer'
    };
  };

  useEffect(() => {
    fetchGameState();
  }, []);

  return (
    <div>
      {board && board.length > 0 && board.map((row, rowIndex) => (
        <div key={rowIndex} style={{ display: 'flex' }}>
          {row.map((cell, columnIndex) => (
            <div 
              key={columnIndex}
              tabIndex={0}
              onClick={() => handleColumnClick(columnIndex)}
              onKeyDown={(event) => handleKeyDown(event, columnIndex)}
              onMouseEnter={() => handleMouseEnter(columnIndex)}
              onMouseLeave={handleMouseLeave}
              style={getColumnStyle(columnIndex, cell)}
              aria-label={`Column ${columnIndex}`}
            >
              {cell !== 0 && (cell === 1 ? 'X' : 'O')}
            </div>
          ))}
        </div>
      ))}
      {!gameOver && <p>Current Player: {currentPlayer}</p>}
      {gameOver && (winner ? <p>Winner: {winner}</p> : <p>Game Over!</p>)}
      <button onClick={resetGame}>Reset Game</button>
    </div>
  );
};

export default GameBoard;