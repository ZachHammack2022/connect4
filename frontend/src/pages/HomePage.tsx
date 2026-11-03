import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Box, Button, Card, CardActionArea, CardContent, Chip, Container, Grid, Stack, TextField, Typography,
} from '@mui/material';
import GameArt from '../components/GameArt';
import { GAMES, GameInfo } from '../games';

interface HomePageProps {
    username: string;
    setUsername: (name: string) => void;
}

const NameForm: React.FC<HomePageProps> = ({ username, setUsername }) => {
    const [editing, setEditing] = useState(!username);
    const [name, setName] = useState(username);

    if (!editing) {
        return (
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                <Typography>Playing as <strong>{username}</strong></Typography>
                <Button size="small" onClick={() => setEditing(true)}>Change</Button>
            </Stack>
        );
    }
    return (
        <Box
            component="form"
            onSubmit={(event: React.FormEvent) => {
                event.preventDefault();
                const trimmed = name.trim();
                if (trimmed) {
                    setUsername(trimmed);
                    setEditing(false);
                }
            }}
            sx={{ display: 'flex', gap: 1, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}
        >
            <TextField label="Your name" size="small" value={name} onChange={(e) => setName(e.target.value)}
                inputProps={{ maxLength: 255 }} helperText="Shown on the leaderboards. No account needed." />
            <Button type="submit" variant="contained" sx={{ alignSelf: 'flex-start' }}>Save</Button>
        </Box>
    );
};

const GameCard: React.FC<{ game: GameInfo }> = ({ game }) => {
    const available = game.status === 'available';
    const content = (
        <>
            <Box sx={{ height: 140, p: 2, display: 'flex', justifyContent: 'center', bgcolor: 'action.hover' }}>
                <Box sx={{ width: 120, filter: available ? 'none' : 'grayscale(0.7)', opacity: available ? 1 : 0.6 }}>
                    <GameArt id={game.id} />
                </Box>
            </Box>
            <CardContent sx={{ textAlign: 'left' }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mb: 0.5 }}>
                    <Typography variant="h6" component="h3">{game.name}</Typography>
                    {!available && <Chip label="Coming soon" size="small" sx={{ flexShrink: 0 }} />}
                </Stack>
                <Typography variant="body2" color="text.secondary">{game.tagline}</Typography>
            </CardContent>
        </>
    );
    return (
        <Card variant="outlined" sx={{ height: '100%' }} aria-disabled={!available}>
            {available
                ? <CardActionArea component={RouterLink} to={game.path} sx={{ height: '100%' }}>{content}</CardActionArea>
                : content}
        </Card>
    );
};

const HomePage: React.FC<HomePageProps> = (props) => {
    const available = GAMES.filter((g) => g.status === 'available');
    const comingSoon = GAMES.filter((g) => g.status === 'coming-soon');
    return (
        <Container maxWidth="lg" sx={{ pb: 6 }}>
            <Box sx={{ textAlign: 'center', my: 4 }}>
                <Typography variant="h3" component="h1" gutterBottom>Pick a game</Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                    Play against a friend on the same screen, or take on the AI opponents.
                </Typography>
                <NameForm {...props} />
            </Box>

            <Grid container spacing={3}>
                {available.map((game) => (
                    <Grid item xs={12} sm={6} md={4} key={game.id}><GameCard game={game} /></Grid>
                ))}
            </Grid>

            <Typography variant="h5" component="h2" sx={{ mt: 6, mb: 2 }}>Coming soon</Typography>
            <Grid container spacing={3}>
                {comingSoon.map((game) => (
                    <Grid item xs={12} sm={6} md={3} key={game.id}><GameCard game={game} /></Grid>
                ))}
            </Grid>
        </Container>
    );
};

export default HomePage;
