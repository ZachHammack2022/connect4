CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    game_type VARCHAR(50) NOT NULL DEFAULT 'connect4',
    wins INT NOT NULL DEFAULT 0,
    losses INT NOT NULL DEFAULT 0,
    draws INT NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX games_username_game_type_key ON games (username, game_type);
