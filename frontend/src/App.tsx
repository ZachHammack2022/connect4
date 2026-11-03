import React, { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import axios from 'axios';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import GamePage from './pages/GamePage';
import { AVAILABLE_GAMES } from './games';

// Use environment variable for the Axios base URL
const baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
axios.defaults.baseURL = baseURL;

export type Theme = 'light' | 'dark';

// The player's name and theme are remembered in this browser (there are no accounts yet).
const USERNAME_KEY = 'username';
const THEME_KEY = 'theme';
const MUTED_KEY = 'muted';
const load = (key: string) => {
    try { return localStorage.getItem(key); } catch { return null; }
};
const save = (key: string, value: string) => {
    try { localStorage.setItem(key, value); } catch { /* storage unavailable */ }
};
const initialTheme = (): Theme => {
    const saved = load(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
};

function App() {
    const [username, setUsernameState] = useState(() => load(USERNAME_KEY) || '');
    const [theme, setTheme] = useState<Theme>(initialTheme);
    const [muted, setMuted] = useState(() => load(MUTED_KEY) === 'true');
    const toggleMuted = () => setMuted((prev) => {
        save(MUTED_KEY, String(!prev));
        return !prev;
    });

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        document.querySelector('meta[name="theme-color"]')
            ?.setAttribute('content', theme === 'dark' ? '#0a0c11' : '#f5f3ee');
    }, [theme]);

    const setUsername = (name: string) => {
        setUsernameState(name);
        save(USERNAME_KEY, name);
    };
    const toggleTheme = () => setTheme((prev) => {
        const next = prev === 'dark' ? 'light' : 'dark';
        save(THEME_KEY, next);
        return next;
    });

    return (
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <div className="shell">
                <Header username={username} theme={theme} onToggleTheme={toggleTheme} muted={muted} onToggleMuted={toggleMuted} />
                <main>
                    <Routes>
                        <Route path="/" element={<HomePage username={username} setUsername={setUsername} />} />
                        {AVAILABLE_GAMES.map((game) => (
                            <Route key={game.id} path={game.path}
                                // key forces a fresh page (and game session) per game type
                                element={<GamePage key={game.id} game={game} username={username} setUsername={setUsername}
                                    muted={muted} onToggleMuted={toggleMuted} />} />
                        ))}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </main>
                <footer className="site-footer">
                    <div className="container">Game Room · Play a friend on one screen, or take on the AI.</div>
                </footer>
            </div>
        </BrowserRouter>
    );
}

export default App;
