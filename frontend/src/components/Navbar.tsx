import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { useTheme } from '@mui/material/styles';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useColorMode } from './ThemeContext';
import "./NavBar.css"



const Navbar: React.FC = () => {
    const { toggleColorMode } = useColorMode();
    const theme = useTheme();
    
    return (
        <AppBar position="static">
            <Toolbar>
            <Typography variant="h5" sx={{ flexGrow: 1, textAlign: 'center' }}>Connect4</Typography>
            <IconButton onClick={toggleColorMode} color="inherit" sx={{ position: 'absolute', right: 20 }}>
                {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
            </Toolbar>
      </AppBar>
      
    );
  };
  


export default Navbar;
