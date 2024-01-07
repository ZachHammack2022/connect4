import React, { useState,useEffect } from 'react';
import Navbar from './components/Navbar';
import UsernameInput from './components/UsernameInput';
import Leaderboard from './components/Leaderboard';
import GameBoard from './components/GameBoard'; // Your existing GameBoard component
import BottomNavBar from './components/BottomNavBar';
import Grid from '@mui/material/Grid';
import axios from 'axios';
import "./App.css"
import {LeaderboardEntry } from './interfaces/interfaces';
import { useFetchLeaderboard,useChangeMode,useFetchGameState,useHandleColumnClick,useResetGame,useSubmitGameResult } from './hooks/useApi';
import ErrorPopup from './components/ErrorPopup';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import { ColorModeContext, createAppTheme } from './components/ThemeContext';


// const darkTheme = createTheme({
//   palette: {
//     mode: 'dark',
//   },
// });

// Use environment variable for the Axios base URL
const baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
axios.defaults.baseURL = baseURL;

function App() {
    const [username, setUsername] = useState('');
    const [board, setBoard] = useState<number[][]>([]);
    const [currentPlayer, setCurrentPlayer] = useState<string>('X');
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState<string | null>(null);
    const [mode1, setMode1] = useState<string>("human") 
    const [mode2, setMode2] = useState<string>("human") 
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
    const [error, setError] = useState<string | null>(null);
    const { fetchLeaderboard } = useFetchLeaderboard();
    const { submitGameResult } = useSubmitGameResult(username, fetchLeaderboard);
    const { fetchGameState } = useFetchGameState();
    const { handleChangeMode } = useChangeMode();
    const { handleColumnClick } = useHandleColumnClick();
    const { resetGame } = useResetGame();
    const [mode, setMode] = useState<'light' | 'dark'>('dark');

    const colorMode = {
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
    };

    const theme = createAppTheme(mode);
  

const handleSubmitGameResult = async (won:boolean) => {
    try {
        const leaderboard = await submitGameResult(won);
        if (leaderboard) {
          setLeaderboardData(leaderboard);
        }
    } catch (error) {
        console.log(`Error while submitting game result: ${error}`);
    }
};

const handleModeChange = async (newMode:string,player:number) => {
    console.log("new mode: ",newMode)
    console.log("player: ",player)
    console.log(player===1)
    console.log(player===2)
    try {
        const data = await handleChangeMode(newMode,player);
        console.log(data)
        if (player === 1){
          setMode1(newMode);
        }
        else if (player === 2){
          setMode2(newMode);
        }
    } catch (error) {
        console.log(`Error while changing mode for player ${player}: ${error}`);
    }
};

const onColumnClick = async (column:number) => {
        if (isColumnFull(column) ) {
        setError("This column is full. Try a different one.");
        return;
      }
      if (gameOver) {
          setError("The game is over. Reset the game to play again.");
          return;
        }  
  try {
        const moveResponse = await handleColumnClick(column);
        updateGameBoard(moveResponse.board);
        setCurrentPlayer(moveResponse.current_player);
        if (moveResponse.done) {
            setGameOver(true);
            setWinner(moveResponse.winner || null);
            if (moveResponse.winner) {
                handleSubmitGameResult(moveResponse.winner === 'X');
            }
        }
    } catch (error) {
        setError(`Error while making a move: ${error}`);
    }
};

const onResetGame = async () => {
    try {
        const resetResponse = await resetGame();
        updateGameBoard(resetResponse.board);
        setCurrentPlayer(resetResponse.current_player);
        setGameOver(false);
        setWinner(null);
    } catch (error) {
        setError(`Error while resetting game: ${error}`);
    }
};

    const handleCloseErrorPopup = () => {
      setError(null);
  };

  const isColumnFull = (column: number) => {
    return board[0][column] !== 0;
  };

  const updateGameBoard = (flatBoard: number[]) => {
    const board2D = [];
    for (let row = 0; row < 6; row++) {
      board2D.push(flatBoard.slice(row * 7, (row + 1) * 7));
    }
    setBoard(board2D);
  };


  useEffect(() => {
    const initLeaderboard = async () => {
        try {
            const leaderboardData = await fetchLeaderboard();
            setLeaderboardData(leaderboardData);
        } catch (error) {
            setError("Error while fetching leaderboard");
        }
    };

    const initGameState = async () => {
        try {
            const data = await fetchGameState();
            updateGameBoard(data.board);
            setCurrentPlayer(data.current_player);
        } catch (error) {
            setError("Error while fetching initial game state.");
        }
    };

    initLeaderboard();
    initGameState();
}, []); // Empty dependency array to run only on component mount




const buttons1 = [
  { label: 'DQN', mode: 'dqn', onClick: () => handleModeChange("dqn",1) },
  { label: 'MCTS', mode: 'mcts', onClick: () => handleModeChange("mcts",1) },
  { label: 'Human', mode: 'human', onClick: () => handleModeChange("human",1) },
  { label: 'Random', mode: 'random', onClick: () => handleModeChange("random",1) }
];

const buttons2 = [
  { label: 'DQN', mode: 'dqn', onClick: () => handleModeChange("dqn",2) },
  { label: 'MCTS', mode: 'mcts', onClick: () => handleModeChange("mcts",2) },
  { label: 'Human', mode: 'human', onClick: () => handleModeChange("human",2) },
  { label: 'Random', mode: 'random', onClick: () => handleModeChange("random",2) }
];


    return (
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
        <CssBaseline />
            <div className="App">
                <div style={{paddingBottom:20}}>
                  <Navbar  />
                </div>
                
                {/* <hr></hr> */}
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} className="gameboard-padding">
                        {!username && <UsernameInput setUsername={setUsername} />}
                        {username && (
                          <GameBoard 
                            board={board}
                            currentPlayer={currentPlayer}
                            gameOver={gameOver}
                            winner={winner}
                            handleColumnClick={onColumnClick}
                            buttons1={buttons1}
                            currentMode1={mode1}
                            buttons2={buttons2}
                            currentMode2={mode2}
                            resetGame={onResetGame}
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
          </ThemeProvider>
        </ColorModeContext.Provider>
    );
}

export default App;
