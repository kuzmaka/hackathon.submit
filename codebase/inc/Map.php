<?php
class Map {
	const CHUNK_SIZE = 10;

	private $_width;
	private $_height;
	
	private $_terrain = array();
	private $_elements = array();
	
	public $players = array();
	
	private $_map = array();			// map[x][y]['t'] / map[x][y]['e']		(terrain/element)
	private $_mapByTerrain = array();	// Массивы координат по поверхностях
	
	public function addTerrain( $name, $parameters ) {
		$this->_terrain[ $name ] = $parameters;
	}

	public function isTerrainTypeExists( $type ) {
		return array_key_exists($type, $this->_terrain);
	}
	
	public function addElement( $name, $parameters ) {
		$this->_elements[ $name ] = $parameters;
	}
	
	public function getWidth() {
		return $this->_width;
	}
	
	public function getHeight() {
		return $this->_height;
	}
	
	/*
		Сгенерировать карту
		$brushSize - размер кисти (минимум 1) - чем больше значение, тем менее "рваная" карта получится, но при больших значениях некоторые виды поверхностей могут не влезть
	*/
	public function generate($width = 100, $height = 100, $brushSize = 1) {
		if ($width < 1 || $height < 1) {
			throw new Exception("Wrong map size - must be at least 1x1");
		}
		if (sizeof($this->_terrain) == 0) {
			throw new Exception("Add some terrain first");
		}
		if (sizeof($this->_elements) == 0) {
			throw new Exception("Add some elements first");
		}
		if ($width % Map::CHUNK_SIZE != 0 || $height % Map::CHUNK_SIZE != 0) {
			throw new Exception("Width and height must be %" . Map::CHUNK_SIZE);
		}		

		Server::log('Started map generation...');
		
		$_mgst = microtime(true);
		
		$this->_width = $width;
		$this->_height = $height;
		
		$freeTiles = array();
		for ($x = 0; $x < $width; $x++) {
			$this->_map[$x] = array();
			for ($y = 0; $y < $height; $y++) {
				$this->_map[$x][$y] = array(
					't' => null,
					'e' => null
				);
				$freeTiles[$x.','.$y] = array($x, $y);
			}
		}
		
		Server::log('Area: ' . number_format(sizeof($freeTiles)) . ' tiles');
		
		shuffle($freeTiles);
		
		$terrainsByDensity = array();
		foreach ($this->_terrain as $name => $t) {
			for ($i=0; $i<$t['density']; $i++) {
				$terrainsByDensity[] = $name;
			}
		}
		$maxTerrainDensity = sizeof($terrainsByDensity) - 1;
		
		foreach ($freeTiles as $ft) {
			if ($this->_map[$ft[0]][$ft[1]]['t']) {
				continue;
			}
			$sides = array();
			if ($ft[0] != 0) {
				$sides[] = array($ft[0] - 1, $ft[1]);
			}
			if ($ft[0] != $this->_width - 1) {
				$sides[] = array($ft[0] + 1, $ft[1]);
			}
			if ($ft[1] != 0) {
				$sides[] = array($ft[0], $ft[1] - 1);
			}
			if ($ft[1] != $this->_height - 1) {
				$sides[] = array($ft[0], $ft[1] + 1);
			}
			
			$setTerrain = false;
			shuffle($sides);
			for ($i=0; $i<sizeof($sides); $i++) {
				$onSide = $this->getTerrain($sides[0], $sides[1]);
				if ($onSide != null) {
					//$this->setTerrain($ft[0], $ft[1], $onSide);
					$size = rand(1, $brushSize);
					$this->generateTerrainBrush($onSide, $ft[0], $ft[1], $size);
					
					$setTerrain = $onSide['t'];
					break;
				}
			}
			if (!$setTerrain) {
				// Установка рандомных тайлов в радиусе $brushSize с вероятностью отдельного тайла
				$setTerrain = $terrainsByDensity[rand(0, $maxTerrainDensity)];
				$this->setTerrain($ft[0], $ft[1], $setTerrain);
				if ($brushSize != 1) {
					$size = rand(1, $brushSize);
					$this->generateTerrainBrush($setTerrain, $ft[0], $ft[1], $size);
				}
			}
		}
		
		// Оптимизация - ближайшие тайлы
		for ($x=1; $x < $this->_width-1; $x++) {
			for ($y = 1; $y < $this->_height-1; $y++) {
				if ($this->getTerrain($x-1, $y-1) == $this->getTerrain($x+1, $y+1)){
					$this->setTerrain($x, $y, $this->getTerrain($x-1, $y-1));
				} else if ($this->getTerrain($x-2, $y-2) == $this->getTerrain($x+1, $y+1)) {
					$this->setTerrain($x, $y, $this->getTerrain($x-2, $y-2));
				} else if ($this->getTerrain($x-1, $y-1) == $this->getTerrain($x+2, $y+2)) {
					$this->setTerrain($x, $y, $this->getTerrain($x-1, $y-1));
				} else if ($this->getTerrain($x-2, $y-2) == $this->getTerrain($x+2, $y+2)) {
					$this->setTerrain($x, $y, $this->getTerrain($x-2, $y-2));
				}
				if ($this->getTerrain($x-1, $y+1) == $this->getTerrain($x+1, $y-1)){
					$this->setTerrain($x, $y, $this->getTerrain($x+1, $y-1));
				} else if ($this->getTerrain($x-2, $y+2) == $this->getTerrain($x+1, $y-1)) {
					$this->setTerrain($x, $y, $this->getTerrain($x+2, $y-2));
				} else if ($this->getTerrain($x-1, $y+1) == $this->getTerrain($x+2, $y-2)) {
					$this->setTerrain($x, $y, $this->getTerrain($x+1, $y-1));
				} else if ($this->getTerrain($x-2, $y+2) == $this->getTerrain($x+2, $y-2)) {
					$this->setTerrain($x, $y, $this->getTerrain($x+2, $y-2));
				}
				if ($this->getTerrain($x+1, $y) == $this->getTerrain($x-1, $y)){
					$this->setTerrain($x, $y, $this->getTerrain($x+1, $y));
				}
				if ($this->getTerrain($x, $y+1) == $this->getTerrain($x, $y-1)){
					$this->setTerrain($x, $y, $this->getTerrain($x, $y+1));
				}
			}
		}
		
		Server::log('Terrain generated. Now generating elements...');
		
		// Генерация элементов
		$mapByTerrain = array();
		foreach ($this->_terrain as $name => $data) {
			$mapByTerrain[$name] = array();
		}
		for ($x = 0; $x < $this->_width; $x++) {
			for ($y = 0; $y < $this->_height; $y++) {
				$mapByTerrain[$this->getTerrain($x, $y)][] = array($x, $y); 
			}
		}
		
		$generatedElementsCnt = 0;
		foreach ($this->_elements as $elementName => $elementData) {
			$toGenerate = $elementData['quantity'];
			$generatedElementsCnt += $toGenerate;
			
			while ($toGenerate != 0) {
				$onTerrain = $elementData['terrains'][rand(0, sizeof($elementData['terrains']) - 1)];
				
				$keysArr = array_keys($mapByTerrain[$onTerrain]);	// array_rand() как-то криво работает
				$rndKey = $keysArr[rand(0, sizeof($keysArr) - 1)];
				
				$this->setElement($mapByTerrain[$onTerrain][$rndKey][0], $mapByTerrain[$onTerrain][$rndKey][1], $elementName);
				unset($mapByTerrain[$onTerrain][$rndKey]);
				$toGenerate--;
				
				if (sizeof($mapByTerrain[$onTerrain]) == 0) {
					unset($mapByTerrain[$onTerrain]);
					foreach ($elementData['terrains'] as $k => $v) {
						if ($v == $onTerrain) {
							unset($elementData['terrains'][$k]);
							break;
						}
					}
					if ($toGenerate != 0 && sizeof($elementData['terrains'])) {
						throw new Exception(sprintf("Can't generate element %s - no much space on map", $elementName));
						die();
					}
				}
			}
		}
		
		Server::log('Generated ' . $generatedElementsCnt . ' elements');
		
		$this->chunksX = $this->getWidth() / Map::CHUNK_SIZE;
		$this->chunksY = $this->getHeight() / Map::CHUNK_SIZE;	

		for ($cx = 0; $cx < $this->chunksX; $cx++ ) {
			for ($cy = 0; $cy < $this->chunksY; $cy++ ) {
				$this->updateChunk($cx, $cy, false);
			}
		}	
		
		Server::log('Map generated in ' . round(microtime(true) - $_mgst, 4) . 's.');
	}

	public function getChunk($x, $y) {
		return array(
			floor($x / Map::CHUNK_SIZE), 
			floor($y / Map::CHUNK_SIZE)
		);
	}

	public function updateCoords($x, $y) {
		$offX = floor($x / Map::CHUNK_SIZE);
		$offY = floor($y / Map::CHUNK_SIZE);
		$this->updateChunk($offX, $offY);
	}
	
	public function updateChunk($offX, $offY, $message = true) {
		$minx = $offX * Map::CHUNK_SIZE;
		$maxx = $minx + Map::CHUNK_SIZE;
		$miny = $offY * Map::CHUNK_SIZE;
		$maxy = $miny + Map::CHUNK_SIZE;
		file_put_contents("public/map/" . $offX . "-" . $offY . ".json", json_encode($this->getMap($minx, $miny, $maxx, $maxy)));

		if ($message) {
			Server::$instance->message(array(
				'type' => 'chunkUpdate',
				'chunk' => array($offX, $offY)
			));		
		}
	}	

	// Генерация кисти
	private function generateTerrainBrush($terrain, $x, $y, $size) {
		if ($size > 1) {
			$size--;
		}
		for ($s = $size; $s > 0; $s--) {
			for($i = 0; $i <= $size * 8; ++$i) {
				$dx = round(cos($i * M_PI / ($s * 4)) * $s);
				$dy = round(sin($i * M_PI / ($s * 4)) * $s);
				
				$this->setTerrain($dx + $x, $dy + $y, $terrain);
			}
		}
	}
	
	public function isInRange($x, $y) {
		return ($x > -1 && $x < $this->_width && $y > -1 && $y < $this->_height);
	}
	
	public function setTerrain($x, $y, $name) {
		if ($this->isInRange($x, $y) && $name) {
			$this->_map[$x][$y]['t'] = $name;
			return true;
		}
		return false;
	}
	
	public function getTerrain($x, $y) {
		if ($this->isInRange($x, $y)) {
			return $this->_map[$x][$y]['t'];
		}
		return null; // Exception?
	}
	
	public function setElement($x, $y, $name) {
		if ($this->isInRange($x, $y)) {
			$this->_map[$x][$y]['e'] = $name;
			return true;
		}
		return false;
	}
	
	public function getElement($x, $y) {
		if ($this->isInRange($x, $y)) {
			return $this->_map[$x][$y]['e'];
		}
		return null; // Exception?
	}
	
	public function visualize($filename = 'public/map/terrain.png', $pixelSize = 2) {
		$img = imagecreate($this->_width * $pixelSize, $this->_height * $pixelSize);
		$colors = array();
		foreach ($this->_terrain as $name => $data) {
			$colors['t_' . $name] = imagecolorallocate($img, $data['color'][0], $data['color'][1], $data['color'][2]);
		}
		foreach ($this->_elements as $name => $data) {
			$colors['e_' . $name] = imagecolorallocate($img, $data['color'][0], $data['color'][1], $data['color'][2]);
		}
		
		foreach ($this->_map as $x => $ys) {
			foreach ($ys as $y => $data) {
				if ($data['e']) {
					$c = $colors['e_' . $data['e']];
				} else {
					$c = $colors['t_' . $data['t']];
				}
				for ($dx=0; $dx<$pixelSize; $dx++) {
					for ($dy=0; $dy<$pixelSize; $dy++) {
						$px = $dx + ($x * $pixelSize);
						$py = $dy + ($y * $pixelSize);
						imagesetpixel( $img, $px, $py, $c);
					}
				}
			}
		}
		imagepng($img, CWD . '/' . $filename);
	}
	public function getInJSON() {
		return json_encode($this->_map);
	}
	
	public function getSpawnPoint() {
		$cnt = 0;
		while (true) {
			$x = rand(0, $this->_width - 1);
			$y = rand(0, $this->_height - 1);
			if (Server::$map->getTerrain($x, $y) != 'water' || $cnt > 100) {
				return array(
					'x' => $x,
					'y' => $y
				);
			}
			$cnt++;
		}
	}
	
	public function getMap($minx, $miny, $maxx, $maxy) {
		$ret = array();
		// Карта
		for ( $x = $minx; $x < $maxx; $x++ ) {
			$ret[$x] = array();
			for ( $y = $miny; $y < $maxy; $y++ ) {
				$ret[$x][$y] = $this->_map[$x][$y];
			}
		}
		// Игроки
		foreach ($this->players as $coord => $p) {
			$pos = explode(',', $coord);
			if (array_key_exists($pos[0], $ret) && array_key_exists($pos[1], $ret[$pos[0]])) {
				$ret[$pos[0]][$pos[1]]['p'] = array(
					'name' => $p->getData('name'),
					// ...
				);
			}
		}
		return $ret;
	}
}
