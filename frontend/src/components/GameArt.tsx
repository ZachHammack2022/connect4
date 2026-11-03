import React from 'react';

// Illustrations for the game cards. Neutral strokes use theme tokens so they
// read in light and dark mode.
const ink = { stroke: 'var(--art-ink)' };

const art: Record<string, React.ReactNode> = {
    connect4: (
        <>
            <defs>
                <linearGradient id="c4-art-board" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#4a68ff" />
                    <stop offset="1" stopColor="#2a43d6" />
                </linearGradient>
            </defs>
            <rect x="6" y="14" width="88" height="74" rx="10" fill="url(#c4-art-board)" />
            {[0, 1, 2, 3, 4].map((col) => [0, 1, 2, 3].map((row) => {
                const filled: Record<string, string> = {
                    '0-3': '#ffc23d', '1-3': '#ff4d5e', '1-2': '#ffc23d', '2-3': '#ff4d5e', '2-2': '#ff4d5e',
                    '2-1': '#ffc23d', '3-3': '#ffc23d', '3-2': '#ff4d5e', '3-1': '#ff4d5e', '4-3': '#ffc23d',
                    '4-2': '#ffc23d', '4-1': '#ffc23d', '4-0': '#ff4d5e',
                };
                const fill = filled[`${col}-${row}`];
                return <circle key={`${col}-${row}`} cx={20 + col * 15} cy={27 + row * 16} r="5.6"
                    fill={fill ?? '#141b4d'} />;
            }))}
            <circle cx="50" cy="6" r="5.6" fill="#ff4d5e" />
        </>
    ),
    tictactoe: (
        <g strokeLinecap="round" fill="none">
            <g strokeWidth="3.5" style={ink}>
                <line x1="38" y1="14" x2="38" y2="86" /><line x1="62" y1="14" x2="62" y2="86" />
                <line x1="14" y1="38" x2="86" y2="38" /><line x1="14" y1="62" x2="86" y2="62" />
            </g>
            <g stroke="#38c8ff" strokeWidth="6.5">
                <line x1="19" y1="19" x2="31" y2="31" /><line x1="31" y1="19" x2="19" y2="31" />
                <line x1="44" y1="44" x2="56" y2="56" /><line x1="56" y1="44" x2="44" y2="56" />
                <line x1="69" y1="69" x2="81" y2="81" /><line x1="81" y1="69" x2="69" y2="81" />
            </g>
            <g stroke="#ff5fae" strokeWidth="6.5"><circle cx="75" cy="25" r="7.5" /><circle cx="25" cy="75" r="7.5" /></g>
            <line x1="14" y1="14" x2="86" y2="86" stroke="#38c8ff" strokeWidth="3" opacity="0.5" />
        </g>
    ),
    reversi: (
        <>
            <rect x="12" y="12" width="76" height="76" rx="10" fill="#17a35b" />
            <g stroke="#0d7a42" strokeWidth="1.5">
                <line x1="50" y1="12" x2="50" y2="88" /><line x1="12" y1="50" x2="88" y2="50" />
                <line x1="31" y1="12" x2="31" y2="88" /><line x1="69" y1="12" x2="69" y2="88" />
                <line x1="12" y1="31" x2="88" y2="31" /><line x1="12" y1="69" x2="88" y2="69" />
            </g>
            <circle cx="40.5" cy="40.5" r="7.5" fill="#f8fafc" /><circle cx="59.5" cy="40.5" r="7.5" fill="#111827" />
            <circle cx="40.5" cy="59.5" r="7.5" fill="#111827" /><circle cx="59.5" cy="59.5" r="7.5" fill="#f8fafc" />
        </>
    ),
    checkers: (
        <>
            {[0, 1, 2, 3].map((r) => [0, 1, 2, 3].map((c) => (
                <rect key={`${r}-${c}`} x={12 + c * 19} y={12 + r * 19} width="19" height="19"
                    fill={(r + c) % 2 ? '#7a2e14' : '#f3d9a4'} />
            )))}
            <rect x="12" y="12" width="76" height="76" rx="2" fill="none" stroke="#5a200d" strokeWidth="2" />
            <circle cx="40.5" cy="21.5" r="6.5" fill="#111827" /><circle cx="78.5" cy="40.5" r="6.5" fill="#111827" />
            <circle cx="21.5" cy="78.5" r="6.5" fill="#ff4d5e" /><circle cx="59.5" cy="59.5" r="6.5" fill="#ff4d5e" />
            <circle cx="59.5" cy="59.5" r="3" fill="none" stroke="#ffd7db" strokeWidth="1.5" />
        </>
    ),
    'dots-and-boxes': (
        <>
            <rect x="22" y="22" width="28" height="28" rx="2" fill="#2fa7d8" opacity="0.45" />
            <rect x="50" y="50" width="28" height="28" rx="2" fill="#ff5fae" opacity="0.4" />
            <g strokeWidth="3.5" strokeLinecap="round" style={ink}>
                <line x1="22" y1="22" x2="50" y2="22" /><line x1="22" y1="22" x2="22" y2="50" />
                <line x1="50" y1="22" x2="50" y2="50" /><line x1="22" y1="50" x2="50" y2="50" />
                <line x1="50" y1="50" x2="78" y2="50" /><line x1="78" y1="50" x2="78" y2="78" />
                <line x1="50" y1="78" x2="78" y2="78" /><line x1="50" y1="50" x2="50" y2="78" />
                <line x1="78" y1="22" x2="78" y2="50" />
            </g>
            {[22, 50, 78].map((x) => [22, 50, 78].map((y) => (
                <circle key={`${x}-${y}`} cx={x} cy={y} r="4.5" style={{ fill: 'var(--art-dot)' }} />
            )))}
        </>
    ),
    gomoku: (
        <>
            <rect x="10" y="10" width="80" height="80" rx="6" fill="#e2b46a" />
            <g stroke="#8a5a1c" strokeWidth="1.2">
                {[22, 36, 50, 64, 78].map((v) => (
                    <React.Fragment key={v}><line x1={v} y1="16" x2={v} y2="84" /><line x1="16" y1={v} x2="84" y2={v} /></React.Fragment>
                ))}
            </g>
            {[22, 36, 50, 64, 78].map((v) => <circle key={v} cx={v} cy={v} r="5.5" fill="#111827" />)}
            <circle cx="64" cy="36" r="5.5" fill="#f8fafc" /><circle cx="36" cy="64" r="5.5" fill="#f8fafc" />
            <circle cx="78" cy="50" r="5.5" fill="#f8fafc" />
        </>
    ),
};

const GameArt: React.FC<{ id: string }> = ({ id }) => (
    <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true" className="game-art">{art[id]}</svg>
);

export default GameArt;
