import React, { useState } from 'react';
import ModeButtonGroup from './ModeButtonGroup';
import UnderGameBar from './UnderGameBar'
import { LeanModeButtonProps } from './ModeButtonGroup';
import { Difficulty } from '../interfaces/interfaces';
import Grid from '@mui/material/Grid';
import { Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';



interface GameBoardProps {
    board: number[][];
    currentPlayer: string;
    gameOver: boolean;
    winner: string | null;
    handleColumnClick: (column: number) => Promise<void>;
    buttons1: LeanModeButtonProps[];
    currentMode1: string;
    buttons2: LeanModeButtonProps[];
    currentMode2: string;
    difficulty1: Difficulty | null;
    difficulty2: Difficulty | null;
    onDifficultyChange: (player: number, difficulty: Difficulty) => void;
    winningCells: [number, number][];
    resetGame: () => Promise<void>;
}

const GameBoard: React.FC<GameBoardProps> = ({
    board,
    currentPlayer,
    gameOver,
    winner,
    handleColumnClick,
    buttons1,
    currentMode1,
    buttons2,
    currentMode2,
    difficulty1,
    difficulty2,
    onDifficultyChange,
    winningCells,
    resetGame
}) => {
    const isWinningCell = (row: number, column: number) =>
        winningCells.some(([r, c]) => r === row && c === column);
    const theme = useTheme();
    const [hoveredColumn, setHoveredColumn] = useState<number | null>(null);
    const border = `1px solid ${theme.palette.mode === "light" ? theme.palette.grey[300] : theme.palette.grey[800]}`
    const getCellStyle = (rowIndex: number, columnIndex: number, cell: number): React.CSSProperties => {
        const winning = isWinningCell(rowIndex, columnIndex);
        // Once someone has won, fade every disc that isn't part of the line.
        const faded = winningCells.length > 0 && !winning && cell !== 0;

        let backgroundColor: string;
    
        if (cell === 0) {
            backgroundColor = hoveredColumn === columnIndex
                ? theme.palette.action.hover // Use a theme color for hovered column
                : theme.palette.background.paper; // Use theme background color for empty cell
        } else if (cell === -1) {
            backgroundColor = 'red'; // Player X
        } else {
            backgroundColor = 'yellow'; // Player O
        }
     

        return {
            width: 50,
            height: 50,
            backgroundColor: backgroundColor,
            border:  border, //${theme.palette.divider}
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: gameOver ? 'default' : 'pointer',
            color: 'black',
            fontWeight: winning ? 'bold' : 'normal',
            opacity: faded ? 0.35 : 1,
            boxShadow: winning ? `inset 0 0 0 4px ${theme.palette.success.main}` : undefined,
            transition: 'opacity 0.3s, box-shadow 0.3s',
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
                        {winner ? `Winner: ${winner}` : 'Draw!'}
                    </Typography>
                );
            }
        };



        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Grid style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <ModeButtonGroup buttons={buttons1} currentMode={currentMode1}
                        difficulty={difficulty1} onDifficultyChange={(d) => onDifficultyChange(1, d)} />
                </Grid>
                <div>
                    <div style={{ paddingRight: '20px',paddingLeft: '20px'  }}>
                    {gameStatusDisplay()}
                        <div style={{border:border}}>
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
                                        style={getCellStyle(rowIndex, columnIndex, cell)}
                                        aria-label={`Column ${columnIndex}`}
                                    >
                                        {cell !== 0 && (cell === -1 ? 'X' : 'O')}
                                    </div>
                                ))}
                            </div>
                        ))}
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <UnderGameBar resetGame={resetGame} />
                    </div>
                </div>
                <Grid style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <ModeButtonGroup buttons={buttons2} currentMode={currentMode2}
                        difficulty={difficulty2} onDifficultyChange={(d) => onDifficultyChange(2, d)} />
                </Grid>
            </div>

        );
            
};

export default GameBoard;