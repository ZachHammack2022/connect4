import React from 'react';
import { Toolbar, Button } from '@mui/material';

interface BottomNavBarProps {
  resetGame: () => Promise<void>;
  handlePlayHuman: () => Promise<void>;
  mode: string;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ resetGame, handlePlayHuman, mode }) => {
    return (
        <Toolbar style={{ justifyContent: 'center', gap: '10px' }}>
          <Button variant={"outlined"} color="inherit" onClick={resetGame}>
            Reset Game
          </Button>
          <Button 
            variant="contained"
            color={mode === 'human' ? "primary" : "inherit"} 
            onClick={handlePlayHuman}
          >
            Play Human
          </Button>
        </Toolbar>
    );
};

export default BottomNavBar;