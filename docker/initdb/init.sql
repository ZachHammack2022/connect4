CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    wins INT DEFAULT 0,
    losses INT DEFAULT 0
);