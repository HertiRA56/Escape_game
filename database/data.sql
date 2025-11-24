-- Escape Game: Les Joyaux du Louvre

INSERT INTO icone (id, url, taille_x, taille_y, anchor_x, anchor_y) VALUES
(1, 'images/icons/key.png', 32, 32, 16, 32),
(2, 'images/icons/paper.png', 32, 32, 16, 32),
(3, 'images/icons/alarm.png', 40, 40, 20, 40),
(4, 'images/icons/crane.png', 48, 48, 24, 48),
(5, 'images/icons/jewels.png', 40, 40, 20, 40);

SELECT setval('icone_id_seq', 5, true);
SELECT setval('objet_id_seq', 0, false);

-- Objet 1 : Clé de la Grue (Récupérable, Objet de Départ)
-- Localisation : Cimetière de Paris (48.88836540133789, 2.328393915186057)
INSERT INTO objet (id, nom, description, point, icone_id, min_zoom_visible, depart, type) VALUES
(1, 'Clé de la Grue', 'La clé que votre partenaire a cachée au cimetière. Elle sera utile pour activer la grue au musée.', 
 ST_SetSRID(ST_MakePoint(2.328393915186057, 48.88836540133789), 4326), 1, 12, true, 'recuperable');

INSERT INTO objet_recuperable (id) VALUES (1);

-- Objet 2 : Papier du Code de l'Alarme (Objet Code, Objet de Départ)
-- Localisation : Hôtel de Ville (48.85654357879206, 2.3531085053245455)
INSERT INTO objet (id, nom, description, point, icone_id, min_zoom_visible, depart, type) VALUES
(2, "Papier du Code de l'Alarme", "L'ancien employé du musée travaille ici. Il a noté le code du système d'alarme sur un papier."
 ST_SetSRID(ST_MakePoint(2.3531085053245455, 48.85654357879206), 4326), 2, 12, true, 'code');

INSERT INTO objet_code (id, code) VALUES (2, '1804');

-- Objet 3 : Système d'Alarme (Bloqué par Code, Objet de Départ)
-- Localisation : "Parc près du Panthéon", dans le 5ème (48.84697997247963, 2.333603139859797)
INSERT INTO objet (id, nom, description, point, icone_id, min_zoom_visible, depart, type) VALUES
(3, "Système d'Alarme", "Le hacker attend dans le parc. Il a besoin du code pour désactiver l'alarme du musée.", 
 ST_SetSRID(ST_MakePoint(2.333603139859797, 48.84697997247963), 4326), 3, 12, true, 'bloque_par_code');

INSERT INTO objet_bloque_par_code (id, indice, id_bloque, libere_objet_id) VALUES 
(3, "Le hacker a besoin du code à 4 chiffres de l'alarme. Cherchez l'ancien employé du musée qui travaille à la préfecture.", 2, 4);

-- Objet 4 : Grue (Bloqué par Objet, Objet non de Départ)
-- Localisation : Musée du Louvre (48.86226727765453, 2.3365745110427834)
INSERT INTO objet (id, nom, description, point, icone_id, min_zoom_visible, depart, type) VALUES
(4, 'Grue', "La grue qui va vous aider à accéder aux bijoux. Mais elle est verrouillée, vous avez besoin de la clé pour l'activer.",  
 ST_SetSRID(ST_MakePoint(2.3365745110427834, 48.86226727765453), 4326), 4, 13, false, 'bloque_par_objet');

INSERT INTO objet_bloque_par_objet (id, indice, id_bloque, libere_objet_id) VALUES 
(4, "Vous avez besoin de la clé de la grue pour l'activer. Votre partenaire a caché la clé dans un cimetière de Paris.", 1, 5);

-- Objet 5 : Bijoux de Napoléon (Récupérable, Objet non de Départ, OBJET FINAL)
-- Localisation : Musée du Louvre (48.86226727765453, 2.3365745110427834)
INSERT INTO objet (id, nom, description, point, icone_id, min_zoom_visible, depart, type) VALUES
(5, 'Bijoux de Napoléon', "Les magnifiques bijoux de Napoléon ! L'objectif de votre mission. Prenez-les et échappez-vous !", 
 ST_SetSRID(ST_MakePoint(2.3365745110427834, 48.86226727765453), 4326), 5, 13, false, 'recuperable');


INSERT INTO objet_recuperable (id) VALUES (5);

-- Réinitialiser la séquence sur le prochain ID disponible
SELECT setval('objet_id_seq', 5, true);

