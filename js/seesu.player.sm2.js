soundManager.url = 'http://seesu.heroku.com/swf/';
soundManager.flashVersion = 9; // optional: shiny features (default = 8)
soundManager.useFlashBlock = false; // optionally, enable when you're ready to dive in
soundManager.debugMode = false;
soundManager.wmode = 'transparent';

var sm2_p = function(player_holder,volume,sm2, iframe){
	var _this = this;
	this.core = sm2;
	/*
		musicbox.play_song_by_node
		musicbox.play()
		musicbox.stop()
		musicbox.pause
		musicbox.play_song_by_url
	*/
	if (player_holder){
		this.live_controls_holder = player_holder;
		var get_click_position = function(e){
			var pos = e.offsetX;
			if (!pos){
				pos = e.pageX - $(e.target).offset().left;
			}
			return pos
		}
		
		
		
		this.track_progress_total = $('<div class="track-progress"></div>').appendTo(player_holder);
		this.track_progress_load = $('<div class="track-load-progress"></div>').click(function(e){
			
			var pos = get_click_position(e);
			var new_play_position_factor = pos/300;
			_this.set_new_position(new_play_position_factor);
			
		}).appendTo(this.track_progress_total);
		this.track_progress_play = $('<div class="track-play-progress"></div>').click(function(e){
			var pos = get_click_position(e);
			var new_play_position_factor = pos/300;
			_this.set_new_position(new_play_position_factor);
			
		}).appendTo(this.track_progress_total);
		
		
		
		this.volume_state = $('<div class="volume-state"></div>').click(function(e){
			var pos = get_click_position(e);
			var new_volume_factor = pos/50;
			_this.changhe_volume(new_volume_factor * 100);
			
			_this.volume_state_position.css('width', pos + 'px')
		}).appendTo(player_holder);
		this.volume_state_position = $('<div class="volume-state-position"></div>').css('width',((volume * 50)/100) + 'px' ).appendTo(this.volume_state);
		
	}
	this.volume = volume;
	
	
	if (iframe) {
		log('with iframe')
		this.player_container = iframe;
		window.addEventListener("message", function(e){
			_this.listen_commands_of_sandbox.apply(_this,arguments);
		}, false);
		this.sm2_actions = this.sm2_actions_for_sandbox;
	} else{
		this.sm2_actions = this.sm2_actions_normal;

	}
	if (typeof seesu === 'object') {
		this.pl_h_style = seesu.pl_h_style = seesu.pl_h_style || $('<style></style>');
		$(document.documentElement.firstChild).append(this.pl_h_style);
	} else{
		//look like we in iframe, so listen commands
		window.addEventListener("message", function(e){
			_this.listen_commands_of_source.apply(_this,arguments);
		}, false)
	}
	
};
sm2_p.prototype = {
	'module_title':'sm2_p',
	"play_song_by_node" : function(node){
		this.play_song_by_url(node.attr('href'), node.data('duration'));
		var parent_node = node.parent()
		var top = parent_node.position().top + parent_node.height();
		this.pl_h_style.html('.player-holder {top: ' + top + 'px}');
		if (this.track_progress_total){
			this.track_progress_play[0].style.width = this.track_progress_load[0].style.width = '';
		}
		
		
	},
	"set_new_position": function(){
		this.sm2_actions.set_new_position.apply(this, arguments);
	},
	"play_song_by_url": function(){
		this.sm2_actions.play_song_by_url.apply(this, arguments);
	},
	'play': function(){
		this.sm2_actions.play.apply(this, arguments);
	},
	'stop': function(){
		this.sm2_actions.stop.apply(this, arguments);
	},
	'pause': function(){
		this.sm2_actions.pause.apply(this, arguments);
	},
	"changhe_volume": function(volume_value){		
		this.sm2_actions.changhe_volume.apply(this, arguments);
	},
	"sm2_actions": null,
	"sm2_actions_normal" :{
		"set_new_position": function(position_factor){
			
			var current_song = this.core.getSoundById(this.current_song);
			if (current_song) {
				var total = (current_song.bytesTotal * current_song.duration)/current_song.bytesLoaded;
				current_song.setPosition( position_factor * total )
			}
		},
		"play_song_by_url" : function(url){
			var _this = this;
			if (this.current_song){
				var current_song = this.core.getSoundById(this.current_song);
				if (current_song) {
					current_song.destruct()
				}
			}
			
				
			
			this.core.createSound({
				id: url, // required
				url: url, // required
				// optional sound parameters here, see Sound Properties for full list
				volume: _this.volume,
				autoPlay: true,
				onplay: function(){_this.sm2_p_events.playing(_this)},
				onresume: function(){_this.sm2_p_events.playing(_this)},
				onpause: function(){_this.sm2_p_events.paused(_this)},
				onstop: function(){_this.sm2_p_events.stopped(_this)},
				onfinish : function(){_this.sm2_p_events.finished(_this)},
				whileplaying: function(){
					var total = (this.bytesTotal * this.duration)/this.bytesLoaded;
					_this.sm2_p_events.progress_playing(_this, this.position, total)
				},
				whileloading: function(){
					_this.sm2_p_events.progress_loading(_this, this.bytesLoaded, this.bytesTotal) 
				}
			});
			
			
			this.current_song = url;
		},
		"play" : function(){
			var current_song = this.core.getSoundById(this.current_song);
			if (current_song) {
				current_song.resume()
			}
		},
		"stop" : function(){
			var current_song = this.core.getSoundById(this.current_song);
			if (current_song) {
				this.core.stop(this.current_song)
			}
		},
		"pause" : function(){
			var current_song = this.core.getSoundById(this.current_song);
			if (current_song) {
				this.core.pause(this.current_song)
			}
		},
		"changhe_volume": function(volume){
			this.volume = volume;
			var current_song = this.core.getSoundById(this.current_song);
			if (current_song) {
				current_song.setVolume(volume);
			}
		}
	},
	"sm2_actions_for_sandbox": {
		"set_new_position": function(position_factor){
			this.send_to_player_sandbox('set_new_position,' + position_factor);
		},
		"play_song_by_url": function(song_url,duration){
			this.send_to_player_sandbox('play_song_by_url,' + song_url + ',' + duration);
		}
		,
		"play":function(){
			this.send_to_player_sandbox('play');
		}
		,
		"stop":function(){
			this.send_to_player_sandbox('stop');
		}
		,
		"pause":function(){
			this.send_to_player_sandbox('pause');
		},
		"changhe_volume": function(volume_value){
			seesu.player.call_event(VOLUME, volume_value);
			this.send_to_player_sandbox('changhe_volume,' + volume_value);
		}
	},
	"sm2_p_events": 
		(typeof seesu === 'object') ?
		{
			"playing": function(_this){
				seesu.player.call_event(PLAYED);
			},
			"paused": function(_this){
				seesu.player.call_event(PAUSED);
			},
			"finished": function(_this){
				seesu.player.call_event(FINISHED);
			},
			"init": function(_this){
				seesu.player.call_event(INIT);
			},
			"created": function(_this){
				seesu.player.call_event(CREATED);
			},
			"stopped": function(_this){
				seesu.player.call_event(STOPPED);
			},
			"volume": function(_this,volume_value){
				_this.volume = volume_value;
				seesu.player.call_event(VOLUME, volume_value);
			},
			"progress_playing": function(_this, progress_value, total){
				
				var progress = parseInt(progress_value);
				var total = parseInt(total);
				
				var current = Math.round((progress/total) * 300);
				
				_this.track_progress_play[0].style.width = current + 'px'
			},
			"progress_loading": function(_this, progress_value, total){
				var progress = parseInt(progress_value);
				var total = parseInt(total);
				
				var current = Math.round((progress/total) * 300);
				
				_this.track_progress_load[0].style.width = current + 'px'
			}
		}
	  :
		{
			//feedback of iframe flash
			"playing": function(_this){
				_this.send_to_player_source('playing');
			},
			"paused": function(_this){
				_this.send_to_player_source('paused');
			},
			"finished": function(_this){
				_this.send_to_player_source('finished');
			},
			"init": function(_this){
				_this.send_to_player_source('init');
			},
			"created": function(_this){
				_this.send_to_player_source('created');
			},
			"stopped": function(_this){
				_this.send_to_player_source('stopped');
			},
			"volume": function(_this, volume_value){
				_this.volume = volume_value;
				_this.send_to_player_source('volume,'+volume_value);
			},
			"progress_playing": function(_this, progress_value, total){
				_this.send_to_player_source('progress_playing,'+progress_value + ',' + total);
			},
			"progress_loading": function(_this, progress_value, total){
				_this.send_to_player_source('progress_loading,'+progress_value + ',' + total);
			}
			
		},
	"send_to_player_sandbox": function(message){
		//using for sending messages to flash injected in iframe
		this.player_container[0].contentWindow.postMessage('sm2_p_iframe,' + message, '*');
	},
	"send_to_player_source": function(message){
		//using for feedback messages from iframe flash
		this.player_source_window.postMessage('sm2_p_source,' + message, '*');
	},
	"listen_commands_of_source": function(e){
		var _this = this;
		if (e.origin.indexOf('widget://') == -1) {
			return
		} else {
			if (e.data.match(/sm2_p_iframe/)){
				var commands  = e.data.replace('sm2_p_iframe,','').split(",");
				this[commands.shift()].apply(this, commands);
			}
		}
	},
	"listen_commands_of_sandbox": function(e){
		if (e.data.match(/sm2_p_source/)){
			var commands  = e.data.replace('sm2_p_source,','').split(",");
			this.sm2_p_events[commands.shift()].apply(this, [seesu.player.musicbox].concat(commands));
		}
		
	}
};