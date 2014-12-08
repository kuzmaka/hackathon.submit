/*
	Bootstrap.showLoading();
	Bootstrap.hideLoading();
	Bootstrap.popup(title, content, buttons, "error"); 	// error/ success / warning
*/

Bootstrap = {
	currentTooltip: 0,
	tooltips: [
		{
			overlays: [
				"top:0; left:0; bottom:0; width:50px;",
				"top:0; left:500px; right:0; bottom:0;"			
			],
			popup: {
				arrowClass: "tooltip-arrow-left",
				style: "top:50%; left:510px; margin-top:-50px;",
				title: "Control area",
				description: "Here goes everything you need for controlling your robot"
			}
		},
		{
			overlays: [
				"top:0; left:0; bottom:0; width:50px;",
				"top:0; left:50px; right:0; height:50px;",
				"top:50px; left:231px; right:0; bottom:0;"				
			],
			popup: {
				arrowClass: "tooltip-arrow-left",
				style: "top:50%; left:241px; margin-top:-50px;",
				title: "Program blocks",
				description: "Simple building blocks of your powerful program"
			}
		},
		{
			overlays: [
				"top:0; left:0; bottom:0; width:231px;",
				"top:0; left:231px; right:0; height:50px;",
				"top:50px; left:500px; right:0; bottom:0;"				
			],
			popup: {
				arrowClass: "tooltip-arrow-left",
				style: "top:50%; left:510px; margin-top:-50px;",
				title: "The program",
				description: "Drag blocks into this area and link them into one program"
			}
		},
		{
			overlays: [
				"top:0; left:0; bottom:0; width:500px;"			
			],
			popup: {
				arrowClass: "tooltip-arrow-right",
				style: "top:50%; left:90px; width:400px;",
				title: "The playground",
				description: "Here you can see your robot and lots of garbage. Your target is to collect it and transform it into something more useful."
			}
		},
		{
			overlays: [
				"top:0; left:0; bottom:0; width:405px;",
				"top:50px; left:405px; bottom:0; width:95px;",
				"left:495px; top:0; right:0; bottom:0;"	
			],
			popup: {
				arrowClass: "tooltip-arrow-top",
				style: "top:60px; left:350px; width:200px;",
				title: "Let's start!",
				description: "Put some blocks into your program and press Run"
			}
		}
	],
	ls: false,

	init: function(){
		Bootstrap.refresh();
		if(typeof(Storage) !== "undefined") {
			Bootstrap.ls = true;
		}
		if (Bootstrap.ls) {
			if (!localStorage.getItem("firstEntry")) {
				Bootstrap.showSplashScreen();
				localStorage.setItem("firstEntry", "1");
			}
		}
		$(window).resize(function(){
			Bootstrap.refresh();
		});
	},
	refresh: function() {
		var wHeight = $(window).height();
		var wWidth = $(window).width() - $( "#main-menu" ).outerWidth() - $( "#command-box" ).outerWidth();

		$( "#game-canvas" ).css({width: wWidth + "px", height: wHeight + "px"})
			.attr( "width", wWidth)
			.attr( "height", wHeight );
		$( "#command-box-content" ).css( "height", ( wHeight - 50 ) + "px" );
	},
	showLoading: function() {
		$("#loading").stop().fadeIn();
	},
	hideLoading: function() {
		$("#loading").stop().fadeOut();
	},	

	showSplashScreen: function() {
		$("#splash").show();
	},
	
	nextTooltip: function() {
		Bootstrap.currentTooltip++;
		if (Bootstrap.currentTooltip == Bootstrap.tooltips.length) {
			Bootstrap.currentTooltip = 0;
			Bootstrap.hideTooltip();
		} else {
			Bootstrap.showTooltip(Bootstrap.currentTooltip);
		}
	},

	hideTooltip: function() {
		$(".tooltip-overlay").fadeOut("fast", function(){
			$(".tooltip-overlay").remove();
		});
		$(".tooltip-popup").remove();
		$(".tooltip-touch-overlay").remove();
		$(".tooltip-cancel-button").remove();
	},

	showTooltip: function(idx) {
		$(".tooltip-overlay").remove();
		$(".tooltip-touch-overlay").remove();
		$(".tooltip-popup").remove();

		$.each(Bootstrap.tooltips[idx]["overlays"], function(k, style) {
			$("body").append("<div class='tooltip-overlay' style='" + style + "'></div>");
		});
		$("<div class='tooltip-touch-overlay' />").appendTo("body").bind("click", function() {
			Bootstrap.nextTooltip();
		});
		$(".tooltip-overlay").fadeIn();
		var popup = $("<div class='tooltip-popup " + Bootstrap.tooltips[idx].popup.arrowClass + "' style='" + Bootstrap.tooltips[idx].popup.style + "' />").append(
			$("<div class='tooltip-title' />").html(Bootstrap.tooltips[idx].popup.title),
			$("<div class='tooltip-content' />").html(Bootstrap.tooltips[idx].popup.description)
		);
		$("body").append(popup);
		$("body").append(
			$('<button class="tooltip-cancel-button" />')
				.html('<i class="fa fa-times"></i>Skip')
				.bind('click', Bootstrap.hideTooltip)
		);	
	},
	
	// Buttons - object ({  OK : function(){}, Cancel : function()P{} ...  })
	popup: function(title, content, buttons, type) {
		Bootstrap.hidePopup();
		$('<div id="popup-underlay" />').bind("click", function(){
			Bootstrap.hidePopup();
		}).appendTo("body");

		if (typeof type == "undefined") {
			type = "message";
		}
		var popup = $('<div id="popup" class="popup-style-' + type + '" />').appendTo("body");

		$(popup).append(
			$('<div class="popup-header" />').html(title),
			$('<div class="popup-content" />').append(content)
		);
		if (typeof buttons != "undefined" && buttons != null) {
			var buttonBar = $('<div class="popup-buttons" />').appendTo(popup);
			$.each(buttons, function(k,v){
				$(buttonBar).append(
					$("<button />").bind("click", v).text(k)			
				);
			});
		}
	},
	hidePopup: function() {
		$("#popup-underlay").remove();
		$("#popup").remove();
	},

	// type - start / stop
	setProcessButton: function(type, onclick) {
		$("#process-button").unbind("click").bind("click", onclick);
		if (type == "start") {
			$("#process-button").html("<i class='fa fa-play icon-to-the-left'></i>Run").css("background", "#090");
		} else {
			$("#process-button").html("Stop<i class='fa fa-stop icon-to-the-right'></i>").css("background", "#900");
		}
	},

	showLoginForm: function() {
		if (!Server.connected) {
			$('<div id="popup-underlay" />').bind("click", function(){
				Bootstrap.hideLoginForm();
			}).appendTo("body");

			$("#login-window").show();

			if (Bootstrap.ls) {
				var lastName = localStorage.getItem("lastPlayerName");
				if (lastName) {
					$("#player-name-input").val(lastName);
				}
			}
		} else {
			Bootstrap.popup("Multiplayer", "You have already connected as " + Server.name + "<br>Would you like to disconnect?<br><br>Progress will be saved server-side, you'll return to local game with new map", {
				"Disconnect":function(){
					location.reload();
				}
			})
		}
	},

	hideLoginForm: function() {
		$("#popup-underlay").remove();
		$("#login-window").hide();
	},

	loginAttempt: function() {
		Bootstrap.hidePopup();
		Bootstrap.hideLoginForm();

		var name = $("#player-name-input").val();
		if (name.length < 3) {
			Bootstrap.hideLoginForm();
			Bootstrap.popup("Oops!", "Too short name. Try something longer than 2 symbols", {
				"Try again" : function(){
					Bootstrap.hidePopup();
					Bootstrap.showLoginForm();
				}
			}, "error");
			return;
		}
		if (name.length > 32) {
			Bootstrap.hideLoginForm();
			Bootstrap.popup("Oops!", "Too long name. Try something shorter than 33 symbols", {
				"Try again" : function(){
					Bootstrap.hidePopup();
					Bootstrap.showLoginForm();
				}
			}, "error");
			return;
		}
		if (name.match(/[a-zA-Z0-9_\-\.]+/) != name) {
			Bootstrap.hideLoginForm();
			Bootstrap.popup("Oops!", "We found invalid symbols - please use a-z / A-Z / 0-9 / - / _ / .", {
				"Try again" : function(){
					Bootstrap.hidePopup();
					Bootstrap.showLoginForm();
				}
			}, "error");
			return;
		}
		localStorage.setItem("lastPlayerName", name);
		Bootstrap.showLoading();
		Server.connect(name, function(data){
			Bootstrap.hideLoading();
			if (data.status == "success") {
				Bootstrap.hideLoginForm();
				// Updating map
				var chunksX = data.mapSize[0] / data.chunkSize;
				var chunksY = data.mapSize[1] / data.chunkSize;
				for (var x=0; x<chunksX; x++) {
					for (var y=0; y<chunksY; y++) {
						Server.getChunk(x, y, function(chunk){
							Server.onChunkUpdate(chunk);
						});
					}
				}
				// Updating inventory
				Inventory.i = {};				
				$.each(data.inventory, function(item, count){
					Inventory.add(item,count);
				});
			} else {
				Bootstrap.popup("Server says 'Error'", data.message, null, "error");
			}
		}, function(){
			Bootstrap.hideLoading();
			Bootstrap.hideLoginForm();
			Bootstrap.popup("Connection error", "Server didn't respond :( Let's try again?", {
				"Try again": Bootstrap.loginAttempt
			}, "error");
		});
	},

	// type - error/success/warning/null
	noticeTimer: null,

	notice: function(message, type) {
		if (typeof type == "undefined") {
			type = "message";
		}
		Bootstrap.hideNotice();
		$("#notice").attr("class", "type-" + type);
		$("#notice").html(message);
		$("#notice").stop().fadeIn();
		//if (type != "error") {
        Bootstrap.noticeTimer = setTimeout(function(){
            Bootstrap.hideNotice();
        }, 10000);
		//}
		$("#notice").unbind("click").bind("click", function(){
			Bootstrap.hideNotice();
		});
	},
	
	hideNotice: function(){
		clearTimeout(Bootstrap.noticeTimer);
		$("#notice").hide();
	},

	updatePlayerLevel: function(level) {
		$("#player-level").html("CODDEE level: <span>" + level + "</span>");
	}
};

$(document).ready(function(){
	Bootstrap.init();
});
