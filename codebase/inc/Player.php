<?php
class Player {
	private $_data = array();
	private $_channel = null;
	
	private $_pos = array();
	private $_inventory = array();	

	public $lastActivity;

	public function __construct( $name ) {
		$name = preg_replace('/[^a-z0-9_\-\.]/ui', '', $name);
		$result = Server::$db->query("
			SELECT *
			FROM players
			WHERE name LIKE '$name';
		");
		$row = $result->fetchArray();
		if (!$row) {
			$result = Server::$db->query("
				INSERT INTO players
				(name) VALUES ('$name');
			");
			if ($result) {
				Server::log("Created new player: $name");
				$result = Server::$db->query("
					SELECT *
					FROM players
					WHERE name LIKE '$name';
				");
				$row = $result->fetchArray();
			}
		}
		// inventory
		$result = Server::$db->query("
			SELECT *
			FROM inventory
			WHERE `owner` = " . $row['id'] . ";
		");
		$this->_inventory = array();
		if ($result) {
			while ($r = $result->fetchArray()) {
				$this->_inventory[$r['item']] = $r['count'];
			}
		}
		$this->_data = $row;
		$this->touch();
	}

	public function touch() {
		$this->lastActivity = time();
	}
	
	public function getInventory() {
		return $this->_inventory;
	}

	public function setData( $index, $value ) {
		$this->_data[$index] = $value;
	}
	
	public function getData( $index ) {
		return ( array_key_exists( $index, $this->_data ) )
			? $this->_data[$index]
			: null;
	}
	
	public function setPos( $x, $y ) {
		$updateChunk = false;
		if (sizeof($this->_pos) != 0) {
			$old = $this->getPos();
			unset(Server::$map->players[$old['x'].','.$old['y']]);
			Server::$map->updateCoords($old['x'], $old['y']);
			$updateChunk = Server::$map->getChunk($old['x'], $old['y']);
		}
		Server::$map->players[$x.','.$y] = $this;
		$this->_pos = array(
			'x' => $x,
			'y' => $y
		);
		$newChunk = Server::$map->getChunk($x, $y);
		if ($updateChunk && ($updateChunk[0] == $newChunk[0] && $updateChunk[1] == $newChunk[1])) {
			Server::$map->updateChunk($updateChunk[0], $updateChunk[1]);
		} else if ($updateChunk) {
			Server::$map->updateChunk($updateChunk[0], $updateChunk[1]);
			Server::$map->updateChunk($newChunk[0], $newChunk[1]);
		} else {
			Server::$map->updateChunk($newChunk[0], $newChunk[1]);
		}
	}

	public function remove() {
		if (sizeof($this->_pos) != 0) {
			$old = $this->getPos();
			unset(Server::$map->players[$old['x'].','.$old['y']]);
			Server::$map->updateCoords($old['x'], $old['y']);
			Server::log("Removed player");

			Server::log_r(Server::$map->players);
		}
	}

	public function save() {
		/*$result = Server::$db->query("
			UPDATE players
			SET...
		");*/
		Server::$db->query("
			DELETE FROM inventory
			WHERE owner = " . $this->_data['id'] .";
		");
		foreach ($this->_inventory as $item=>$count) {
			Server::$db->query("
				INSERT INTO inventory (item, count, owner) VALUES ('" . $item . "', " . $count . ", " . $this->_data['id'] . ");
			");
		}
	}
	
	public function getPos() {
		return $this->_pos;
	}
	
	public function moveLeft() {
		$pos = $this->getPos();
		$pos['x']--;
		if ($pos['x'] < 0) {
			$pos['x'] = Server::$map->getWidth() - 1;
		}
		$this->setPos( $pos['x'], $pos['y'] );
	}
	
	public function moveUp() {
		$pos = $this->getPos();
		$pos['y']--;
		if ($pos['y'] < 0) {
			$pos['y'] = Server::$map->getHeight() - 1;
		}
		$this->setPos( $pos['x'], $pos['y'] );
	}
	
	public function moveDown() {
		$pos = $this->getPos();
		$pos['y']++;
		if ($pos['y'] >= Server::$map->getHeight()) {
			$pos['y'] = 0;
		}
		$this->setPos( $pos['x'], $pos['y'] );
	}
	
	public function moveRight() {
		$pos = $this->getPos();
		$pos['x']++;
		if ($pos['x'] >= Server::$map->getHeight()) {
			$pos['x'] = 0;
		}
		$this->setPos( $pos['x'], $pos['y'] );
	}
	
	public static function getPlayersCount() {
		$result = Server::$db->query("
			SELECT COUNT(*) AS c
			FROM players;
		");
		$row = $result->fetchArray();
		return $row['c'];
	}
	
	public static function validName($name) {
		return (preg_match('/[^a-z0-9_\-\.]/ui', $name) == 0);
	}
}
