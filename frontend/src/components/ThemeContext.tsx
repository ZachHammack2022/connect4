// themeContext.tsx
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';

export const ColorModeContext = React.createContext({ toggleColorMode: () => {} });

export const useColorMode = () => React.useContext(ColorModeContext);

export const createAppTheme = (mode: 'light' | 'dark') => createTheme({
  palette: {
    mode,
  },
});
