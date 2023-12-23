import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GameBoard: React.FC = () => {
  const [board, setBoard] = useState<number[][]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<string>('X');

  const fetchGameState = async () => {
    const response = await axios.get('/state');
    setBoard(response.data.board);
    setCurrentPlayer(response.data.current_player);
  };

  const handleColumnClick = async (column: number) => {
    await axios.post('/move', { column });
    fetchGameState();
  };

  const handleKeyDown = async (event: React.KeyboardEvent, column: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      await handleColumnClick(column);
    }
  };

  useEffect(() => {
    fetchGameState();
  }, []);

  return (
    <div>
      {board.map((row, rowIndex) => (
        <div key={rowIndex} style={{ display: 'flex' }}>
          {row.map((cell, columnIndex) => (
            <div 
              key={columnIndex}
              tabIndex={0}
              onClick={() => handleColumnClick(columnIndex)}
              onKeyDown={(event) => handleKeyDown(event, columnIndex)}
              style={{
                width: 50,
                height: 50,
                backgroundColor: cell === 0 ? 'white' : cell === 1 ? 'red' : 'yellow',
                border: '1px solid black',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer'
              }}
              aria-label={`Column ${columnIndex}`}
            >
              {cell !== 0 && (cell === 1 ? 'X' : 'O')}
            </div>
          ))}
        </div>
      ))}
      <p>Current Player: {currentPlayer}</p>
    </div>
  );
};

export default GameBoard;
