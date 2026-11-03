import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import GameArt from '../components/GameArt';
import NameForm from '../components/NameForm';
import { ArrowRight, Cpu, User } from '../components/Icons';
import { AVAILABLE_GAMES, AvailableGame, ComingSoonGame, GAMES } from '../games';
import './HomePage.css';

interface HomePageProps {
    username: string;
    setUsername: (name: string) => void;
}

const tintStyle = (tint: string) => ({ '--tint': tint } as React.CSSProperties);

const FeatureCard: React.FC<{ game: AvailableGame; index: number }> = ({ game, index }) => {
    const ais = game.modes.filter((m) => m.mode !== 'human').map((m) => m.label);
    return (
        <Link to={game.path} className="feature-card" style={{ ...tintStyle(game.tint), animationDelay: `${index * 80}ms` }}>
            <div className="feature-art">
                <div className="feature-art-inner"><GameArt id={game.id} /></div>
            </div>
            <div className="feature-body">
                <div className="feature-text">
                    <h3>{game.name}</h3>
                    <p>{game.tagline}</p>
                    <div className="feature-tags">
                        <span className="chip"><User /> 2 players</span>
                        <span className="chip"><Cpu /> {ais.join(' · ')}</span>
                    </div>
                </div>
                <span className="feature-go" aria-hidden="true"><ArrowRight /></span>
            </div>
        </Link>
    );
};

const SoonCard: React.FC<{ game: ComingSoonGame }> = ({ game }) => (
    <div className="soon-card" style={tintStyle(game.tint)} aria-label={`${game.name}, coming soon`}>
        <div className="soon-art"><GameArt id={game.id} /></div>
        <div>
            <div className="soon-title">
                <h3>{game.name}</h3>
                <span className="chip">Soon</span>
            </div>
            <p>{game.tagline}</p>
        </div>
    </div>
);

const HomePage: React.FC<HomePageProps> = ({ username, setUsername }) => {
    const location = useLocation();
    const comingSoon = GAMES.filter((g): g is ComingSoonGame => g.status === 'coming-soon');

    return (
        <div className="home">
            <section className="container hero">
                <div className="hero-art" aria-hidden="true">
                    <div className="hero-tile hero-tile-1"><GameArt id="connect4" /></div>
                    <div className="hero-tile hero-tile-2"><GameArt id="tictactoe" /></div>
                    <span className="hero-disc hero-disc-red" />
                    <span className="hero-disc hero-disc-yellow" />
                </div>
                <span className="eyebrow">No sign-up · Free to play</span>
                <h1>Classic games.<br /><span className="hero-accent">Sharp opponents.</span></h1>
                <p className="hero-sub">
                    Challenge a friend on the same screen, or take on AIs from reckless to flawless.
                    Pick a name to get on the leaderboards.
                </p>
                <div className="hero-name" id="name">
                    {/* Remount when arriving via the header's name link so the field gets focus. */}
                    <NameForm key={location.key} username={username} setUsername={setUsername}
                        autoFocus={location.hash === '#name'} />
                </div>
            </section>

            <section className="container home-section" aria-labelledby="play-now">
                <div className="section-head">
                    <h2 id="play-now">Play now</h2>
                    <span className="section-count">{AVAILABLE_GAMES.length} games</span>
                </div>
                <div className="feature-grid">
                    {AVAILABLE_GAMES.map((game, i) => <FeatureCard key={game.id} game={game} index={i} />)}
                </div>
            </section>

            <section className="container home-section" aria-labelledby="coming-soon">
                <div className="section-head">
                    <h2 id="coming-soon">On the way</h2>
                    <span className="section-count">{comingSoon.length} in the works</span>
                </div>
                <div className="soon-grid">
                    {comingSoon.map((game) => <SoonCard key={game.id} game={game} />)}
                </div>
            </section>
        </div>
    );
};

export default HomePage;
