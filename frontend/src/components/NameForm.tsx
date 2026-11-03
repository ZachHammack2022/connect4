import React, { useEffect, useRef, useState } from 'react';
import { Pencil } from './Icons';
import './NameForm.css';

interface NameFormProps {
    username: string;
    setUsername: (name: string) => void;
    // Start in edit mode and focus the field (e.g. arriving from "Set your name").
    autoFocus?: boolean;
    compact?: boolean;
}

export const Avatar: React.FC<{ name: string; size?: number }> = ({ name, size = 36 }) => {
    // A stable hue per name, so each player keeps their colour.
    const hue = name.split('').reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 360, 7);
    return (
        <span className="avatar" aria-hidden="true"
            style={{ width: size, height: size, fontSize: size * 0.42, background: `hsl(${hue} 70% 58%)` }}>
            {name.trim().charAt(0).toUpperCase() || '?'}
        </span>
    );
};

const NameForm: React.FC<NameFormProps> = ({ username, setUsername, autoFocus = false, compact = false }) => {
    const [editing, setEditing] = useState(!username || autoFocus);
    const [name, setName] = useState(username);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (autoFocus) {
            setEditing(true);
            // Wait for the input to render before focusing it.
            requestAnimationFrame(() => inputRef.current?.focus());
        }
    }, [autoFocus]);

    if (!editing && username) {
        return (
            <div className={`name-form name-display ${compact ? 'compact' : ''}`}>
                <Avatar name={username} size={compact ? 30 : 36} />
                <div className="name-display-text">
                    <span className="name-display-label">Playing as</span>
                    <strong>{username}</strong>
                </div>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setName(username); setEditing(true); }}>
                    <Pencil /> Edit
                </button>
            </div>
        );
    }

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) return;
        setUsername(trimmed);
        setEditing(false);
    };

    return (
        <form className={`name-form name-edit ${compact ? 'compact' : ''}`} onSubmit={submit}>
            <label className="visually-hidden" htmlFor={compact ? 'name-input-compact' : 'name-input'}>Your name</label>
            <input ref={inputRef} id={compact ? 'name-input-compact' : 'name-input'} className="input" value={name}
                onChange={(e) => setName(e.target.value)} maxLength={255} placeholder="Your name"
                autoComplete="nickname" />
            <button type="submit" className="btn btn-primary" disabled={!name.trim()}>Save</button>
            {username && (
                <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
            )}
        </form>
    );
};

export default NameForm;
