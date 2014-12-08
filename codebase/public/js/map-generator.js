MapGenerator = {
	generate: function(cb){
		var cachedMap = localStorage.getItem("randomMap");
		if (cachedMap) {
			cb( $.parseJSON(cachedMap) );
			return;
		}
		$.ajax({
			url: "getrandommap.php",
			cache: false
		})
		.done(function(data){
			var j = $.parseJSON(data);
			localStorage.setItem("randomMap", data);
			cb(j);
		});
	}
}
