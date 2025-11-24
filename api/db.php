<?php

// Escape Game Base de Donnée - Les Joyaux du Louvre

class Database {
    private static $instance = null;
    private $connection;
    private $host;
    private $port;
    private $dbname;
    private $user;
    private $password;

    private function __construct() {
        $this->host = getenv('DB_HOST') ?: 'localhost';
        $this->port = getenv('DB_PORT') ?: '5439';
        $this->dbname = getenv('DB_NAME') ?: 'escape_game';
        $this->user = getenv('DB_USER') ?: 'postgres';
        $this->password = getenv('DB_PASSWORD') ?: 'postgres';
        
        try {
            $dsn = "pgsql:host={$this->host};port={$this->port};dbname={$this->dbname}";
            $this->connection = new PDO($dsn, $this->user, $this->password);
            $this->connection->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->connection->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            $this->connection->exec("SET NAMES 'UTF8'");
        } catch (PDOException $e) {
            die(json_encode([
                'error' => 'La connexion à la base de données a échoué',
                'message' => $e->getMessage()
            ]));
        }
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new Database();
        }
        return self::$instance;
    }

    public function getConnection() {
        return $this->connection;
    }


    public function query($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("Error dans la requete de la Base de Donnée: " . $e->getMessage());
            return false;
        }
    }


    public function queryOne($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetch();
        } catch (PDOException $e) {
            error_log("Error dans la requete de la Base de Donnée: " . $e->getMessage());
            return false;
        }
    }


    public function execute($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            return $stmt->execute($params);
        } catch (PDOException $e) {
            error_log("Error dans la mise en oeuvre de la Base de Donnée: " . $e->getMessage());
            return false;
        }
    }

    public function lastInsertId($sequence = null) {
        return $this->connection->lastInsertId($sequence);
    }
}

