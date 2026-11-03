import { useCallback, useEffect, useRef, useState } from 'react';
import * as api from './useApi';
import { LeaderboardEntry, LeaderboardFilter, OpponentSummary } from '../interfaces/interfaces';

/** A game's leaderboard, optionally narrowed to one AI opponent and difficulty. */
export const useLeaderboard = (gameType: string) => {
    const [rows, setRows] = useState<LeaderboardEntry[]>([]);
    const [opponents, setOpponents] = useState<OpponentSummary[]>([]);
    const [filter, setFilter] = useState<LeaderboardFilter | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    // Ignore responses that arrive after a newer request.
    const requestId = useRef(0);

    const refresh = useCallback(async () => {
        const id = ++requestId.current;
        setLoading(true);
        try {
            const [nextRows, nextOpponents] = await Promise.all([
                api.fetchLeaderboard(gameType, filter),
                api.fetchOpponents(gameType),
            ]);
            if (id !== requestId.current) return;
            setRows(nextRows);
            setOpponents(nextOpponents);
            setError(false);
        } catch {
            if (id === requestId.current) setError(true);
        } finally {
            if (id === requestId.current) setLoading(false);
        }
    }, [gameType, filter]);

    useEffect(() => { refresh(); }, [refresh]);

    return { rows, opponents, filter, setFilter, loading, error, refresh };
};
