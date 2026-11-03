import React, { useEffect, useRef } from 'react';
import { AvailableGame } from '../games';
import { X } from './Icons';
import './ShortcutsPopover.css';

interface ShortcutsPopoverProps {
    game: AvailableGame;
    onClose: () => void;
}

const ShortcutsPopover: React.FC<ShortcutsPopoverProps> = ({ game, onClose }) => {
    const ref = useRef<HTMLDivElement>(null);

    // Close on a click outside.
    useEffect(() => {
        const onPointer = (event: PointerEvent) => {
            const anchor = ref.current?.parentElement;
            if (anchor && !anchor.contains(event.target as Node)) onClose();
        };
        document.addEventListener('pointerdown', onPointer);
        return () => document.removeEventListener('pointerdown', onPointer);
    }, [onClose]);

    const rows: [string, string][] = [
        ...(game.keyMovesHelp ? [[game.id === 'connect4' ? '1 – 7' : '1 – 9', game.keyMovesHelp] as [string, string]] : []),
        ['Tab · Enter', 'Move between squares and play'],
        ['H', 'Hint'],
        ['Ctrl/⌘ Z', 'Undo'],
        ['R', 'Restart'],
        ['M', 'Sound on/off'],
        ['?', 'Show or hide this list'],
    ];

    return (
        <div ref={ref} className="shortcuts-popover" role="dialog" aria-label="Keyboard shortcuts">
            <header>
                <strong>Keyboard shortcuts</strong>
                <button type="button" className="toast-close" onClick={onClose} aria-label="Close"><X /></button>
            </header>
            <dl>
                {rows.map(([keys, what]) => (
                    <React.Fragment key={keys}>
                        <dt><kbd>{keys}</kbd></dt>
                        <dd>{what}</dd>
                    </React.Fragment>
                ))}
            </dl>
        </div>
    );
};

export default ShortcutsPopover;
