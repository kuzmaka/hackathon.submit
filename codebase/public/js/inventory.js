Inventory = {
	wrapSelector: "#inventory",
	contentSelector: "#inventory-content",

	contents: {
		//bottle: 10,
		//paper: 18
	},

	// Add item to inventory
	add: function(itemName, count) {
		if ( typeof this.contents[itemName] == "undefined" ) {
			this.contents[itemName] = count;
		} else {
			this.contents[itemName] += count;
		}
		Inventory.update();
	},

	// Remove item from inventory (throws string on error)
	remove: function(itemName, count) {
		if ( typeof this.contents[itemName] == "undefined" ) {
			return false;
		} else {
			if ( this.contents[itemName] < count ) {
				throw "Not enough items in inventory - can't remove";
			} else {
				this.contents[itemName] -= count;
			}
		}
		Inventory.update();
	},

	// Does item exist in inventory
	exists: function(itemName, count) {
		if ( typeof this.contents[itemName] == "undefined" || this.contents[itemName] < count ) {
			return false;
		}
		return true;
	},

    count: function(itemName) {
		if ( typeof this.contents[itemName] == "undefined") {
            return 0;
        }
        return this.contents[itemName];
	},

	// Update inventory (used by inventory methods, no need to use it manualy)
	update: function() {
		var assort = ["grass", "dirt", "stone", "water", "S", "bottle", "chemicals", "metal", "paper", "plastic", "S", "oscar"];
		$( Inventory.contentSelector ).html( "" );

		$.each( assort, function(k,v){
			var cnt = 0;
			if (typeof Inventory.contents[v] != "undefined") {
				cnt = Inventory.contents[v];
			}
			
			if (v != "S") {
				$( Inventory.contentSelector ).append(
					$( "<div />" ).addClass( "inventory-item inv-item-type-" + v ).append(
						$( "<div />" ).addClass( "inventory-item-count" ).text( cnt )
					)
				);
			} else {
				$( Inventory.contentSelector ).append(
					$( "<div />" ).addClass( "inventory-item-separator" )
				);
			}
		});
	}
};

$(document).ready(function(){
	Inventory.update();
});
