import React from 'react';

// Small illustrations for the game cards on the home page.
const art: Record<string, React.ReactNode> = {
    connect4: (
        <>
            <rect x="4" y="10" width="92" height="80" rx="8" fill="#2563eb" />
            {[0, 1, 2, 3, 4].map((col) => [0, 1, 2, 3].map((row) => {
                const filled: Record<string, string> = {
                    '1-3': '#dc2626', '2-3': '#eab308', '2-2': '#dc2626', '3-3': '#dc2626',
                    '3-2': '#eab308', '3-1': '#dc2626', '4-3': '#eab308', '4-2': '#eab308', '4-1': '#eab308', '4-0': '#dc2626',
                };
                return <circle key={`${col}-${row}`} cx={18 + col * 16} cy={22 + row * 19} r="6.5"
                    fill={filled[`${col}-${row}`] ?? '#0f172a'} />;
            }))}
        </>
    ),
    tictactoe: (
        <g stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" fill="none">
            <line x1="38" y1="12" x2="38" y2="88" /><line x1="62" y1="12" x2="62" y2="88" />
            <line x1="14" y1="38" x2="86" y2="38" /><line x1="14" y1="62" x2="86" y2="62" />
            <g stroke="#38bdf8" strokeWidth="6"><line x1="18" y1="18" x2="32" y2="32" /><line x1="32" y1="18" x2="18" y2="32" />
                <line x1="44" y1="44" x2="56" y2="56" /><line x1="56" y1="44" x2="44" y2="56" /></g>
            <g stroke="#f472b6" strokeWidth="6"><circle cx="74" cy="25" r="8" /><circle cx="25" cy="74" r="8" /></g>
        </g>
    ),
    reversi: (
        <>
            <rect x="10" y="10" width="80" height="80" rx="6" fill="#15803d" />
            <circle cx="40" cy="40" r="11" fill="#f8fafc" /><circle cx="60" cy="40" r="11" fill="#0f172a" />
            <circle cx="40" cy="60" r="11" fill="#0f172a" /><circle cx="60" cy="60" r="11" fill="#f8fafc" />
        </>
    ),
    checkers: (
        <>
            {[0, 1, 2, 3].map((r) => [0, 1, 2, 3].map((c) => (
                <rect key={`${r}-${c}`} x={10 + c * 20} y={10 + r * 20} width="20" height="20"
                    fill={(r + c) % 2 ? '#7c2d12' : '#fde68a'} />
            )))}
            <circle cx="40" cy="20" r="7" fill="#0f172a" /><circle cx="80" cy="40" r="7" fill="#0f172a" />
            <circle cx="20" cy="80" r="7" fill="#dc2626" /><circle cx="60" cy="60" r="7" fill="#dc2626" />
        </>
    ),
    'dots-and-boxes': (
        <>
            <rect x="22" y="22" width="28" height="28" fill="#38bdf8" opacity="0.4" />
            <g stroke="#94a3b8" strokeWidth="4" strokeLinecap="round">
                <line x1="22" y1="22" x2="50" y2="22" /><line x1="22" y1="22" x2="22" y2="50" />
                <line x1="50" y1="22" x2="50" y2="50" /><line x1="22" y1="50" x2="50" y2="50" />
                <line x1="50" y1="50" x2="78" y2="50" /><line x1="78" y1="22" x2="78" y2="50" />
            </g>
            {[22, 50, 78].map((x) => [22, 50, 78].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="4.5" fill="#e2e8f0" />))}
        </>
    ),
    gomoku: (
        <>
            <rect x="8" y="8" width="84" height="84" rx="4" fill="#d6a85c" />
            <g stroke="#78350f" strokeWidth="1.5">
                {[20, 35, 50, 65, 80].map((v) => <React.Fragment key={v}><line x1={v} y1="14" x2={v} y2="86" /><line x1="14" y1={v} x2="86" y2={v} /></React.Fragment>)}
            </g>
            {[20, 35, 50, 65, 80].map((v, i) => <circle key={v} cx={v} cy={v} r="6" fill={i === 4 ? '#f8fafc' : '#0f172a'} />)}
        </>
    ),
};

const GameArt: React.FC<{ id: string }> = ({ id }) => (
    <svg viewBox="0 0 100 100" width="100%" height="100%" role="img" aria-hidden="true">{art[id]}</svg>
);

export default GameArt;
