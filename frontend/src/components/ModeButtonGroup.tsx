import React from 'react';
import { Button, Box } from '@mui/material';

interface ModeButtonProps {
    label: string;
    mode: string;
    currentMode: string;
    onClick: () => void;
}

const ModeButton: React.FC<ModeButtonProps> = ({ label, mode, currentMode, onClick }) => (
    <Button
        variant="contained"
        color={currentMode === mode ? "primary" : "inherit"}
        onClick={onClick}
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
}

const ModeButtonGroup: React.FC<ModeButtonGroupProps> = ({ buttons, currentMode }) => (
    <Box style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {buttons.map((buttonProps, index) => (
            <ModeButton key={index} {...buttonProps} currentMode={currentMode} />
        ))}
    </Box>
);

export default ModeButtonGroup;
