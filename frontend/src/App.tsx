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
// Use environment variable for the Axios base URL
const baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
axios.defaults.baseURL = baseURL;

function App() {
    const [username, setUsername] = useState('');
    const [board, setBoard] = useState<number[][]>([]);
    const [currentPlayer, setCurrentPlayer] = useState<string>('X');
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState<string | null>(null);
    const [mode, setMode] = useState<string>("human") 
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
    const [error, setError] = useState<string | null>(null);
    const { fetchLeaderboard } = useFetchLeaderboard();
    const { submitGameResult } = useSubmitGameResult(username, fetchLeaderboard);
    const { fetchGameState } = useFetchGameState();
    const { handleChangeMode } = useChangeMode();
    const { handleColumnClick } = useHandleColumnClick();
    const { resetGame } = useResetGame();

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

const handleModeChange = async (newMode:string) => {
    try {
        await handleChangeMode(newMode);
        setMode(newMode);
    } catch (error) {
        console.log(`Error while changing mode: ${error}`);
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




const buttons = [
  { label: 'DQN', mode: 'DQN', onClick: () => handleModeChange("DQN") },
  { label: 'MCTS', mode: 'MCTS', onClick: () => handleModeChange("MCTS") },
  { label: 'Human', mode: 'human', onClick: () => handleModeChange("human") },
  { label: 'Random', mode: 'random', onClick: () => handleModeChange("random") }
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
                        handleColumnClick={onColumnClick}
                        buttons={buttons}
                        currentMode={mode}
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
    );
}

export default App;
