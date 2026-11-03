import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import UsernameInput from './components/UsernameInput';
import Leaderboard from './components/Leaderboard';
import GameBoard from './components/GameBoard'; // Your existing GameBoard component
import Grid from '@mui/material/Grid';
import axios from 'axios';
import "./App.css"
import { Difficulty, GameState, LeaderboardEntry } from './interfaces/interfaces';
import * as api from './hooks/useApi';
import { getErrorMessage, isNotFound } from './hooks/useApi';
import ErrorPopup from './components/ErrorPopup';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ColorModeContext, createAppTheme } from './components/ThemeContext';

// Use environment variable for the Axios base URL
const baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
axios.defaults.baseURL = baseURL;

// Each browser tab keeps its own game; sessionStorage survives a refresh.
const GAME_ID_KEY = 'connect4GameId';
const loadGameId = (): string | null => {
    try { return sessionStorage.getItem(GAME_ID_KEY); } catch { return null; }
};
const saveGameId = (gameId: string) => {
    try { sessionStorage.setItem(GAME_ID_KEY, gameId); } catch { /* storage unavailable */ }
};

function App() {
    const [username, setUsername] = useState('');
    const [board, setBoard] = useState<number[][]>([]);
    const [currentPlayer, setCurrentPlayer] = useState<string>('X');
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState<string | null>(null);
    const [mode1, setMode1] = useState<string>("human")
    const [mode2, setMode2] = useState<string>("human")
    const [difficulty1, setDifficulty1] = useState<Difficulty | null>(null);
    const [difficulty2, setDifficulty2] = useState<Difficulty | null>(null);
    const [winningCells, setWinningCells] = useState<[number, number][]>([]);
    // True while a game request is in flight (including the AI thinking).
    const [busy, setBusy] = useState(false);
    const busyRef = useRef(false);
    // Each side remembers its last difficulty so switching AI keeps it.
    const lastDifficulty = useRef<Record<number, Difficulty>>({ 1: 'medium', 2: 'medium' });
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<'light' | 'dark'>('dark');
    const gameIdRef = useRef<string | null>(null);
    // Tracks whether the current game has already finished, so a result is
    // only submitted once (e.g. not again when switching modes after the game).
    const gameOverRef = useRef(false);
    // The username is read when a game ends, which may be inside an older closure.
    const usernameRef = useRef('');
    usernameRef.current = username;

    const colorMode = {
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
    };

    const theme = createAppTheme(mode);

    const handleSubmitGameResult = async (won:boolean) => {
        if (!usernameRef.current) return;
        try {
            setLeaderboardData(await api.submitGameResult(usernameRef.current, won));
        } catch (error) {
            setError(`Error while submitting game result: ${getErrorMessage(error)}`);
        }
    };

    const updateGame = (state: GameState) => {
      gameIdRef.current = state.game_id;
      saveGameId(state.game_id);
      updateGameBoard(state.board);
      setCurrentPlayer(state.current_player);
      setGameOver(state.done);
      setWinner(state.winner || null);
      setMode1(state.mode1);
      setMode2(state.mode2);
      setDifficulty1(state.difficulty1);
      setDifficulty2(state.difficulty2);
      if (state.difficulty1) lastDifficulty.current[1] = state.difficulty1;
      if (state.difficulty2) lastDifficulty.current[2] = state.difficulty2;
      setWinningCells(state.winning_cells || []);

      const justFinished = state.done && !gameOverRef.current;
      gameOverRef.current = state.done;
      if (!justFinished || !state.winner) {
          return;
      }
      // Only human-vs-AI games count towards the leaderboard, scored from the human's side.
      const human1 = state.mode1 === 'human';
      const human2 = state.mode2 === 'human';
      if (human1 !== human2) {
          const humanSymbol = human1 ? 'X' : 'O';
          handleSubmitGameResult(state.winner === humanSymbol);
      }
    }

    const startNewGame = async () => {
        gameOverRef.current = false;
        updateGame(await api.createGame());
    };

    // Runs a request against the current game. If the server no longer knows
    // the game (it expired or the server restarted), start a fresh one.
    const withGame = async (action: string, request: (gameId: string) => Promise<GameState>) => {
        // Ignore clicks while a request is already running (e.g. the AI is thinking).
        if (busyRef.current) return;
        busyRef.current = true;
        setBusy(true);
        try {
            if (!gameIdRef.current) {
                await startNewGame();
            }
            updateGame(await request(gameIdRef.current as string));
        } catch (error) {
            if (isNotFound(error)) {
                try {
                    await startNewGame();
                    setError("Your game expired, so a new one was started.");
                } catch (createError) {
                    setError(`Error while starting a new game: ${getErrorMessage(createError)}`);
                }
            } else {
                setError(`Error while ${action}: ${getErrorMessage(error)}`);
                // Undo any optimistic update by reloading the real state.
                try {
                    if (gameIdRef.current) updateGame(await api.fetchGameState(gameIdRef.current));
                } catch { /* keep the error already shown */ }
            }
        } finally {
            busyRef.current = false;
            setBusy(false);
        }
    };

    const handleModeChange = (newMode:string, player:number, difficulty?: Difficulty) =>
        withGame(`changing mode for player ${player}`, (gameId) =>
            api.changeMode(gameId, newMode, player, difficulty ?? lastDifficulty.current[player]));

    const handleDifficultyChange = (player: number, difficulty: Difficulty) =>
        handleModeChange(player === 1 ? mode1 : mode2, player, difficulty);

    const onColumnClick = async (column:number) => {
          const humanToMove = (currentPlayer === 'X' ? mode1 : mode2) === 'human';
          if (board.length === 0 || busyRef.current || (!gameOver && !humanToMove)) {
            return;
          }
          if (isColumnFull(column) ) {
            setError("This column is full. Try a different one.");
            return;
          }
          if (gameOver) {
              setError("The game is over. Reset the game to play again.");
              return;
            }
          // Show the human's disc straight away and hand the turn over, rather
          // than waiting for the response (which includes the AI's reply).
          const landingRow = board.map((row) => row[column]).lastIndexOf(0);
          setBoard(board.map((row, r) => r === landingRow
              ? row.map((cell, c) => (c === column ? (currentPlayer === 'X' ? -1 : 1) : cell))
              : row));
          setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
          await withGame('making a move', (gameId) => api.makeMove(gameId, column));
    };

    const onResetGame = async () => {
        gameOverRef.current = false;
        await withGame('resetting the game', api.resetGame);
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
            setLeaderboardData(await api.fetchLeaderboard());
        } catch (error) {
            setError("Error while fetching leaderboard");
        }
    };

    const initGameState = async () => {
        const savedGameId = loadGameId();
        if (savedGameId) {
            try {
                const state = await api.fetchGameState(savedGameId);
                gameOverRef.current = state.done;  // resuming: don't re-submit a finished game
                updateGame(state);
                return;
            } catch (error) {
                if (!isNotFound(error)) {
                    setError(`Error while fetching game state: ${getErrorMessage(error)}`);
                    return;
                }
                // Saved game is gone; fall through and start a new one.
            }
        }
        try {
            await startNewGame();
        } catch (error) {
            setError(`Error while starting a new game: ${getErrorMessage(error)}`);
        }
    };

    initLeaderboard();
    initGameState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // Run only on component mount


const buttons1 = [
  { label: 'DQN', mode: 'dqn', onClick: () => handleModeChange("dqn",1) },
  { label: 'MCTS', mode: 'mcts', onClick: () => handleModeChange("mcts",1) },
  { label: 'Human', mode: 'human', onClick: () => handleModeChange("human",1) },
  { label: 'Random', mode: 'random', onClick: () => handleModeChange("random",1) },
  { label: 'Minimax', mode: 'minimax', onClick: () => handleModeChange("minimax",1) }
];

const buttons2 = [
  { label: 'DQN', mode: 'dqn', onClick: () => handleModeChange("dqn",2) },
  { label: 'MCTS', mode: 'mcts', onClick: () => handleModeChange("mcts",2) },
  { label: 'Human', mode: 'human', onClick: () => handleModeChange("human",2) },
  { label: 'Random', mode: 'random', onClick: () => handleModeChange("random",2) },
  { label: 'Minimax', mode: 'minimax', onClick: () => handleModeChange("minimax",2) }
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
                    <Grid item xs={12} md={7} className="gameboard-padding">
                        {!username && <UsernameInput setUsername={setUsername} />}
                        {username && (
                          <GameBoard 
                            board={board}
                            currentPlayer={currentPlayer}
                            gameOver={gameOver}
                            winner={winner}
                            busy={busy}
                            handleColumnClick={onColumnClick}
                            buttons1={buttons1}
                            currentMode1={mode1}
                            buttons2={buttons2}
                            currentMode2={mode2}
                            difficulty1={difficulty1}
                            difficulty2={difficulty2}
                            onDifficultyChange={handleDifficultyChange}
                            winningCells={winningCells}
                            resetGame={onResetGame}
                          />
                        )}
                    </Grid>


                    <Grid item xs={12} md={5} className="leaderboard-padding">
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
