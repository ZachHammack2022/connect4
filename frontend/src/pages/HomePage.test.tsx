import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import HomePage from './HomePage';
import { AVAILABLE_GAMES, GAMES } from '../games';

const renderHome = (username = '', setUsername = jest.fn()) => {
    render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><HomePage username={username} setUsername={setUsername} /></MemoryRouter>);
    return setUsername;
};

it('links to every playable game', () => {
    renderHome();
    for (const game of AVAILABLE_GAMES) {
        expect(screen.getByRole('link', { name: new RegExp(game.name) })).toHaveAttribute('href', game.path);
    }
});

it('shows coming-soon games without links', () => {
    renderHome();
    for (const game of GAMES.filter((g) => g.status === 'coming-soon')) {
        expect(screen.getByLabelText(`${game.name}, coming soon`)).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: new RegExp(game.name) })).toBeNull();
    }
});

it('saves a trimmed name', () => {
    const setUsername = renderHome();
    fireEvent.change(screen.getByLabelText('Your name'), { target: { value: '  tess  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(setUsername).toHaveBeenCalledWith('tess');
});

it('shows who is playing when a name is set', () => {
    renderHome('tess');
    expect(screen.getByText('Playing as')).toBeInTheDocument();
    expect(screen.getByText('tess')).toBeInTheDocument();
});
