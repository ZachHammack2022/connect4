CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    game_type VARCHAR(50) NOT NULL DEFAULT 'connect4',
    wins INT NOT NULL DEFAULT 0,
    losses INT NOT NULL DEFAULT 0,
    draws INT NOT NULL DEFAULT 0,
    current_streak INT NOT NULL DEFAULT 0,
    best_streak INT NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX games_username_game_type_key ON games (username, game_type);

CREATE TABLE game_results (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    game_type VARCHAR(50) NOT NULL,
    opponent VARCHAR(50) NOT NULL,
    difficulty VARCHAR(10),
    outcome VARCHAR(4) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX game_results_game_opponent ON game_results (game_type, opponent, difficulty);
