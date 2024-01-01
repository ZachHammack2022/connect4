import React, { useState, useEffect } from 'react';
import axios from 'axios';
// Use environment variable for the Axios base URL
const baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
axios.defaults.baseURL = baseURL;

const GameBoard: React.FC = () => {
  const [board, setBoard] = useState<number[][]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<string>('X');
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [hoveredColumn, setHoveredColumn] = useState<number | null>(null);
  const [mode, setMode] = useState<string>("human") // 'human' or 'computer'


  interface MoveSuccessResponse {
    board: number[];
    current_player: string;
    done: boolean;
    winner?: string;
  }
  
  interface MoveErrorResponse {
    error: string;
  }

  const handlePlayComputer = async () => {
    await axios.post('/set_mode', { mode: 'computer' });
    setMode('computer');
  };
  
  const handlePlayHuman = async () => {
    await axios.post('/set_mode', { mode: 'human' });
    setMode('human');
  };

  const highlightedStyle = {
    border: '2px solid blue',
    backgroundColor: 'lightblue',
  };
  
  const fetchGameState = async () => {
    try {
        const response = await axios.get('/state');
        console.log("Full response:", response);
        console.log("Board data:", response.data.board);
        updateGameBoard(response.data.board);
        setCurrentPlayer(response.data.current_player);
    } catch (error) {
        console.error("Error while fetching game state:", error);
        // Handle the error appropriately
        // For example, you could set an error state, show a notification to the user, etc.
      }
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
      
      console.log("board after column click: ", response.data.board)
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
    console.log("board: ",flatBoard)
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
    try {
      const response = await axios.post('/reset');
      console.log("board after reset: ", response.data.board)
      updateGameBoard(response.data.board);
      setCurrentPlayer(response.data.current_player);
      setGameOver(false);
      setWinner(null);
      fetchGameState();
    } catch (error) {
      console.error("Error during reset game:", error);
      // Handle the error appropriately
      // For example, you could set an error state, show a notification to the user, etc.
    }
  };
  

  const handleMouseEnter = (columnIndex: number) => {
    setHoveredColumn(columnIndex);
  };

  const handleMouseLeave = () => {
    setHoveredColumn(null);
  };

  const getColumnStyle = (columnIndex: number, cell: number) => {
    let backgroundColor;
    if (cell === 0) {
      backgroundColor = hoveredColumn === columnIndex ? '#e0e0e0' : 'white'; // Empty cell
    } else if (cell === 0.5) {
      backgroundColor = 'red'; // Player X
    } else {
      backgroundColor = 'yellow'; // Player O
    }
  
    return {
      width: 50,
      height: 50,
      backgroundColor: backgroundColor,
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
                key={`${rowIndex}-${columnIndex}`}
                tabIndex={0}
                onClick={() => handleColumnClick(columnIndex)}
                onKeyDown={(event) => handleKeyDown(event, columnIndex)}
                onMouseEnter={() => handleMouseEnter(columnIndex)}
                onMouseLeave={handleMouseLeave}
                style={getColumnStyle(columnIndex, cell)}
                aria-label={`Column ${columnIndex}`}
            >
                {cell !== 0 && (cell === 0.5 ? 'X' : 'O')}
            </div>
            ))}
        </div>
        ))}

      {!gameOver && <p>Current Player: {currentPlayer}</p>}
      {gameOver && (winner ? <p>Winner: {winner}</p> : <p>Game Over!</p>)}
      <button onClick={resetGame}>Reset Game</button>
      <button
        onClick={handlePlayHuman}
        style={mode === 'human' ? highlightedStyle : {}}
      >
        Play Human
      </button>

      <button
        onClick={handlePlayComputer}
        style={mode === 'computer' ? highlightedStyle : {}}
      >
        Play Computer
      </button>

    </div>
  );
};

export default GameBoard;