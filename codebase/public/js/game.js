var Game = {
    trash: ['paper', 'bottle', 'plastic', 'metal', 'chemicals'],
    stopped: true,
    players: [] // for multiplayer
};

$( document ).ready(function() {
    Game.stage = new createjs.Stage("game-canvas");

    Game.map = new Map();
    MapGenerator.generate(function(mapInJSON){
        Game.map.tiles = new Array(this.rows);
          $.each(mapInJSON, function(x, ys){
              Game.map.tiles[x] = new Array(this.cols);
            $.each(ys, function(y, data) {
                var tile = data.t;
                  var thing = data.e;
          // two layers: tiles and things
                Game.map.tiles[x][y] = [{name: tile}];
                  if (thing) {
                    Game.map.tiles[x][y].push({name: thing});
                }
              });
        });

        Game.hero = new Hero(Game.map);

        Game.queue = new createjs.LoadQueue(false);
        Game.queue.installPlugin(createjs.Sound);
        Game.queue.addEventListener("complete", onLoadComplete);
        Game.queue.loadManifest([
            {id: "dirt", src: "img/dirt.png"},
            {id: "grass", src: "img/grass.png"},
            {id: "stone", src: "img/road.png"},
            {id: "water", src: "img/water.png"},
            {id: "bush", src: "img/bush.png"},
            //{id: "tree", src: "img/tree.png"},
            {id: "hero", src: "img/walle.png"},
            {id: "swimming_hero", src: "img/walle_water.png"},
            {id: "bottle", src: "img/bottle.png"},
            {id: "plastic", src: "img/plastic.png"},
            {id: "metal", src: "img/metal.png"},
            {id: "chemicals", src: "img/chemicals.png"},
            {id: "paper", src: "img/paper.png"},
            // sounds
            {id: "error", src: "sounds/error.wav"},
            //{id: "go", src: "sounds/take.wav"},
            //{id: "take", src: "sounds/take.wav"},
            {id: "recycle", src: "sounds/take_paper.mp3"},
            {id: "take_chemicals", src: "sounds/take_chemicals.wav"},
            {id: "take_bottle", src: "sounds/take_bottle.wav"},
            {id: "take_metal", src: "sounds/take_metal.wav"},
            {id: "take_paper", src: "sounds/take_plastic.wav"},
            {id: "take_plastic", src: "sounds/take_plastic.wav"}
        ]);

        function onLoadComplete(){
            Game.map.updateViewport({
                row:Game.hero.row - 2,
                col:Game.hero.col - 2,
                rows:Math.ceil(Game.stage.canvas.height / Game.map.tileH) + 2,
                cols:Math.ceil(Game.stage.canvas.width / Game.map.tileW) + 2
            });
            Game.stage.addChild(Game.map.graphics[0]);
            Game.stage.addChild(Game.map.graphics[1]);
            Game.hero.initGraphics();
            Game.stage.addChild(Game.hero.graphics);
            Game.hero.hideOverlaps(Game.hero.row, Game.hero.col, 0, 0);
            //Game.hero.hideOverlaps(Game.hero.row, Game.hero.col, 1, 0, 0.5);

            createjs.Ticker.addEventListener("tick", onTick);
            createjs.Ticker.timingMode = createjs.Ticker.RAF;
        }

        function onTick(e) {
            Game.stage.update();
        }

        Bootstrap.setProcessButton('start', runOrStopCode);
    });

});

function runOrStopCode() {
    Game.stopped = !Game.stopped;
    if (Game.stopped) {
        Bootstrap.setProcessButton('start', runOrStopCode);
        return;
    }
    Bootstrap.setProcessButton('stop', runOrStopCode);

    var code = Blockly.JavaScript.workspaceToCode();
    //var xml = Blockly.Xml.workspaceToDom(Blockly.mainWorkspace);
    //var xml_text = Blockly.Xml.domToPrettyText(xml);
    //console.log('code', code, xml_text);
    //console.log('code', code);
    Blockly.JavaScript.addReservedWords('code');
    Game.interpreter = new Interpreter(code, initInterpreterApi);

    nextCodeStep();

    //if (Game.hero.level == 1) {
    //    Game.hero.level++;
    //    Bootstrap.updatePlayerLevel(Game.hero.level);
    //}
}

function stopCode()
{
    Game.stopped = true;
    Bootstrap.setProcessButton('start', runOrStopCode);
}

function initInterpreterApi(interpreter, scope) {
    // move
    var wrapper = function(direction) {
        return interpreter.createPrimitive(move(direction));
    };
    interpreter.setProperty(scope, 'move', interpreter.createNativeFunction(wrapper));
    // take
    wrapper = function() {
        return interpreter.createPrimitive(take());
    };
    interpreter.setProperty(scope, 'take', interpreter.createNativeFunction(wrapper));
    // put
    wrapper = function(thing) {
        return interpreter.createPrimitive(put(thing));
    };
    interpreter.setProperty(scope, 'put', interpreter.createNativeFunction(wrapper));
    // recycle
    wrapper = function(trashA) {
        return interpreter.createPrimitive(recycle(trashA));
    };
    interpreter.setProperty(scope, 'recycle', interpreter.createNativeFunction(wrapper));
    // trashIsDetected
    wrapper = function() {
        return interpreter.createPrimitive(trashIsDetected());
    };
    interpreter.setProperty(scope, 'trashIsDetected', interpreter.createNativeFunction(wrapper));
    // countThings
    wrapper = function(thing, relation, number) {
        return interpreter.createPrimitive(countThings(thing, relation, number));
    };
    interpreter.setProperty(scope, 'countThings', interpreter.createNativeFunction(wrapper));
}

function nextCodeStep() {
    if (Game.stopped) {
        Bootstrap.setProcessButton('start', runOrStopCode);
        return;
    }
    // go through interpreter fine-grained steps until we reach game action
    var moreSteps;
    while (moreSteps = Game.interpreter.step()) {
        //console.log('step', Game.interpreter.value);
        // if value returned then we reached game action
        if (typeof Game.interpreter.value !== 'undefined') {
            Game.interpreter.value = undefined;
            break;
        }
    }
    if (!moreSteps) {
        Game.stopped = true;
        Bootstrap.setProcessButton('start', runOrStopCode);
    }
}

function move(direction)
{
    //console.log(direction);
    Game.hero.move(direction.data, nextCodeStep);
    return true;
}

function take()
{
    Game.hero.take(nextCodeStep);
    return true;
}

function recycle(trashA)
{
    Game.hero.recycle(trashA, nextCodeStep);
    return true;
}

function put(thing)
{
    Game.hero.putTile(thing.data, nextCodeStep);
    return true;
}

function trashIsDetected()
{
    return Game.hero.trashIsDetected();
}

function countThings(thing, relation, number)
{
    return Game.hero.countThings(thing, relation, number);
}

var Map = function(){
    this.rows = 100;
    this.cols = 100;
    this.tileW = 100;
    this.tileH = 81;
    // hide one tile to make viewport reload invisible
    this.x0 = -100;
    this.y0 = -135;
    this.updateTileTime = 1000;
    //console.log('Map', this.rows, this.cols);

    /*this.tiles = new Array(this.rows);
    for (var row = 0; row < this.rows; row++) {
        this.tiles[row] = new Array(this.cols);
        for (var col = 0; col < this.cols; col++) {
            var rnd = Math.random();
            var tile, thingAllowed = false, thing = null;
            if (rnd < 0.1) {
                tile = 'dirt';
                thingAllowed = true;
            } else if (rnd < 0.2) {
                tile = 'water';
            } else if (rnd < 0.3) {
                tile = 'stone';
                thingAllowed = true;
            } else if (rnd < 0.4) {
                tile = 'grass';
                thing = 'bush';
            //} else if (rnd < 0.5) {
            //    tile = 'grass';
            //    thing = 'tree';
            } else {
                tile = 'grass';
                thingAllowed = true;
            }
            if (thingAllowed) {
                rnd = Math.random();
                if (rnd < 0.1) {
                    thing = 'paper';
                } else if (rnd < 0.2) {
                    thing = 'bottle';
                } else if (rnd < 0.3) {
                    thing = 'plastic';
                } else if (rnd < 0.4) {
                    thing = 'chemicals';
                } else if (rnd < 0.5) {
                    thing = 'metal';
                }
            }
            // two layers: tiles and things
            this.tiles[row][col] = [{name: tile}];
            if (thing) {
                this.tiles[row][col].push({name: thing});
            }
        }
    }*/

    this.graphics = [new createjs.Container(), new createjs.Container()];
};

Map.prototype.updateViewport = function(viewport, complete) {
    var initial = typeof this.vp == 'undefined';
    if (initial) {
        this.vp = {
            row: (this.rows + viewport.row) % this.rows,
            col: (this.cols + viewport.col) % this.cols,
            rows: viewport.rows,
            cols: viewport.cols
        };
    }
    //console.log('uvp',viewport,this.vp);
    this.graphics[0].removeAllChildren();
    this.graphics[0].x = 0;
    this.graphics[0].y = 0;
    this.graphics[1].removeAllChildren();
    this.graphics[1].x = 0;
    this.graphics[1].y = 0;
    for (var row = viewport.row; row < viewport.row + viewport.rows; row++) {
        for (var col = viewport.col; col < viewport.col + viewport.cols; col++) {
            var r = (this.rows + row) % this.rows;
            var c = (this.cols + col) % this.cols;
            //console.log('uvp1',row,col,r,c);
            var cell = this.tiles[r][c];
            for (var l = 0; l < cell.length; l++) {
                b = new createjs.Bitmap(Game.queue.getResult(cell[l].name));
                // draw in old position
                b.x = (col - this.vp.col) * this.tileW + this.x0;
                b.y = (row - this.vp.row) * this.tileH + this.y0;
                cell[l].bitmap = b;
                this.graphics[l].addChild(b);

                //if (l == 1 && Game.hero.row == r && Game.hero.col == c) {
                //    this.graphics[1].addChild(Game.hero.graphics);
                //}
            }
        }
    }
    // move to new position
    if (!initial) {
        for (var i = 0; i < 2; i++) {
            var g = this.graphics[i];
            if (i == 0) {
                createjs.Tween.get(g).to({
                    x: (this.vp.col - viewport.col) * this.tileW,
                    y: (this.vp.row - viewport.row) * this.tileH
                }, Game.hero.stepTime).call(function () {
                    if (complete) {
                        complete();
                    }
                });
            } else {
                createjs.Tween.get(g).to({
                    x: (this.vp.col - viewport.col) * this.tileW,
                    y: (this.vp.row - viewport.row) * this.tileH
                }, Game.hero.stepTime);
            }
        }
        this.vp = {
            row: (this.rows + viewport.row) % this.rows,
            col: (this.cols + viewport.col) % this.cols,
            rows: viewport.rows,
            cols: viewport.cols
        };

        // move other players to their original positions
        if (Server.connected) {
            for (var pi = 0; pi < Game.players.length; pi++) {
                var p = Game.players[pi];
                if (p !== Game.hero && p.graphics) {
                    createjs.Tween.get(p.graphics).to({
                        x: ((this.cols + p.col - this.vp.col) % this.cols) * this.tileW + this.w / 2 + this.x0,
                        y: ((this.rows + p.row - this.vp.row) % this.rows) * this.tileH + this.y0
                    }, Game.hero.stepTime);
                }
            }
        }
    }
};

Map.prototype.updateTile = function(x, y, name, complete){
    var cell = this.tiles[x][y];
    if (cell[0].name == name) {
        if (complete) {
            complete();
        }
        return;
    }
    cell[0].name = name;
    var oldG = cell[0].bitmap;
    var idx = this.graphics[0].getChildIndex(oldG);
    if (idx >= 0) {
        var g = new createjs.Bitmap(Game.queue.getResult(name));
        g.x = oldG.x;
        g.y = oldG.y;
        g.alpha = 0;
        this.graphics[0].addChildAt(g, idx + 1);
        cell[0].bitmap = g;
        var self = this;
        createjs.Tween.get(g).to({alpha: oldG.alpha}, self.updateTileTime).call(function(){
            self.graphics[0].removeChild(oldG);
            if (complete) {
                complete();
            }
        });
    } else {
        if (complete) {
            complete();
        }
    }
};

Map.prototype.updateThing = function(x, y, thing){
    //console.log('updateThing', x, y, thing);
    var cell = this.tiles[x][y];
    if (cell.length == 1) { // no thing yet
        if (!thing) {
            return;
        }
        var g = new createjs.Bitmap(Game.queue.getResult(thing));
        cell.push({name:thing, bitmap:g});
        var idx = this.graphics[0].getChildIndex(cell[0].bitmap);
        if (idx >= 0) {
            cell[1].bitmap.x = cell[0].bitmap.x;
            cell[1].bitmap.y = cell[0].bitmap.y;
            this.graphics[1].addChild(g);
        }
    } else { // replace old thing
        if (thing && cell[1].name == thing) {
            return;
        }

        if (!thing) { // remove thing from map
            g = cell.pop().bitmap;
            if (g) {
                this.graphics[1].removeChild(g);
            }
            return;
        }

        // replace
        g = cell.pop().bitmap;
        if (g) {
            this.graphics[1].removeChild(g);
        }

        g = new createjs.Bitmap(Game.queue.getResult(thing));
        cell.push({name:thing, bitmap:g});
        idx = this.graphics[0].getChildIndex(cell[0].bitmap);
        if (idx >= 0) {
            cell[1].bitmap.x = cell[0].bitmap.x;
            cell[1].bitmap.y = cell[0].bitmap.y;
            this.graphics[1].addChild(g);
        }
    }
};

Map.prototype.updatePlayer = function(y, x, p, myname){
    if (!p) {
        return;
    }
    //console.log('updatePlayer', x, y, p, myname);
    if (typeof Game.players[p.name] === 'undefined') {  // new player
        // if this is my hero then update viewport
        if (p.name == myname) {
            Game.map.updateViewport({
                row: x - 2,
                col: y - 2,
                rows: Math.ceil(Game.stage.canvas.height / Game.map.tileH) + 2,
                cols: Math.ceil(Game.stage.canvas.width / Game.map.tileW) + 2
            });
            //console.log('updatePlayer: new view port', Game.map.vp);
        }
        // add new player
        //console.log('updatePlayer: add new player');
        var hero = new Hero(this, x, y);
        hero.name = p.name;
        Game.players[hero.name] = hero;
        hero.initGraphics();
        hero.graphics.alpha = 0.5;
        // if this is my hero then replace it
        if (p.name == myname) {
            //console.log('updatePlayer: replace my hero');
            hero.graphics.alpha = 1;
            Game.stage.removeChild(Game.hero.graphics);
            Game.hero = hero;
        }
        Game.stage.addChild(hero.graphics);
    } else {
        //console.log('updatePlayer: hero.moveTo', x, y);
        // move hero
        hero = Game.players[p.name];
        hero.moveTo(x, y, hero.callbacks['move']);
    }
};

Map.prototype.inViewport = function(row, col, border)
{
    var drow = (this.rows + row - this.vp.row) % this.rows;
    if (drow < border || drow > this.vp.rows - 1 - border) {
        return false;
    }
    var dcol = (this.cols + col - this.vp.col) % this.cols;
    if (dcol < border || dcol > this.vp.cols - 1 - border) {
        return false;
    }
    return true;
};

Server.onChunkUpdate = function(chunk){
    $.each(chunk, function(x, ys){
        $.each(ys, function(y, data) {
            var xi = parseInt(x);
            var yi = parseInt(y);
            Game.map.updateTile(xi, yi, data.t);
            Game.map.updateThing(xi, yi, data.e);
            Game.map.updatePlayer(xi, yi, data.p, Server.name);
        });
    });
};


var Hero = function(map, row, col){
    this.map = map;
    this.row = row ? row : 2;
    this.col = col ? col : 2;
    this.regX = 50;
    this.regY = 0;
    this.w = 101;
    this.h = 171;
    this.stepTime = 500;
    this.border = 2;    // view port border
    this.swimming = false;
    this.callbacks = {
        move: null
    };
    this.level = 1;
};

Hero.prototype.initGraphics = function(){
    var b = new createjs.Bitmap(Game.queue.getResult(this.swimming ? 'swimming_hero' : 'hero'));
    b.x = (this.col - this.map.vp.col) * this.map.tileW + this.w / 2 + this.map.x0;
    b.y = (this.row - this.map.vp.row) * this.map.tileH + this.map.y0;
    b.regX = this.regX;
    b.regY = this.regY;
    this.graphics = b;
    //this.updateGraphicsIndex();
};

Hero.prototype.updateGraphicsIndex = function(){
    // insert hero between things on map
    var things = this.map.graphics[1];
    var idx = 0;
    for (var row = this.map.vp.row; row < this.map.vp.row + this.map.vp.rows; row++) {
        for (var col = this.map.vp.col; col < this.map.vp.col + this.map.vp.cols; col++) {
            var r = row % this.map.rows;
            var c = col % this.map.cols;
            var cell = this.map.tiles[r][c];
            if (cell.length > 1) {
                idx++;
            }
            if (this.col == c && this.row == r) {
                //console.log('!!!', col, row, r, c, idx);
                things.removeChild(this.graphics); // failes silently when no child?
                things.addChildAt(this.graphics, idx);
                return;
            }
        }
    }
};

Hero.prototype.move = function(direction, complete) {
    //createjs.Sound.play("go");

    if (Server.connected) {
        this.callbacks['move'] = complete;
        Server.action({type:'move', direction:direction}, function(p){});
        //this.moveTo(this.row + drow, this.col + dcol, complete);
        return;
    }
    var self = this;
    //console.log('move', direction, 'this.col ' + this.col, 'vp.col ' + this.map.vp.col);
    var row = this.row, col = this.col, dcol = 0, drow = 0;
    if (direction == 'right') {
        dcol = 1;
    } else if (direction == 'left') {
        dcol = -1;
    } else if (direction == 'up') {
        drow = -1;
    } else if (direction == 'down') {
        drow = 1;
    }
    if (dcol < 0 && this.col <= (this.map.vp.col + this.border) % this.map.cols
        || dcol > 0 && this.col >= (this.map.vp.col + this.map.vp.cols - 1 - this.border) % this.map.cols
        || drow < 0 && this.row <= (this.map.vp.row + this.border) % this.map.rows
        || drow > 0 && this.row >= (this.map.vp.row + this.map.vp.rows - 1 - this.border) % this.map.rows
    ) {
        //console.log('A', this.col, (this.map.vp.col + this.border) % this.map.cols);
        //console.log('B', this.col, (this.map.vp.col + this.map.vp.cols - 1 - this.border) % this.map.cols);
        this.map.updateViewport({
            row: this.map.vp.row + drow,
            col: this.map.vp.col + dcol,
            rows: this.map.vp.rows,
            cols: this.map.vp.cols
        }, function () {
            self.col = (self.map.cols + self.col + dcol) % self.map.cols;
            self.row = (self.map.rows + self.row + drow) % self.map.rows;
            //self.updateGraphicsIndex();
            if (complete) {
                complete();
            }
        });
    } else {
        createjs.Tween.get(this.graphics)
            .set({scaleX: dcol == 0 ? this.graphics.scaleX : -dcol})
            .to({
                x: ((this.map.cols + col + dcol - this.map.vp.col) % this.map.cols) * this.map.tileW + this.w / 2 + this.map.x0,
                y: ((this.map.rows + row + drow - this.map.vp.row) % this.map.rows) * this.map.tileH + this.map.y0
            }, this.stepTime)
            .call(function () {
                self.col = (self.map.cols + self.col + dcol) % self.map.cols;
                self.row = (self.map.rows + self.row + drow) % self.map.rows;
                //self.updateGraphicsIndex();
                if (complete) {
                    complete();
                }
            });
    }
    this.hideOverlaps(row, col, drow, dcol);
    //this.hideOverlaps(row, col, drow+1, dcol, 0.5);
};

Hero.prototype.moveTo = function(toRow, toCol, complete) {
    //console.log('Hero.moveTo', toRow, toCol, this.inMoveTo);

    if (this.inMoveTo) {
        return;
    }
    this.inMoveTo = true;

    var self = this;
    var row = this.row, col = this.col, drow = toRow - row, dcol = toCol - col;

    if (this === Game.hero && !this.map.inViewport(toRow, toCol, this.border)
        //(dcol < 0 && this.col <= (this.map.vp.col + this.border) % this.map.cols
        //|| dcol > 0 && this.col >= (this.map.vp.col + this.map.vp.cols - 1 - this.border) % this.map.cols
        //|| drow < 0 && this.row <= (this.map.vp.row + this.border) % this.map.rows
        //|| drow > 0 && this.row >= (this.map.vp.row + this.map.vp.rows - 1 - this.border) % this.map.rows
    ) {
        this.map.updateViewport({
            row: this.map.vp.row + drow,
            col: this.map.vp.col + dcol,
            rows: this.map.vp.rows,
            cols: this.map.vp.cols
        }, function () {
            //self.updateGraphicsIndex();
            if (complete) {
                complete();
            }
            self.inMoveTo = false;
        });
        //console.log('Hero.moveTo: updated vieport', this.map.vp);
    } else if (this.graphics) {
        //console.log('Hero.moveTo: Tween', dcol, drow);
        createjs.Tween.get(this.graphics)
            .set({scaleX: dcol == 0 ? this.graphics.scaleX : -Math.sign(dcol)})
            //.to({x: this.graphics.x + dcol * this.map.tileW, y: this.graphics.y + drow * this.map.tileH}, this.stepTime)
            .to({
                x: ((this.map.cols + toCol - this.map.vp.col) % this.map.cols) * this.map.tileW + this.w / 2 + this.map.x0,
                y: ((this.map.rows + toRow - this.map.vp.row) % this.map.rows) * this.map.tileH + this.map.y0
            }, this.stepTime)
            .call(function () {
                //self.updateGraphicsIndex();
                if (complete) {
                    complete();
                }
                self.inMoveTo = false;
            });
    }
    this.hideOverlaps(row, col, drow, dcol);
    this.col = toCol;
    this.row = toRow;
};

Hero.prototype.hideOverlaps = function(row, col, drow, dcol, opacity){
    //console.log('hideOverlaps', row, col, drow, dcol, opacity);
    // trees & garbage opacity
    var cellTo = this.map.tiles[(this.map.rows + row+drow) % this.map.rows][(this.map.cols + col+dcol) % this.map.cols];
    if (cellTo.length > 1 && cellTo[1].bitmap) {
        createjs.Tween.get(cellTo[1].bitmap).to({alpha: opacity?opacity:0.3}, this.stepTime - this.stepTime/10);
    }
    var cellFrom = this.map.tiles[row][col];
    if (cellFrom.length > 1 && cellFrom[1].bitmap) {
        createjs.Tween.get(cellFrom[1].bitmap).to({alpha: 1}, this.stepTime - this.stepTime / 10);
    }
    // swimming
    //console.log('hideOverlap', cell[0].name, row, col, drow, dcol, this.swimming);
    if (this.graphics && (cellTo[0].name == 'water' && !this.swimming || cellTo[0].name != 'water' && this.swimming)) {
        this.swimming = !this.swimming;
        createjs.Tween.get(this.graphics).to({image: Game.queue.getResult(this.swimming ? 'swimming_hero' : 'hero')}, this.stepTime - this.stepTime * 2 / 10);
    }
};

Hero.prototype.take = function(complete) {
    if (Server.connected) {
        Server.action({type:'take'}, function(p){});
    }

    var cell = this.map.tiles[this.row][this.col];
    if (cell.length > 1 && Game.trash.indexOf(cell[1].name) >= 0) {
        this.map.graphics[1].removeChild(cell[1].bitmap);
        var thing = cell[1].name;
        Inventory.add(thing, 1);
        cell.pop();
    } else {
        createjs.Sound.play("error");
        Bootstrap.notice("CODDEE says: Nothing to take here. Use 'if' block.", "warning");
        stopCode();
        return;
    }

    createjs.Sound.play("take_" + thing);

    if (Game.hero.level <= 1) {
        Game.hero.level++;
        Bootstrap.updatePlayerLevel(Game.hero.level);
    }

    if (complete) {
        complete();
    }
};

Hero.prototype.recycle = function(trashA, complete) {
    var count = 5;
    if (!Inventory.exists(trashA, count)) {
        createjs.Sound.play("error");
        Bootstrap.notice("CODDEE says: Not enough " + trashA + " for recycling. Collect more garbage.", "warning");
        stopCode();
        return;
    }

    createjs.Sound.play("recycle");

    var recyclingMap = {
        'paper': 'grass',
        'plastic': 'dirt',
        'bottle': 'stone',
        'metal': 'oscar',
        'chemicals': 'water'
    };
    Inventory.add(recyclingMap[trashA], 1);
    Inventory.remove(trashA, count);

    if (Game.hero.level <= 2) {
        Game.hero.level++;
        Bootstrap.updatePlayerLevel(Game.hero.level);
    }

    if (complete) {
        complete();
    }
};

Hero.prototype.putTile = function(tile, complete) {
    var cell = this.map.tiles[this.row][this.col];
    var fromTile = cell[0].name;
    var fromThing = cell.length > 1 ? cell[1].name : null;

    if (!Inventory.exists(tile, 1)) {
        createjs.Sound.play("error");
        Bootstrap.notice("CODDEE says: I don't have " + tile + ". Collect and recycle some garbage.", "warning");
        stopCode();
        return;
    }

    // if garbage then ignore
    if (fromThing && Game.trash.indexOf(fromThing) >= 0) {
        createjs.Sound.play("error");
        Bootstrap.notice("CODDEE says: Can't put " + tile + " on garbage. Take garbage away from here first.", "warning");
        stopCode();
        return;
        //if (complete) {
        //    complete();
        //}
        //return;
    }

    Inventory.remove(tile, 1);

    //if (Game.hero.level <= 3) {
    Game.hero.level++;
    Bootstrap.updatePlayerLevel(Game.hero.level);
    //}

    var toTile, toThing;
    if (tile == 'dirt') {
        toTile = 'dirt';
        toThing = fromThing;
    } else if (tile == 'stone') {
        toTile = 'stone';
        toThing = null;
    } else if (tile == 'water') {
        toTile = fromTile == 'grass' ? 'grass' : 'water';
        toThing = fromTile == 'grass' ? 'bush' : null;
    } else if (tile == 'grass') {
        toTile = 'grass';
        toThing = fromTile == 'grass' ? 'bush' : null;
    }

    if (Server.connected) {
        Server.action({type:'put', t:toTile, e:toThing}, function(p){});
    }

    this.map.updateTile(this.row, this.col, toTile, complete);
    this.map.updateThing(this.row, this.col, toThing);

    if (toTile == 'water' && !this.swimming) {
        this.swimming = !this.swimming;
        createjs.Tween.get(this.graphics).to({image: Game.queue.getResult(this.swimming ? 'swimming_hero' : 'hero')}, this.stepTime - this.stepTime * 2 / 10);
    }
};

Hero.prototype.trashIsDetected = function()
{
    var cell = this.map.tiles[this.row][this.col];
    return cell.length > 1 && Game.trash.indexOf(cell[1].name) >= 0;
};

Hero.prototype.countThings = function(thing, relation, number)
{
    var n = Inventory.count(thing);
    if (relation == 'LT') {
        return n < parseInt(number);
    } else if (relation == 'GT') {
        return n > parseInt(number);
    } else {
        return n == parseInt(number);
    }
};

