import { useEffect, useRef } from 'react';
import { GameState } from '../interfaces/interfaces';
import { Side } from '../games';
import { sounds } from '../sound';

/** A click for each new piece, and a jingle when the game ends: a win or loss
 *  from `perspective`'s point of view (or a plain win jingle without one). */
export const useGameSounds = (state: GameState | null, perspective: Side | null, muted: boolean) => {
    const heard = useRef<{ game: string; moves: number; done: boolean } | null>(null);
    useEffect(() => {
        if (!state) return;
        const moves = state.history?.length ?? 0;
        const previous = heard.current;
        heard.current = { game: state.game_id, moves, done: state.done };
        // Stay quiet on the first load, when moves are taken back, and on a new game.
        if (!previous || previous.game !== state.game_id || muted || moves < previous.moves) return;
        if (moves > previous.moves) sounds.place(state.history[moves - 1].player);
        if (state.done && !previous.done) {
            const tune = !state.winner ? sounds.draw
                : perspective && state.winner !== perspective ? sounds.loss : sounds.win;
            window.setTimeout(tune, 180);
        }
    }, [state, muted, perspective]);
};
