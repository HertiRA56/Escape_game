<?php

// Escape Game API - Les Joyaux du Louvre


require 'vendor/autoload.php';
require 'db.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

Flight::set('flight.log_errors', true);

$db = Database::getInstance()->getConnection();

// Les objets visibles dans le début sont lesquelles avec depart=true

Flight::route('GET /api/objets', function() use ($db) {
    try {
        $sql = "
            SELECT 
                o.id,
                o.nom,
                o.description,
                o.type,
                o.min_zoom_visible,
                o.depart,
                ST_X(o.point) as longitude,
                ST_Y(o.point) as latitude,
                i.url as icone_url,
                i.taille_x as icone_width,
                i.taille_y as icone_height,
                i.anchor_x as icone_anchor_x,
                i.anchor_y as icone_anchor_y,
                oc.code,
                obpo.indice as indice_objet,
                obpo.id_bloque as bloque_par_objet_id,
                obpc.indice as indice_code,
                obpc.id_bloque as bloque_par_code_id
            FROM objet o
            LEFT JOIN icone i ON o.icone_id = i.id
            LEFT JOIN objet_code oc ON o.id = oc.id
            LEFT JOIN objet_bloque_par_objet obpo ON o.id = obpo.id
            LEFT JOIN objet_bloque_par_code obpc ON o.id = obpc.id
            WHERE o.depart = true
            ORDER BY o.id
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute();
        $objets = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Conversion en nombres
        foreach ($objets as &$objet) {
            $objet['id'] = (int)$objet['id'];
            $objet['latitude'] = (float)$objet['latitude'];
            $objet['longitude'] = (float)$objet['longitude'];
            $objet['min_zoom_visible'] = (int)$objet['min_zoom_visible'];
            $objet['depart'] = $objet['depart'] === 't' || $objet['depart'] === true;
            
            if (isset($objet['icone_width'])) {
                $objet['icone_width'] = (int)$objet['icone_width'];
                $objet['icone_height'] = (int)$objet['icone_height'];
                $objet['icone_anchor_x'] = (int)$objet['icone_anchor_x'];
                $objet['icone_anchor_y'] = (int)$objet['icone_anchor_y'];
            }
        }
        
        Flight::json(['success' => true, 'data' => $objets]);
    } catch (Exception $e) {
        Flight::json(['success' => false, 'error' => $e->getMessage()], 500);
    }
});


Flight::route('GET /api/objets/@id', function($id) use ($db) {
    $sql = "
            SELECT 
                o.id,
                o.nom,
                o.description,
                o.type,
                o.min_zoom_visible,
                o.depart,
                ST_X(o.point) as longitude,
                ST_Y(o.point) as latitude,
                i.url as icone_url,
                i.taille_x as icone_width,
                i.taille_y as icone_height,
                i.anchor_x as icone_anchor_x,
                i.anchor_y as icone_anchor_y,
                oc.code,
                obpo.indice as indice_objet,
                obpo.id_bloque as bloque_par_objet_id,
                obpc.indice as indice_code,
                obpc.id_bloque as bloque_par_code_id
            FROM objet o
            LEFT JOIN icone i ON o.icone_id = i.id
            LEFT JOIN objet_code oc ON o.id = oc.id
            LEFT JOIN objet_bloque_par_objet obpo ON o.id = obpo.id
            LEFT JOIN objet_bloque_par_code obpc ON o.id = obpc.id
            WHERE o.id = :id
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute([':id' => $id]);
        $objet = $stmt->fetch(PDO::FETCH_ASSOC);
        
     
        
        // Conversion en nombres
        $objet['id'] = (int)$objet['id'];
        $objet['latitude'] = (float)$objet['latitude'];
        $objet['longitude'] = (float)$objet['longitude'];
        $objet['min_zoom_visible'] = (int)$objet['min_zoom_visible'];
        $objet['depart'] = $objet['depart'] === 't' || $objet['depart'] === true;
        
        if (isset($objet['icone_width'])) {
            $objet['icone_width'] = (int)$objet['icone_width'];
            $objet['icone_height'] = (int)$objet['icone_height'];
            $objet['icone_anchor_x'] = (int)$objet['icone_anchor_x'];
            $objet['icone_anchor_y'] = (int)$objet['icone_anchor_y'];
        }
        
        Flight::json(['success' => true, 'data' => $objet]);

});

Flight::route('GET /api/objets/@id/bloquant', function($id) use ($db) {
    try {
        // Essai si l'objet est bloqué par autre objet
        $sql = "
            SELECT 
                obpo.indice,
                o.id,
                o.nom,
                o.description
            FROM objet_bloque_par_objet obpo
            JOIN objet o ON obpo.id_bloque = o.id
            WHERE obpo.id = :id
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute([':id' => $id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result) {
            $result['id'] = (int)$result['id'];
            Flight::json(['success' => true, 'data' => $result]);
            return;
        }
        
        // Confirmer si l'objet est bloqué par "code"
        $sql = "
            SELECT 
                obpc.indice,
                o.id,
                o.nom,
                o.description,
                oc.code
            FROM objet_bloque_par_code obpc
            JOIN objet o ON obpc.id_bloque = o.id
            JOIN objet_code oc ON o.id = oc.id
            WHERE obpc.id = :id
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute([':id' => $id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result) {
            $result['id'] = (int)$result['id'];
            
            unset($result['code']);
            Flight::json(['success' => true, 'data' => $result]);
            return;
        }
        
        Flight::json(['success' => false, 'error' => 'Object is not blocked'], 404);
    } catch (Exception $e) {
        Flight::json(['success' => false, 'error' => $e->getMessage()], 500);
    }
});

// Confirme si est le bon code pour debloqué l'objet

Flight::route('POST /api/objets/@id/verificar-codigo', function($id) use ($db) {
    try {
        $data = Flight::request()->data;
        $codeProvided = $data->code ?? '';
        
        // Le bon code
        $sql = "
            SELECT oc.code, obpc.libere_objet_id
            FROM objet_bloque_par_code obpc
            JOIN objet_code oc ON obpc.id_bloque = oc.id
            WHERE obpc.id = :id
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute([':id' => $id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$result) {
            Flight::json(['success' => false, 'error' => 'Objet non trouvé ou non bloqué par le code'], 404);
            return;
        }
        
        $isCorrect = $codeProvided === $result['code'];
        $response = [
            'success' => true,
            'correct' => $isCorrect
        ];
        
        if ($isCorrect && $result['libere_objet_id']) {
            $response['libere_objet_id'] = (int)$result['libere_objet_id'];
        }
        
        Flight::json($response);
    } catch (Exception $e) {
        Flight::json(['success' => false, 'error' => $e->getMessage()], 500);
    }
});

//Sauvegarder un nouveau score

Flight::route('POST /api/scores', function() use ($db) {
    try {
        $data = Flight::request()->data;
        
        $pseudo = trim($data->pseudo ?? '');
        $score = (int)($data->score ?? 0);
        $tempo = (int)($data->tempo ?? 0);
        
        // Valider
        if (empty($pseudo) || strlen($pseudo) > 20) {
            Flight::json(['success' => false, 'error' => 'Invalide (max 20 caracters)'], 400);
            return;
        }
        
        if ($score < 0) {
            $score = 0;
        }
        
        $sql = "INSERT INTO scores (pseudo, score, tempo) VALUES (:pseudo, :score, :tempo)";
        $stmt = $db->prepare($sql);
        $stmt->execute([
            ':pseudo' => $pseudo,
            ':score' => $score,
            ':tempo' => $tempo
        ]);
        
        Flight::json(['success' => true, 'message' => 'Score sauvegardé']);
    } catch (Exception $e) {
        Flight::json(['success' => false, 'error' => $e->getMessage()], 500);
    }
});

// Hall of Fame

Flight::route('GET /api/scores/top', function() use ($db) {
    try {
        $sql = "
            SELECT 
                pseudo,
                score,
                tempo,
                data_hora
            FROM scores
            ORDER BY score DESC, tempo ASC, data_hora ASC
            LIMIT 10
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute();
        $scores = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Convertir en nombres et format de temps
        foreach ($scores as &$scoreData) {
            $scoreData['score'] = (int)$scoreData['score'];
            $scoreData['tempo'] = (int)$scoreData['tempo'];
            
            // Temps comme  MM:SS
            $minutes = floor($scoreData['tempo'] / 60);
            $seconds = $scoreData['tempo'] % 60;
            $scoreData['tempo_formatado'] = sprintf('%02d:%02d', $minutes, $seconds);
        }
        
        Flight::json(['success' => true, 'data' => $scores]);
    } catch (Exception $e) {
        Flight::json(['success' => false, 'error' => $e->getMessage()], 500);
    }
});

Flight::map('notFound', function() {
    Flight::json(['success' => false, 'error' => 'Route non trouvée'], 404);
});

Flight::start();

