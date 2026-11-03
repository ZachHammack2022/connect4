import React from 'react';
import { Button, Box, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { Difficulty } from '../interfaces/interfaces';

interface ModeButtonProps {
    label: string;
    mode: string;
    currentMode: string;
    onClick: () => void;  // onClick is a function with no parameters
}

const ModeButton: React.FC<ModeButtonProps> = ({ label, mode, currentMode, onClick }) => (
    <Button
        variant="contained"
        color={currentMode === mode ? "primary" : "inherit"}
        onClick={onClick}  // Directly use the onClick function
    >
        {label}
    </Button>
);

export interface LeanModeButtonProps {
    label: string;
    mode: string;
    onClick: () => void;
}

interface ModeButtonGroupProps {
    buttons: LeanModeButtonProps[];
    currentMode: string;
    // Null when the current player has no difficulty setting (human, random, ...).
    difficulty: Difficulty | null;
    onDifficultyChange: (difficulty: Difficulty) => void;
}

const ModeButtonGroup: React.FC<ModeButtonGroupProps> = ({ buttons, currentMode, difficulty, onDifficultyChange }) => (
    <Box style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'stretch' }}>
        {buttons.map((buttonProps, index) => (
            <ModeButton key={index} {...buttonProps} currentMode={currentMode} />
        ))}
        {/* Reserve the space even when hidden so the board doesn't shift. */}
        <Box style={{ visibility: difficulty ? 'visible' : 'hidden', textAlign: 'center' }}>
            <Typography variant="caption" component="p">Difficulty</Typography>
            <ToggleButtonGroup
                orientation="vertical"
                size="small"
                exclusive
                fullWidth
                value={difficulty}
                onChange={(_, value: Difficulty | null) => value && onDifficultyChange(value)}
                aria-label="AI difficulty"
            >
                <ToggleButton value="easy">Easy</ToggleButton>
                <ToggleButton value="medium">Medium</ToggleButton>
                <ToggleButton value="hard">Hard</ToggleButton>
            </ToggleButtonGroup>
        </Box>
    </Box>
);

export default ModeButtonGroup;
