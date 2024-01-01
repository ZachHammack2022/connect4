import React from 'react';
import { Toolbar, Button } from '@mui/material';

interface BottomNavBarProps {
  resetGame: () => Promise<void>;
  handlePlayHuman: () => Promise<void>;
  handlePlayComputer: () => Promise<void>;
  mode: string;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ resetGame, handlePlayHuman, handlePlayComputer, mode }) => {
    return (
        <Toolbar>
          <Button variant={"outlined"} color="inherit" onClick={resetGame}>
            Reset Game
          </Button>
          <Button 
            variant={mode === 'human' ? "contained" : "outlined"} 
            color={mode === 'human' ? "inherit" : "secondary"} 
            onClick={handlePlayHuman}
          >
            Play Human
          </Button>
          <Button 
            variant={mode === 'computer' ? "contained" : "outlined"} 
            color={mode === 'computer' ? "inherit" : "secondary"} 
            onClick={handlePlayComputer}
          >
            Play Computer
          </Button>
        </Toolbar>
    );
};

export default BottomNavBar;
