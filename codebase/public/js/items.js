Items = {
	// Combine two items ("water", "grass" => "bush")
	// returns new item or null
	combine: function(firstItem, secondItem) {
		a = [firstItem, secondItem];
		a.sort();
		switch (a[0]) {
			case "dirt" : {
				switch (a[1]) {
					case "water" : return "grass";
				}
			}
		}
		return null;
	}
};
