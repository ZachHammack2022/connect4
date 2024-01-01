import React, { useState } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import './UsernameInput.css'

interface UsernameInputProps {
    setUsername: (username: string) => void;
}

const UsernameInput: React.FC<UsernameInputProps> = ({ setUsername }) => {
    const [name, setName] = useState<string>('');

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setUsername(name);
    };

    return (
        <form onSubmit={handleSubmit} className="form-container">
            <TextField label="Username" value={name} onChange={(e) => setName(e.target.value)} />
            <Button type="submit" variant="contained">Submit</Button>
        </form>
    );
};

export default UsernameInput;
