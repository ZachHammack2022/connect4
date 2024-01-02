import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import "./NavBar.css"

const Navbar: React.FC = () => {
    return (
        <AppBar position="static">
            <Toolbar className={"toolbar-centered"} >
                <Typography variant="h5" className={"title"}>Connect4 Game</Typography>
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;
