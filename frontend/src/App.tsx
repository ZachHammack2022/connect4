import React, { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import axios from 'axios';
import { ThemeProvider } from '@mui/material/styles';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Navbar from './components/Navbar';
import { ColorModeContext, createAppTheme } from './components/ThemeContext';
import HomePage from './pages/HomePage';
import GamePage from './pages/GamePage';
import { AVAILABLE_GAMES } from './games';
import './App.css';

// Use environment variable for the Axios base URL
const baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
axios.defaults.baseURL = baseURL;

// The player's name is remembered in this browser (there are no accounts yet).
const USERNAME_KEY = 'username';
const loadUsername = () => {
    try { return localStorage.getItem(USERNAME_KEY) || ''; } catch { return ''; }
};

function App() {
    const [username, setUsernameState] = useState(loadUsername);
    const [mode, setMode] = useState<'light' | 'dark'>('dark');

    const setUsername = (name: string) => {
        setUsernameState(name);
        try { localStorage.setItem(USERNAME_KEY, name); } catch { /* storage unavailable */ }
    };

    const colorMode = {
        toggleColorMode: () => setMode((prev) => (prev === 'light' ? 'dark' : 'light')),
    };

    return (
        <ColorModeContext.Provider value={colorMode}>
            <ThemeProvider theme={createAppTheme(mode)}>
                <CssBaseline />
                <BrowserRouter>
                    <div className="App">
                        <Box sx={{ pb: 2 }}><Navbar /></Box>
                        <Routes>
                            <Route path="/" element={<HomePage username={username} setUsername={setUsername} />} />
                            {AVAILABLE_GAMES.map((game) => (
                                <Route key={game.id} path={game.path}
                                    // key forces a fresh page (and game session) per game type
                                    element={<GamePage key={game.id} game={game} username={username} />} />
                            ))}
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </div>
                </BrowserRouter>
            </ThemeProvider>
        </ColorModeContext.Provider>
    );
}

export default App;
