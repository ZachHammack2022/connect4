import React from 'react';
import { Link } from 'react-router-dom';
import { Moon, Sun, User } from './Icons';
import type { Theme } from '../App';

interface HeaderProps {
    username: string;
    theme: Theme;
    onToggleTheme: () => void;
}

// Four discs on a diagonal: the Game Room mark.
export const LogoMark: React.FC = () => (
    <svg viewBox="0 0 32 32" className="logo-mark" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="var(--accent)" />
        <circle cx="9" cy="23" r="3.4" fill="#fff" opacity="0.55" />
        <circle cx="13.7" cy="18.3" r="3.4" fill="#fff" opacity="0.75" />
        <circle cx="18.3" cy="13.7" r="3.4" fill="#fff" opacity="0.9" />
        <circle cx="23" cy="9" r="3.4" fill="#ffc23d" />
    </svg>
);

const Header: React.FC<HeaderProps> = ({ username, theme, onToggleTheme }) => (
    <header className="site-header">
        <div className="container site-header-inner">
            <Link to="/" className="brand" aria-label="Game Room home">
                <LogoMark />
                <span className="brand-name">Game Room</span>
            </Link>
            <div className="header-actions">
                <Link to="/#name" className="player-chip" title={username ? 'Change your name' : 'Set your name'}>
                    <User />
                    <span>{username || 'Guest'}</span>
                </Link>
                <button type="button" className="icon-btn theme-toggle" onClick={onToggleTheme}
                    aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
                    {theme === 'dark' ? <Sun /> : <Moon />}
                </button>
            </div>
        </div>
    </header>
);

export default Header;
