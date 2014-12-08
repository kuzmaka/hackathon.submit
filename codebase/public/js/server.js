Server = {
	publish_key: "pub-c-ee63219a-443d-4f28-a7f2-3c36034250c2",
	subscribe_key: "sub-c-e24ccfd8-7734-11e4-af64-02ee2ddab7fe",
	broadcast: "abroadcast",

	pubnub: null,
	name: null,
	
	callbacks: {},
	connected: false,

	connectionTimer: null,

	connect: function(name, cb, ontimeout){
		console.log("Connecting with name " + name + "...");

		Server.name = name;
		Server.callbacks["connect"] = cb;

		Server.pubnub = PUBNUB.init({                               
			publish_key   : Server.publish_key,
			subscribe_key : Server.subscribe_key
		});
		
		Server.pubnub.subscribe({
			channel : Server.broadcast,
			message : Server.onMessage,
			connect : function() {  
				if (typeof ontimeout !== "undefined") {
					Server.connectionTimer = setTimeout(ontimeout, 10000);
				}
				Server.pubnub.publish({                                     
					channel : Server.broadcast,
					message : {
						do: "connect",
						name: name
					}
				});
			}
		});
	},

	disconnect: function() {
		if (Server.connected) {
			Server.pubnub.publish({                                     
				channel : Server.broadcast,
				message : {
					do: "disconnect",
					name: Server.name
				}
			});
		}
	},

	onMessage: function(data) {
		console.log("Server::onMessage", data);
		if (data.type == 'onConnect' && data.for == Server.name) {
			clearTimeout(Server.connectionTimer);
			if (!Server.connected) {	// One first mesage can be thrown twice
				if (data.status == 'success') {
					Server.connected = true;
					Server.callbacks["connect"](data);
				} else {
					//Bootstrap.popup("<i class='fa fa-exclamation-triangle'></i>Error", data.message);
					Bootstrap.popup("<i class='fa fa-exclamation-triangle'></i>Error", data.message, null, "error");
				}
			}
		} else {
			if (Server.connected) {
				if (data.type == 'chunkUpdate') {
					Server.getChunk(data.chunk[0], data.chunk[1], function(chunk){
						Server.onChunkUpdate(chunk);
					});
				} else if (data.type == 'onAction' && data.for == Server.name) {
					console.log("Server::onMessage - it's an action");
					console.log("Server::onMessage - returning to callback...");
					if (typeof Server.callbacks[data.hash] == "function") {
						Server.callbacks[data.hash](data);
					} else {	
						console.log("Is-not-a-function issue");
						console.log("That's not a function: ", Server.callbacks[data.hash]);
						console.log("All callbacks: ", Server.callbacks);
					}
				}
			}
		}
	},

	getChunk: function(offX, offY, cb) {
		$.ajax({
			url: "/map/" + offX + "-" + offY + ".json",
			cache: false
		})
		.done(cb);
	},

	action: function(data, cb) {
		console.log("Server::action", data, cb);
		if (Server.connected) {
			console.log("Server::action - connected to server");
			var hash = Math.random().toString(36).substr(2);
			Server.callbacks[hash] = cb;
			console.log("Server::action - generated hash and wrote down callback");
			var msg = {
				do: "action",
				name: Server.name,
				data: data,
				hash: hash
			};
			console.log("Server::action - sending", msg);
			Server.pubnub.publish({                                     
				channel : Server.broadcast,
				message : msg
			});
		}
	}
};

/*
	Server.connected - (bool) - connected / not connected to the server
	Server.name - name of the local player (only if Server.connected)

	Server.connect("player name", function(result){ 
		// callback function on connecting server
		// result - object with info about current player pos, world size etc.
	});

	Server.onChunkUpdate(chunk); - must be hooked - automatically called each time when something has been changed on the server's map
	Server.getChunk(chunkIdxX, chunkIdxY, function(result){
		// Get the chunk from the server's map (first two parameters - x and y offset)
		// result - object, just like in onChunkUpdate callback
	});

	Server.action({
		type: "move",
		direction: "up"
	}, function(result){
		// result - action result
		// result.status - success/error
		// result.pos - resulting position of current player
	});

	Possible actions:

	Type	Parameters										Result
	------------------------------------------------------------------
	move	direction (up/down/left/right)					result.status (success/error and result.message if it was an error)
	take	-												result.status (success/error and result.message if it was an error) - item will be added to inventory
	put		item (bottle/metal/...)							result.status (success/error and result.message if it was an error) - item must be in inventory, otherwise error
*/		

$( window ).unload(function() {
	Server.disconnect();
});
