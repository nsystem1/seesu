/*
freeze
!restoreFreezed
show_now_playing

!!!show_playlist_page
show_track_page
*/
var appModel;
(function() {
"use strict";



appModel = function(){};
provoda.Model.extendTo(appModel, {
	init: function(){
		this._super();
		
		this.navigation = [];
		this.map = new browseMap();

		return this;
	},
	checkUserInput: function(opts) {
		if (opts.ext_search_query) {
			this.search(opts.ext_search_query);
		}

		var state_recovered;
		if (this.p && this.p.c_song){
			if (this.p.c_song && this.p.c_song.plst_titl){
				this.show_now_playing(true);
				state_recovered = true;
			}
		}

		if (state_recovered){
			opts.state_recovered = true;
		}
		if (!state_recovered && !opts.ext_search_query){
			this.trigger('handle-location');
		}

		//big_timer.q.push([tracking_opts.category, 'process-thins-sui', big_timer.comp(tracking_opts.start_time), 'seesu ui in process', 100]);
		this.start_page.updateState('can-expand', true);

	},
	infoGen: function(dp, c, base_string){
		if (dp){
			if (c.prev){
				c.str += ', ';
			}
			c.str += base_string.replace('%s', dp);
			if (!c.prev){
				c.prev = true;
			}
		}	
	},
	getRemainTimeText: function(time_string, full){
		var d = new Date(time_string);
		var remain_desc = '';
		if (full){
			remain_desc += localize('wget-link') + ' ';
		}
		
		
		remain_desc += d.getDate() + 
		" " + localize('m'+(d.getMonth()+1)) + 
		" " + localize('attime') + ' ' + d.getHours() + ":" + d.getMinutes();
		
		return remain_desc;
	},
	changeNavTree: function(nav_tree) {
		this.nav_tree = $filter(nav_tree, 'resident');
		this.checkNowPlayNav();
	},
	nowPlaying: function(mo) {
		this.updateState('now-playing', mo.getTitle());
		this.current_playing = mo;
		this.checkNowPlayNav();
	},
	checkNowPlayNav: debounce(function() {
		if (this.current_playing){
			this.updateState('viewing-playing', this.nav_tree.indexOf(this.current_playing) != -1);
		}
		
	}, 30),
	playing: function() {
		this.updateState('playing', true);
	},
	notPlaying: function() {
		this.updateState('playing', false);
	},
	setDocTitle: function(title) {
		this.updateState('doc-title', title);
	},
	preparePlaylist: function(params, first_song){
		var pl = new songsList();
		pl.init(params, first_song, this.mp3_search, this.p);
		return pl;
	},
	restoreFreezed: function(transit, url_restoring){
		this.map.restoreFreezed(transit, url_restoring);
	},
	
	showStartPage: function(url_restoring){
		//mainaly for hash url games
		this.map.startNewBrowse(url_restoring);
	},
	'mapch-handlers': {
		"zoom-in": function(array) {
			var target;
			for (var i = array.length - 1; i >= 0; i--) {
				var cur = array[i];
				if (cur.type == 'move-view' && cur.value){
					target = cur.target;
					break;
				}
				
			}
			return target;
		},
		"zoom-out": function(array) {
			var target;
			for (var i = array.length - 1; i >= 0; i--) {
				var cur = array[i];
				if (cur.type == 'zoom-out' || cur.type == 'move-view'){//&& cur.value
					target = cur.target;
					break;
				}
				
			}
			return target;
		},
	},
	'model-mapch': {
		'move-view': function(change) {
			var parent = change.target.getParentMapModel();
			if (parent){
				parent.updateState('mp-has-focus', false);
			}
			change.target.updateState('mp-show', change.value);
		},
		'zoom-out': function(change) {
			change.target.updateState('mp-show', false);
		},
		'destroy': function(change) {
			change.target.mlmDie();
		}
	},
	animationMark: function(models, mark) {
		for (var i = 0; i < models.length; i++) {
			models[i].updateState('map-animating', mark);
		}
	},
	animateMapChanges: function(changes) {
		var 
			target_md,
			all_changhes = $filter(changes.array, 'changes');

		all_changhes = [].concat.apply([], all_changhes);
		var models = $filter(all_changhes, 'target');
		this.animationMark(models, changes.anid);

		for (var i = 0; i < all_changhes.length; i++) {
			var change = all_changhes[i];
		//	change.anid = changes.anid;
			var handler = this['model-mapch'][change.type];
			if (handler){
				handler.call(this, change);
			}
		}

		for (var i = changes.array.length - 1; i >= 0; i--) {
			var cur = changes.array[i];
			if (this['mapch-handlers'][cur.name]){
				target_md = this['mapch-handlers'][cur.name].call(this, cur.changes);
				break;
			}	
		}
		if (target_md){
			target_md.updateState('mp-has-focus', true);
			this.updateState('active-lev-num', {n: target_md.getLevNum()});
			this.updateState('show-search-form', target_md.state('needs-search-from'));
		}

		
		this.updateState('map-animation', changes);
		this.updateState('map-animation', false);
		this.animationMark(models, false);
	},
	keyNav: function(key_name) {
		var md = this.map.getCurMapL().resident;
		if (md.key_name_nav){
			var func = md.key_name_nav[key_name];
			func.call(md);
		}

	},
	bindMMapStateChanges: function(md, place) {
		var _this = this;
		

		md.on('mpl-attach', function() {
			var navigation = _this.getChild('navigation');
			var target_array = _this.getChild(place) || [];


			if (navigation.indexOf(md) == -1) {
				navigation.push(md);
				_this.setChild('navigation', navigation, true);
			}
			if (place){
				if (target_array.indexOf(md) == -1){
					target_array.push(md);
					_this.setChild(place, target_array, true);
				}
			}

		});
		md.on('mpl-detach', function(){
			var navigation = _this.getChild('navigation');
			var target_array = _this.getChild(place) || [];

			var new_nav = arrayExclude(navigation, md);
			if (new_nav.length != navigation.length){
				_this.setChild('navigation', new_nav, true);
			}
			if (place){
				var new_tarr = arrayExclude(target_array, md);

				if (new_tarr.length != target_array.length){
					_this.setChild(place, new_tarr, true);
				}
			}
			
		});
	},
	collectChanges: function(fn, args) {
		var aycocha = this.map.isCollectingChanges();
		if (!aycocha){
			this.map.startChangesCollecting();
		}

		fn.apply(this, args);

		if (!aycocha){
			this.map.finishChangesCollecting();
		}
	},
	showTopTacks: function (artist, vopts, start_song) {
		this.collectChanges(this._showTopTacks, arguments);
	},
	showMetroChart: function() {
		this.collectChanges(this._showMetroChart, arguments);
	},
	showResultsPage: function() {
		this.collectChanges(this._showResultsPage, arguments);
	},
	showArtcardPage: function() {
		this.collectChanges(this._showArtcardPage, arguments);
	},
	showStaticPlaylist: function() {
		this.collectChanges(this._showStaticPlaylist, arguments);
	},
	show_playlist_page: function() {
		this.collectChanges(this._show_playlist_page, arguments);
	},
	show_track_page: function() {
		this.collectChanges(this._show_track_page, arguments);
	},
	show_now_playing: function() {
		this.collectChanges(this._show_now_playing, arguments);
	},
	show_tag:function() {
		this.collectChanges(this._show_tag, arguments);
	},
	showArtistPlaylist:function() {
		this.collectChanges(this._showArtistPlaylist, arguments);
	},
	showAlbum:function() {
		this.collectChanges(this._showAlbum, arguments);
	},
	_show_now_playing: function(no_stat){

		var current_map_md = this.map.getCurrentResident();
		if (!this.p.c_song || current_map_md == this.p.c_song){
			return false;
		}
		if (!no_stat){
			this.trackEvent('Navigation', 'now playing');
		}
		this.restoreFreezed(true);
		this.show_track_page(this.p.c_song);
		
		
	},
	_showResultsPage: function(query, no_navi){
		var lev;
		var cur_el = this.search_el;
		if (!cur_el || !cur_el.state('mp-has-focus') || !cur_el.lev.isOpened()){
			var md = this.createSearchPage();
			var _this = this;
			md.on('state-change.mp-show', function(e) {
				if (e.value){
					_this.search_el = this;
				}
				
			});


			this.bindMMapStateChanges(md, 'invstg');
			lev = this.map.goDeeper(false, md);
		} else {
			lev = this.search_el.lev;
		}
		
		var invstg = lev.resident;
		invstg.changeQuery(query);

	},
	_showArtcardPage: function(artist, save_parents, no_navi){
		var md = new artCard(artist);
		this.bindMMapStateChanges(md, 'artcard');
		var lev = this.map.goDeeper(save_parents, md);
	},
	_showStaticPlaylist: function(pl, save_parents, no_navi) {
		if (pl.lev && pl.lev.canUse() && !pl.lev.isOpened()){
			this.restoreFreezed();
		} else {
			this.show_playlist_page(pl, save_parents, no_navi);
		}
	},
	_show_playlist_page: function(pl, save_parents, no_navi){
		this.bindMMapStateChanges(pl, 'playlist');
		var lev = this.map.goDeeper(save_parents, pl);
	},
	_show_track_page: function(mo, no_navi){
		var _this = this,
			title = (mo.plst_titl.belongsToArtist(mo.artist) ? '' : (mo.artist + ' - '))  + mo.track;
		
		var pl = mo.plst_titl;
			pl.lev.sliceTillMe(true);
		this.bindMMapStateChanges(mo);
		var lev = this.map.goDeeper(true, mo);
	},
	

	_show_tag: function(tag, vopts, start_song){
		//save_parents, no_navi
		vopts = vopts || {};
		var full_no_navi = vopts.no_navi;
		vopts.no_navi = vopts.no_navi || !!start_song;
		
		var pl_r = this.preparePlaylist({
			title: 'Tag: ' + tag,
			type: 'artists by tag',
			data: {tag: tag}
		}, start_song);

		pl_r.setLoader(function(paging_opts) {
			
			var request_info = {};
			lfm.get('tag.getTopArtists',{
				tag:tag,
				limit: paging_opts.page_limit,
				page: paging_opts.next_page
			})
				.done(function(r){
					var artists = toRealArray(getTargetField(r, 'topartists.artist'));
					var track_list = [];

					su.art_images.checkLfmData('tag.getTopArtists', r, artists);
					if (artists && artists.length) {

						var l = Math.min(artists.length, paging_opts.page_limit);
						for (var i=0; i < l; i++) {
							track_list.push({
								artist: artists[i].name,
								lfm_image: {
									array: artists[i].image
								}
							});
						}

					}
					pl_r.injectExpectedSongs(track_list);
					if (track_list.length < paging_opts.page_limit){
						pl_r.setLoaderFinish();
					}
				})
				.fail(function() {
					pl_r.loadComplete(true);
				}).always(function() {
					request_info.done = true;
				});
			return request_info;
		}, true);


		this.show_playlist_page(pl_r, vopts.save_parents, vopts.no_navi);
		
		if (start_song){
			pl_r.showTrack(start_song, full_no_navi);
		}
	},

	_showArtistPlaylist: function(artist, pl, vopts){
		vopts = vopts || {};
		var cpl = this.p.isPlaying(pl);
		if (!cpl){
			if (!vopts.from_artcard){
				this.showArtcardPage(artist, vopts.save_parents, true);
			}
			this.show_playlist_page(pl, !vopts.from_artcard || !!vopts.save_parents, vopts.no_navi);
			return false;
		} else{
			this.restoreFreezed();
			return cpl;
		}
	},
	/*
	var vopts = {
		save_parents: save_parents,
		no_navi,
		from_artcard
	}*/
	_showAlbum: function(opts, vopts, start_song){
		var artist			= opts.artist, 
			name			= opts.album_name,
			id				= opts.album_id, 
			original_artist	= opts.original_artist;

		vopts = vopts || {};
		var full_no_navi = vopts.no_navi;
		vopts.no_navi = vopts.no_navi || !!start_song;
		
		var pl = this.preparePlaylist({
			title: '(' + artist + ') ' + name,
			type: 'album',
			data: {artist: original_artist || artist, album: name}
		}, start_song).loading();
	
		var recovered = this.showArtistPlaylist(original_artist || artist, pl, vopts);
		



		if (!recovered){
			var getAlbumPlaylist = function(album_id, pl){
				if (album_id) {
					lfm.get('playlist.fetch',{
						'playlistURL': 'lastfm://playlist/album/' + album_id
					})
						.done(function(r){
							su.art_images.checkLfmData('playlist.fetch', r);
							var playlist = toRealArray(getTargetField(r, 'playlist.trackList.track'));
							var music_list = [];
							for (var i=0; i < playlist.length; i++) {
								music_list.push({
									track: playlist[i].title, 
									artist: playlist[i].creator,
									lfm_image: {
										item: playlist[i].image
									}
								});
							}
							pl_r.injectExpectedSongs(music_list);
						});
				}
			};
			if (id){
				getAlbumPlaylist(id, pl);
			} else{
				lfm.get('album.getInfo',{'artist': artist, album : name})
					.done(function(r){
						su.art_images.checkLfmData('album.getInfo', r);
						var tracks = toRealArray(getTargetField(r, 'album.tracks.track'));
						var track_list = [];
						var imgs = getTargetField(r, 'album.image');
						for (var i = 0; i < tracks.length; i++) {
							var cur = tracks[i];
							track_list.push({
								artist: cur.artist.name,
								track: cur.name,
								lfm_image: {
									array: imgs
								}
							});
							tracks[i]
						}
						pl.injectExpectedSongs(track_list);
						//getAlbumPlaylist(r.album.id, pl);
					});
			}
		}
		if (start_song){
			(recovered || pl).showTrack(start_song, vopts.no_navi);
		}
	},

	_showTopTacks: function(artist, vopts, start_song) {
		vopts = vopts || {};
		var full_no_navi = vopts.no_navi;
		vopts.no_navi = vopts.no_navi || !!start_song;
		
		
		
		var pl = this.preparePlaylist({
			title: 'Top of ' + artist,
			type: 'artist',
			data: {artist: artist}
		}, start_song);
		
		var recovered = this.showArtistPlaylist(artist, pl, vopts);
		
		if (!recovered){
			pl.setLoader(function(paging_opts) {
				
				var request_info = {};
				lfm.get('artist.getTopTracks', {
					'artist': artist, 
					limit: paging_opts.page_limit, 
					page: paging_opts.next_page
				})
					.done(function(r){
						if (r.error){
							pl.loadComplete(true);
							return;
						}
						var tracks = toRealArray(getTargetField(r, 'toptracks.track'));

						su.art_images.checkLfmData('artist.getTopTracks', r, tracks);

						var track_list = [];
						if (tracks.length) {
							var l = Math.min(tracks.length, paging_opts.page_limit);
							for (var i=paging_opts.remainder; i < l; i++) {
								track_list.push({
									artist : artist ,
									track: tracks[i].name,
									lfm_image: {
										array: tracks[i].image 
									}
									
								});
							}
							
						}
						pl.injectExpectedSongs(track_list);
						if (track_list.length < paging_opts.page_limit){
							pl.setLoaderFinish();
						}
					})
					.fail(function() {
						pl.loadComplete(true);
					})
					.always(function() {
						request_info.done = true;
					});
				return request_info;
			}, true);

		}
		if (start_song){
			(recovered || pl).showTrack(start_song, full_no_navi);
		}
	},
	createMetroChartPlaylist: function(country, metro) {
		var pl = this.preparePlaylist({//can autoload
			title: 'Chart of ' + metro,
			type: 'chart',
			data: {country: country, metro: metro}
		});
		pl.setLoader(function(paging_opts) {
			var request_info = {};
			lfm.get('geo.getMetroUniqueTrackChart', {
				country: country, 
				metro: metro,
				limit: 30,
				start: (new Date()) - 60*60*24*7,
				page: paging_opts.next_page
			})
				.done(function(r) {
					if (r.error){
						pl.loadComplete(true);
						return;
					}

					var tracks = toRealArray(getTargetField(r, 'toptracks.track'));
					su.art_images.checkLfmData('geo.getMetroUniqueTrackChart', r, tracks);
					var track_list = [];
					if (tracks.length) {
						var l = Math.min(tracks.length, paging_opts.page_limit);
						for (var i=paging_opts.remainder; i < l; i++) {
							var cur = tracks[i];
							track_list.push({
								artist : cur.artist.name,
								track: cur.name, 
								lfm_image: {
									array: cur.image 
								} 
							});
						}
						
					}
					pl.injectExpectedSongs(track_list);
					if (track_list.length < paging_opts.page_limit){
						pl.setLoaderFinish();
					}

				})
				.fail(function() {
					pl.loadComplete(true);
				})
				.always(function() {
					request_info.done = true;
				});

			return request_info;
		});
		return pl;
	},
	_showMetroChart: function(country, metro, vopts){
		vopts = vopts || {};
		var pl = this.createMetroChartPlaylist(country, metro);
		pl.loadMoreSongs();
		this.show_playlist_page(pl, vopts.save_parents, vopts.no_navi);
	},
	showSimilarArtists: function(artist, vopts, start_song){
		vopts = vopts || {};
		var full_no_navi = vopts.no_navi;
		vopts.no_navi = vopts.no_navi || !!start_song;
		
		var pl = this.preparePlaylist({//can autoload
			title: 'Similar to «' + artist + '» artists',
			type: 'similar artists',
			data: {artist: artist}
		}, start_song).loading();

		
		var recovered = this.showArtistPlaylist(artist, pl, vopts);
		if (!recovered){

			pl.setLoader(function(paging_opts){
				var request_info = {};
				lfm.get('artist.getSimilar',{
					artist: artist, 
					limit: paging_opts.page_limit, 
					page: paging_opts.next_page
				})
					.done(function(r){
						var artists = toRealArray(getTargetField(r, 'similarartists.artist'));
						su.art_images.checkLfmData('artist.getSimilar', r, artists);
						var track_list = [];

						if (artists && artists.length) {
							var l = Math.min(artists.length, paging_opts.page_limit);
							for (var i=0; i < l; i++) {
								track_list.push({
									artist: artists[i].name,
									lfm_image: {
										array: artists[i].image
									}
								});
							}

						}
						pl.injectExpectedSongs(track_list);
						if (track_list.length < paging_opts.page_limit){
							pl.setLoaderFinish();
						}
					})
					.fail(function() {
						pl.loadComplete(true);
					})
					.always(function() {
						request_info.done = true;
					});
			}, true);
			
		
		}
		
		if (start_song){
			(recovered || pl).showTrack(start_song, full_no_navi);
		}
	},
	search: function(query, no_navi){
		var old_v = this.state('search-query');
		if (query != old_v){
			if (!query) {
				this.showStartPage();
			} else {
				this.showResultsPage(query, no_navi);
			}

		}
		this.updateState('search-query', query);
		
	}

});

})();