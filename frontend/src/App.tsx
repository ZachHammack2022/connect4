import React, { useState,useEffect } from 'react';
import Navbar from './components/Navbar';
import UsernameInput from './components/UsernameInput';
import Leaderboard from './components/Leaderboard';
import GameBoard from './components/GameBoard'; // Your existing GameBoard component
import BottomNavBar from './components/BottomNavBar';
import ModeButtonGroup from './components/ModeButtonGroup';
import Grid from '@mui/material/Grid';
import axios from 'axios';
import "./App.css"
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
    const [leaderboardData, setLeaderboardData] = useState([]);



    interface MoveSuccessResponse {
      board: number[];
      current_player: string;
      done: boolean;
      winner?: string;
    }
    
    interface MoveErrorResponse {
      error: string;
    }

    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get('/leaderboard/');
        setLeaderboardData(response.data);
      } catch (error) {
        console.error("Error while fetching leaderboard data:", error);
        // Handle the error appropriately
      }
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
          console.error("Error while fetching game state:", error);
          // Handle the error appropriately
          // For example, you could set an error state, show a notification to the user, etc.
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
          // Handle successful submission, e.g., fetch updated leaderboard
        } catch (error) {
          console.error("Error while submitting game result:", error);
          // Handle the error appropriately
        }
      }
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
          if (response.data.winner) {
            submitGameResult(response.data.winner === 'X')
          }
          
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

    useEffect(() => {
      fetchLeaderboard();
    }, []); // Fetch leaderboard when component mounts

    useEffect(() => {
      fetchGameState();
    }, []); // Fetch game state when component mounts

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
          
         
        </div>
    );
}

export default App;
