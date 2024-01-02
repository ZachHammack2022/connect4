import React from 'react';
import { Toolbar, Button } from '@mui/material';

interface UnderGameBarProps {
  resetGame: () => Promise<void>;
}

const UnderGameBar: React.FC<UnderGameBarProps> = ({ resetGame }) => {
    return (
        <Toolbar style={{ justifyContent: 'center', gap: '10px' }}>
          <Button variant={"outlined"} color="inherit" onClick={resetGame}>
            Reset Game
          </Button>
        </Toolbar>
    );
};

export default UnderGameBar;