import React, { useState,useEffect } from 'react';
import Navbar from './components/Navbar';
import UsernameInput from './components/UsernameInput';
import Leaderboard from './components/Leaderboard';
import GameBoard from './components/GameBoard'; // Your existing GameBoard component
import BottomNavBar from './components/BottomNavBar';
import Grid from '@mui/material/Grid';
import axios from 'axios';
import { AxiosError } from 'axios';
import "./App.css"
import ErrorPopup from './components/ErrorPopup';
// Use environment variable for the Axios base URL
const baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
axios.defaults.baseURL = baseURL;

function App() {
    const [username, setUsername] = useState('');
    const [board, setBoard] = useState<number[][]>([]);
    const [currentPlayer, setCurrentPlayer] = useState<string>('X');
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState<string | null>(null);
    const [mode, setMode] = useState<string>("human") // 'human' or 'computer'
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
    const [error, setError] = useState<string | null>(null);
    


    interface LeaderboardEntry {
      username: string;
      wins: number;
      losses: number;
  }

    interface MoveSuccessResponse {
      board: number[];
      current_player: string;
      done: boolean;
      winner?: string;
    }

    function isAxiosError(error: unknown): error is AxiosError {
      return (error as AxiosError).response !== undefined;
  }

  interface ErrorResponse {
    message:string;
  }
  

    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get('/leaderboard/');
        setLeaderboardData(response.data);
      } catch (error) {
        if (isAxiosError(error)) {
            // Now TypeScript knows this is an AxiosError
            const message = (error.response?.data as ErrorResponse).message || "Failed to fetch leaderboard. Check database.";
            setError(`Error while fetching leaderboard: ${message}`);
        } else {
            // Handle non-Axios errors
            setError("An unknown error occurred");
        }
        console.error("Error during reset game:", error);
    }
};

    const handleCloseErrorPopup = () => {
      setError(null);
  };

    
    const handlePlayDQN = async () => {
      await axios.post('/set_mode', { mode: 'DQN' });
      setMode('DQN');
  };

    const handlePlayMCTS = async () => {
        await axios.post('/set_mode', { mode: 'MCTS' });
        setMode('MCTS');
    };

    const handlePlayHuman = async () => {
        await axios.post('/set_mode', { mode: 'human' });
        setMode('human');
    };

    const handlePlayRandom = async () => {
        await axios.post('/set_mode', { mode: 'random' });
        setMode('random');
    };
    

    const fetchGameState = async () => {
      try {
          const response = await axios.get('/state');
          console.log("Full response:", response);
          console.log("Board data:", response.data.board);
          updateGameBoard(response.data.board);
          setCurrentPlayer(response.data.current_player);
      } catch (error) {
          setError(`Error while fetching game state: ${error}`);
        }
    };

    const isColumnFull = (column: number) => {
      return board[0][column] !== 0;
    };

    const submitGameResult = async (won: boolean) => {
      if (username) {
        try {
          await axios.post('/submit_game/', { username, won });
          fetchLeaderboard();
          console.log("posted game result and fetched leaderboard")
        } catch (error) {
          console.error("Error while submitting game result:", error);
          setError(`Error while submitting game result:${error}`)
        }
      }
    };
     
    const handleColumnClick = async (column: number) => {
      if (isColumnFull(column) ) {
        setError("This column is full. Try a different one.");
        return;
      }
      if (gameOver) {
          setError("The game is over. Reset the game to play again.");
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
          if (response.data.winner) {
            submitGameResult(response.data.winner === 'X')
          }
          
        }
      } catch (error) {
        if (isAxiosError(error)) {
          // Now TypeScript knows this is an AxiosError
          const message = (error.response?.data as ErrorResponse).message || "Failed to fetch leaderboard. Check database.";
          setError(`Error while making a move:${message}`)
      } else {
          // Handle non-Axios errors
          setError("Error while making a move");
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
        if (isAxiosError(error)) {
          // Now TypeScript knows this is an AxiosError
          const message = (error.response?.data as ErrorResponse).message || "Failed to fetch leaderboard. Check database.";
          setError(`Error while resetting game:${message}`)
      } else {
          // Handle non-Axios errors
          setError("Error while resetting game");
      }
    }
  }
  // This runs once on component mount
  useEffect(() => {
      fetchLeaderboard();
      fetchGameState();
  }); 


    const buttons = [
      { label: 'DQN', mode: 'DQN', onClick: handlePlayDQN },
      { label: 'MCTS', mode: 'MCTS', onClick: handlePlayMCTS },
      { label: 'Human', mode: 'human', onClick: handlePlayHuman },
      { label: 'Random', mode: 'random', onClick: handlePlayRandom }
  ];

    return (
        <div className="App">
            <Navbar />
            <hr></hr>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6} className="gameboard-padding">
                    {!username && <UsernameInput setUsername={setUsername} />}
                    {username && (
                      <GameBoard 
                        board={board}
                        currentPlayer={currentPlayer}
                        gameOver={gameOver}
                        winner={winner}
                        handleColumnClick={handleColumnClick}
                        buttons={buttons}
                        currentMode={mode}
                        resetGame={resetGame}
                      />
                    )}
                </Grid>


                <Grid item xs={12} sm={6} className="leaderboard-padding">
                  <Leaderboard data={leaderboardData} />
                </Grid>
            </Grid>
            {/* <BottomNavBar 
              resetGame={resetGame}
              mode={mode}
            /> */}
            <ErrorPopup 
                open={!!error} 
                errorMessage={error || ''} 
                handleClose={handleCloseErrorPopup} 
            />
          
         
        </div>
    );
}

export default App;
