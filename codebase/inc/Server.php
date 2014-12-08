<?php
require_once( CWD . '/inc/Map.php' );
require_once( CWD . '/inc/Player.php' );

use Pubnub\Pubnub;

class Server {
	public static $db = null;
	public static $map = null;
	public static $instance;
	
	private $_players = array();
	private $_pubnub;
	private $_config = array();
	
	public function __construct( $config ) {
		Server::log( 'Players in database: ' . Player::getPlayersCount() );
	
		$this->_pubnub = new Pubnub( $config['pubnub'] );
		Server::log( 'Pubnub test timetoken: ' . $this->_pubnub->time() );
		$this->_config = $config;
		Server::$instance = $this;
	}
	
	public static function setDatabase( $path ) {
		if ( is_file($path) ) {
			Server::$db = new SQLite3( $path );
		} else {
			Server::$db = new SQLite3( $path );
			Server::$db->query("
				CREATE TABLE `players` (
					`id`	INTEGER PRIMARY KEY AUTOINCREMENT,
					`name`	TEXT NOT NULL UNIQUE
				);
			");
			Server::$db->query("
				CREATE TABLE `inventory` (
					`id`	INTEGER PRIMARY KEY AUTOINCREMENT,
					`item`	TEXT NOT NULL,
					`count` INTEGER,
					`owner` INTEGER
				);
			");
		}
	}
	
	public function init() {
		// Веселье
		$history = $this->_pubnub->history($this->_config['channel'], 10);
		Server::log( 'Subscribing to Pubnub on channel ' . $this->_config['channel']  . '...' );
		$this->_pubnub->subscribe($this->_config['channel'], function( $message ) {
			//Server::log_r( $message );
			if (array_key_exists('message', $message)) {
				if (array_key_exists('do', $message['message'])) {
					$d = $message['message'];
					switch ($d['do']) {
					
						case 'stop' : {
							$this->stop();
							return false;
						}
						
						case 'connect' : {
							if (!Player::validName($d['name'])) {
								$this->message(array(
									'for' => $d['name'],
									'type' => 'onConnect',
									'status' => 'error',
									'message' => 'Invalid player name'
								));
								return true;
							}
							$p = $this->getPlayer( $d['name'] );
							Server::log("Getting spawn point:");
							$spawn = Server::$map->getSpawnPoint();
							Server::log("Spawn point got...");
							$p->setPos($spawn['x'], $spawn['y']);
							$this->message(array(
								'for' => $d['name'],
								'type' => 'onConnect',
								'status' => 'success',
								'pos' => array($spawn['x'], $spawn['y']),
								'inventory' => $p->getInventory(),
								'mapSize' => array(Server::$map->getWidth(), Server::$map->getHeight()),
								'chunkSize' => Map::CHUNK_SIZE
							));
							$p->touch();
							$this->checkUnactivePlayers();
							Server::log("Player with name " . $d['name'] . " connected");
							return true;
						}

						case 'action' : {
							$p = $this->getPlayer( $d['name'] );
							$p->touch();
							$this->checkUnactivePlayers();
							switch ($d['data']['type']) {
								case 'move' : {
									if (array_key_exists('direction', $d['data'])) {
										switch($d['data']['direction']) {
											case 'up' : {
												$p->moveUp();
												break;
											}
											case 'down' : {
												$p->moveDown();
												break;
											}
											case 'left' : {
												$p->moveLeft();
												break;
											}
											case 'right' : {
												$p->moveRight();
												break;
											}
											default : {
												$this->message(array(
													'for' => $d['name'],
													'type' => 'onAction',
													'status' => 'error',
													'action' => $d['data'],
													'message' => 'Invalid move direction'
												));
												return true;
											}
										}									
										$this->message(array(
											'for' => $d['name'],
											'type' => 'onAction',
											'hash' => $d['hash'],
											'action' => $d['data'],
											'status' => 'success',
											'pos' => $p->getPos()
										));
									} else {
										$this->message(array(
											'for' => $d['name'],
											'type' => 'onAction',
											'status' => 'error',
											'action' => $d['data'],
											'message' => 'Direction not defined'
										));
										return true;
									}
									break;
								}
								case 'put' : {
									$pos = $p->getPos();
									$e = $d['data']['e'];
									$t = $d['data']['t'];
									
									Server::$map->setTerrain($pos['x'], $pos['y'], $t);
									Server::$map->setElement($pos['x'], $pos['y'], $e);
									Server::$map->updateCoords($pos['x'], $pos['y']);
									$this->message(array(
										'for' => $d['name'],
										'type' => 'onAction',
										'hash' => $d['hash'],
										'action' => $d['data'],
										'status' => 'success',
										'pos' => $p->getPos()
									));
								}
								case 'take' : {
									$pos = $p->getPos();
									
									Server::$map->setElement($pos['x'], $pos['y'], null);
									Server::$map->updateCoords($pos['x'], $pos['y']);

									$this->message(array(
										'for' => $d['name'],
										'type' => 'onAction',
										'hash' => $d['hash'],
										'action' => $d['data'],
										'status' => 'success',
										'pos' => $p->getPos()
									));
								}
								default : {
									$this->message(array(
										'for' => $d['name'],
										'type' => 'onAction',
										'hash' => $d['hash'],
										'status' => 'error',
										'action' => $d['data'],
										'message' => 'Action ' . $d['data']['type'] . ' not found'
									));
								}
							}
							Server::log("Player with name " . $d['name'] . " performed action " . $d['data']['type'] );
							return true;
						}

						case 'disconnect' : {
							$p = $this->getPlayer( $d['name'] );
							$p->remove();
							Server::log("Player with name " . $d['name'] . " disconnected");
							return true;
						}
					}				
				}
			} else {
				Server::log( "Wrong message format" );
			}
			return true;
		});
		Server::log( 'End.' );
	}
	
	public function stop() {
		Server::log("Server stopping...");
		foreach ($this->_players as $p) {
			$p->save();
		}
		$src = opendir("public/map");
		while ($obj = readdir($src)) {
			if (is_file("public/map/" . $obj)) {
				@unlink("public/map/" . $obj);
			}
		}
		Server::log("Server stoped");
	}

	public function checkUnactivePlayers() {
		foreach ($this->_players as $p) {
			if (time() - $p->lastActivity > 60) {
				$p->save();
				$p->remove();
			}
		}
	}

	// Получить объект игрока
	public function getPlayer( $name ) {
		$name = preg_replace('/[^a-z0-9_\-\.]/ui', '', $name);
		if (strlen($name) < 2 || strlen($name) > 32) {
			throw new Exception( "Invalid player name - must be 2-32 chars length and contain only a-z, A-Z, 0-9, '-', '_', '.'" );
		}
		if (!array_key_exists( $name, $this->_players )) {
			$this->_players[ $name ] = new Player( $name );
		}
		return $this->_players[ $name ];
	}
	
	public function message( $message ) {
		$publish_result = $this->_pubnub->publish($this->_config['channel'], $message);
		//Server::log( 'Broadcast: ' . print_r( $publish_result, true ), 'out' );
	}

	// --------------------------------
	
	public static function log($message, $type = 'info') {
		echo date('H:i:s') . ' ' . ( ( $type != 'info' ) ? '[' . $type . '] ' : '' ) . $message . "\n";
		
		$src = fopen('server_log.txt', 'a');
		fwrite($src, date('d.m.Y H:i:s') . ' | ' . ( ( $type != 'info' ) ? '[' . $type . '] ' : '' ) . $message . "\n");
		fclose($src);
	}
	
	public static function log_r($object) {
		$strArr = explode("\n", print_r($object, true));
		foreach ($strArr as $str) {
			Server::log($str, 'dump');
		}
	}
	
	public static function printMemoryUsage() {
		Server::log( '', 'debug' );
		Server::log( '============= Memory info ==============', 'debug' );
		Server::log( 'Memory limit:   ' . ini_get("memory_limit"), 'debug' );
		
		Server::log( 'Allocated:      ' . number_format( memory_get_usage(false) ) . 'b', 'debug' );
		Server::log( 'Used:           ' . number_format( memory_get_usage(true) ) . 'b', 'debug' );
		Server::log( 'Peak allocated: ' . number_format( memory_get_peak_usage(false) ) . 'b', 'debug' );
		Server::log( 'Peak used:      ' . number_format( memory_get_peak_usage(true) ) . 'b', 'debug' );
		Server::log( '========================================', 'debug' );
		Server::log( '', 'debug' );
	}
}
