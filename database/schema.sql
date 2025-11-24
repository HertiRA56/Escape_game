-- Escape Game: Les Joyaux du Louvre

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE icone (
    id SERIAL PRIMARY KEY,
    url VARCHAR(255) NOT NULL,
    taille_x INTEGER NOT NULL DEFAULT 32,
    taille_y INTEGER NOT NULL DEFAULT 32,
    anchor_x INTEGER NOT NULL DEFAULT 16,
    anchor_y INTEGER NOT NULL DEFAULT 32
);

CREATE TABLE objet (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    description TEXT,
    point GEOMETRY(POINT, 4326) NOT NULL, 
    icone_id INTEGER REFERENCES icone(id) ON DELETE SET NULL,
    min_zoom_visible INTEGER NOT NULL DEFAULT 10,
    depart BOOLEAN NOT NULL DEFAULT FALSE, -- true si l'objet est visible dans le début du jeu
    type VARCHAR(50) NOT NULL CHECK (type IN ('recuperable', 'code', 'bloque_par_objet', 'bloque_par_code'))
);

CREATE INDEX idx_objet_point ON objet USING GIST(point);

CREATE TABLE objet_recuperable (
    id INTEGER PRIMARY KEY REFERENCES objet(id) ON DELETE CASCADE
);

CREATE TABLE objet_code (
    id INTEGER PRIMARY KEY REFERENCES objet(id) ON DELETE CASCADE,
    code CHAR(4) NOT NULL CHECK (code ~ '^[0-9]{4}$')
);

CREATE TABLE objet_bloque_par_objet (
    id INTEGER PRIMARY KEY REFERENCES objet(id) ON DELETE CASCADE,
    indice TEXT NOT NULL,
    id_bloque INTEGER NOT NULL REFERENCES objet_recuperable(id) ON DELETE CASCADE,
    libere_objet_id INTEGER REFERENCES objet(id) ON DELETE SET NULL
);

CREATE TABLE objet_bloque_par_code (
    id INTEGER PRIMARY KEY REFERENCES objet(id) ON DELETE CASCADE,
    indice TEXT NOT NULL,
    id_bloque INTEGER NOT NULL REFERENCES objet_code(id) ON DELETE CASCADE,
    libere_objet_id INTEGER REFERENCES objet(id) ON DELETE SET NULL
);

CREATE TABLE scores (
    id SERIAL PRIMARY KEY,
    pseudo VARCHAR(20) NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0),
    tempo INTEGER NOT NULL, -- temps en seconds
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_scores_order ON scores(score DESC, tempo ASC, data_hora ASC);

