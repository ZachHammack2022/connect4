import React from 'react';
import { Toolbar, Button } from '@mui/material';

interface BottomNavBarProps {
  resetGame: () => Promise<void>;
  mode: string;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ resetGame, mode }) => {
    return (
        <Toolbar style={{ justifyContent: 'center', gap: '10px' }}>
          <Button variant={"outlined"} color="inherit" onClick={resetGame}>
            Reset Game
          </Button>
        </Toolbar>
    );
};

export default BottomNavBar;
