// App.js

import React, { useState } from 'react';
import Navbar from './components/Navbar';
import UsernameInput from './components/UsernameInput';
import Leaderboard from './components/Leaderboard';
import GameBoard from './components/GameBoard'; // Your existing GameBoard component
import Grid from '@mui/material/Grid';

function App() {
    const [username, setUsername] = useState('');

    return (
        <div className="App">
            <Navbar />
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    {!username && <UsernameInput setUsername={setUsername} />}
                    {username && <GameBoard />}
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Leaderboard />
                </Grid>
            </Grid>
        </div>
    );
}

export default App;
