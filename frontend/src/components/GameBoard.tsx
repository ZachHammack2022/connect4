import React, { useState } from 'react';
import ModeButtonGroup from './ModeButtonGroup';
import UnderGameBar from './UnderGameBar'
import { LeanModeButtonProps } from './ModeButtonGroup';
import Grid from '@mui/material/Grid';
import { Typography } from '@mui/material';

interface GameBoardProps {
    board: number[][];
    currentPlayer: string;
    gameOver: boolean;
    winner: string | null;
    handleColumnClick: (column: number) => Promise<void>;
    buttons: LeanModeButtonProps[];
    currentMode: string;
    resetGame: () => Promise<void>;
}

const GameBoard: React.FC<GameBoardProps> = ({
    board,
    currentPlayer,
    gameOver,
    winner,
    handleColumnClick,
    buttons,
    currentMode,
    resetGame
}) => {
    const [hoveredColumn, setHoveredColumn] = useState<number | null>(null);
    const getColumnStyle = (columnIndex: number, cell: number): React.CSSProperties => {
        let backgroundColor: string;
        if (cell === 0) {
            backgroundColor = hoveredColumn === columnIndex ? '#e0e0e0' : 'white'; // Empty cell
        } else if (cell === 0.5) {
            backgroundColor = 'red'; // Player X
        } else {
            backgroundColor = 'yellow'; // Player O
        }
        return {
            width: 50,
            height: 50,
            backgroundColor: backgroundColor,
            border: '1px solid black',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer'
        };
    };

    const handleMouseEnter = (columnIndex: number) => {
        setHoveredColumn(columnIndex);
        };
    
    const handleMouseLeave = () => {
    setHoveredColumn(null);
    };

    const handleKeyDown = async (event: React.KeyboardEvent, column: number) => {
        if (event.key === 'Enter' || event.key === ' ') {
            await handleColumnClick(column);
        }
        };

        const gameStatusDisplay = () => {
            if (!gameOver) {
                return (
                    <Typography variant="h6" component="p">
                        Current Player: {currentPlayer}
                    </Typography>
                );
            } else {
                return (
                    <Typography variant="h6" component="p">
                        {winner ? `Winner: ${winner}` : 'Game Over!'}
                    </Typography>
                );
            }
        };



        return (
            <>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div>
                        <div style={{ paddingRight: '20px' }}>
                        {gameStatusDisplay()}
                            {board.map((row, rowIndex) => (
                                <div key={rowIndex} style={{ display: 'flex' }}>
                                    {row.map((cell, columnIndex) => (
                                        <div 
                                            key={`${rowIndex}-${columnIndex}`}
                                            tabIndex={0}
                                            onClick={() => handleColumnClick(columnIndex)}
                                            onKeyDown={(event) => handleKeyDown(event, columnIndex)}
                                            onMouseEnter={() => handleMouseEnter(columnIndex)}
                                            onMouseLeave={handleMouseLeave}
                                            style={getColumnStyle(columnIndex, cell)}
                                            aria-label={`Column ${columnIndex}`}
                                        >
                                            {cell !== 0 && (cell === 0.5 ? 'X' : 'O')}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <UnderGameBar resetGame={resetGame} />
                        </div>
                    </div>
                    <Grid style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <ModeButtonGroup buttons={buttons} currentMode={currentMode} />
                    </Grid>
                </div>
            </>
        );
            
};

export default GameBoard;