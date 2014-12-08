<?php
	set_time_limit( 0 );
	gc_enable();
	// gc_collect_cycles(); 
	
	error_reporting( E_ALL );
	
	define('CWD', realpath(dirname(__FILE__)));
	require_once('../inc/Map.php');
	
	class Server {
		public static function log($msg) {

		}
	}

	// Создание карты
	$map = new Map();
	
	// Добавление поверхностей
	$map->addTerrain( 'grass', array(
		'name' => 'Grass',
		'density' => 4,						// плотность размещения (суммируется с остальными и высчитывается часть)
		'color' => array(0, 150, 0)			// цвет тайла (только для визуализации в Map->visualize())
	));
	$map->addTerrain( 'dirt', array(
		'name' => 'Dirt',
		'density' => 2,
		'color' => array(192, 192, 0)
	));
	$map->addTerrain( 'water', array(
		'name' => 'Water',
		'density' => 2,
		'color' => array(0, 128, 255)
	));
	$map->addTerrain( 'stone', array(
		'name' => 'Stone',
		'density' => 2,
		'color' => array(160, 160, 160)
	));
	
	// Добавление элементов (элементы инвентаря и то, что лежит/стоит на поверхностях, к примеру, бутылка или дерево)
	/*$map->addElement( 'tree', array(
		'name' => 'Tree',
		'quantity' => 30,					// сколько элементов будет размещено на карте
		'terrains' => array('grass','dirt'),		// массив элементов string - названий поверхностей, на которых этот элемент может появиться
		'canPickUp' => false,				// может ли робот взять эту вещь в инвентарь
		'color' => array(255, 255, 0)		// цвет тайла на мини-карте (в Map->visualize())
	));*/
	$map->addElement( 'bush', array(
		'name' => 'Bush',
		'quantity' => 800,
		'terrains' => array('grass','dirt'),
		'canPickUp' => true,
		'color' => array(0, 255, 0)
	));
	$map->addElement( 'bottle', array(
		'name' => 'Bottle',
		'quantity' => 500,
		'terrains' => array('grass','dirt','stone'),
		'canPickUp' => true,
		'color' => array(255, 255, 255)
	));
	$map->addElement( 'plastic', array(
		'name' => 'Plastic',
		'quantity' => 500,
		'terrains' => array('grass','dirt','stone'),
		'canPickUp' => true,
		'color' => array(255, 255, 255)
	));
	$map->addElement( 'metal', array(
		'name' => 'Metal',
		'quantity' => 500,
		'terrains' => array('grass','dirt','stone'),
		'canPickUp' => true,
		'color' => array(255, 255, 255)
	));
	/*$map->addElement( 'metal1', array(
		'name' => 'Metal',
		'quantity' => 500,
		'terrains' => array('grass','dirt','stone'),
		'canPickUp' => true,
		'color' => array(255, 255, 255)
	));*/
	$map->addElement( 'paper', array(
		'name' => 'Paper',
		'quantity' => 500,
		'terrains' => array('grass','dirt','stone'),
		'canPickUp' => true,
		'color' => array(255, 255, 255)
	));
	$map->addElement( 'chemicals', array(
		'name' => 'Chemicals',
		'quantity' => 300,
		'terrains' => array('grass','dirt','stone'),
		'canPickUp' => true,
		'color' => array(255, 255, 255)
	));
	/*
	$map->addElement( 'paper1', array(
		'name' => 'Paper',
		'quantity' => 500,
		'terrains' => array('grass','dirt','stone'),
		'canPickUp' => true,
		'color' => array(255, 255, 255)
	));
	*/
	$map->generate(100, 100, 2);
	echo $map->getInJSON();
