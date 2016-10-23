define(['js/LfmAuth', 'app_serv', '../comd', 'spv', 'pv'], function(LfmAuth, app_serv, comd, spv, pv) {
"use strict";
var pvUpdate = pv.update;

var LfmTagSong = spv.inh(LfmAuth.LfmLogin, {
	init: function(target) {
		target.lwch(target, 'petags', function(state) {
			if (state) {
				if (state.length && !target.state('user_tags_string')) {
					pvUpdate(target, 'user_tags_string', state.join(', '));
				}
			}
		});

	}
}, {
	'compx-artist': [['^^^artist']],
	'compx-track': [['^^^track']],
	'nest-tags_page': ['#catalog/[:artist]/tags', false, 'artist'],
	'compx-artist_tags': [['@one:simple_tags_list:tags_page']],
	'effect-personal_tags': [
		[
			'self', ['canload_personal', 'artist', 'track'],
			function (self) {
				self.requestState('personal_tags');
			}
		],
		[['canload_personal', 'artist', 'track']]
	],
	'effect-track_tags': [
		[
			'self', ['artist', 'track'],
			function (self) {
				self.requestState('toptags');
			}
		],
		[['artist', 'track']]
	],
	'compx-active_view': [['^active_view']],
	'compx-access_desc': [['#locales.lastfm-tagging-access']],
	comma_regx: /\s*\,\s*/,
	comma_regx_end: /\s*\,\s*$/,
	'compx-possible_tags':{
		depends_on: ['user_tags_string'],
		fn: function(user_tags_string) {
			if (!user_tags_string) {return [];}
			return (user_tags_string && spv.getExistingItems(user_tags_string.trim().split(this.comma_regx))).slice(0, 10) || [];
		}
	},
	'compx-petags': {
		depends_on: ['personal_tags'],
		fn: function(personal_tags) {
			return spv.filter(personal_tags, 'name');
		}
	},
	'compx-petags_result':{
		depends_on: ['petags', 'petags_fixed'],
		fn: function(petags, petags_fixed) {
			return petags_fixed || petags;
		}
	},
	'compx-tags_toadd': {
		depends_on: ['petags_result', 'possible_tags'],
		fn: function(petags_result, possible_tags) {
			return spv.arrayExclude(possible_tags, petags_result);
		}
	},
	'compx-tags_toremove': {
		depends_on: ['petags_result', 'possible_tags'],
		fn: function(petags_result, possible_tags) {
			return spv.arrayExclude(petags_result, possible_tags);

		}
	},
	'compx-has_changes': {
		depends_on: ['tags_toadd', 'tags_toremove'],
		fn: function(tags_toadd, tags_toremove) {
			return !!((tags_toadd && tags_toadd.length) || (tags_toremove && tags_toremove.length));
		}
	},
	'compx-canload_personal': {
		depends_on: ['#lfm_userid', 'active_view'],
		fn: spv.hasEveryArgs
	},
	saveTagsChanges: function() {
		var _this = this;
		var tags_toremove = this.state('tags_toremove');
		if (tags_toremove && tags_toremove.length){
			tags_toremove.forEach(function(tag) {
				var req = _this.app.lfm.post('track.removeTag', {
					sk: _this.app.lfm.sk,
					artist: _this.state('artist'),
					track: _this.state('track'),

					tag: tag
				});
				req.then(function() {
					var petags_result = _this.state('petags_result') || [];
					petags_result = spv.arrayExclude(petags_result, tag);

					pvUpdate(_this, 'petags_fixed', petags_result);
				});
				_this.addRequest(req);
					/*
					.always(function(){
						//pvUpdate(_this, 'wait_love_done', false);
						//_this.trigger('love-success');
					});*/
			});

		}

		var tags_toadd = this.state('tags_toadd');
		if (tags_toadd && tags_toadd.length){
			var req = _this.app.lfm.post('track.addTags', {
				sk: _this.app.lfm.sk,
				artist: _this.state('artist'),
				track: _this.state('track'),

				tags: tags_toadd.join(',')
			});

			req.then(function() {
				var petags_result = _this.state('petags_result');
				if (petags_result){
					petags_result = petags_result.slice();
				} else {
					petags_result = [];
				}
				petags_result.push.apply(petags_result, tags_toadd);


				pvUpdate(_this, 'petags_fixed', petags_result);
			});
			_this.addRequest(req);
				/*.always(function(){
					//pvUpdate(_this, 'wait_love_done', false);
					//_this.trigger('love-success');
				});*/

		}

		/*

		track.removeTag
		artist (Required) : The artist name
track (Required) : The track name
tag (Required) : A single user tag to remove from this track.
api_key (Required) : A Last.fm API key.
api_sig (Required) : A Last.fm method signature. See authentication for more information.
sk (Required) : A session key generated by authenticating a user via the authentication protocol.



artist (Required) : The artist name
track (Required) : The track name
tags (Required) : A comma delimited list of user supplied tags to apply to this track. Accepts a maximum of 10 tags.
api_key (Required) : A Last.fm API key.
api_sig (Required) : A Last.fm method signature. See authentication for more information.
sk (Required) : A session key generated by authenticating a user via the authentication protocol

		this.app.lfm.post('Track.love', {
			sk: this.app.lfm.sk,
			artist: this.song.state('artist'),
			track: this.song.state('track')
		})
			.always(function(){
				pvUpdate(_this, 'wait_love_done', false);
				_this.trigger('love-success');
			});*/
	},
	addTag: function(tag_name) {
		var current_tags = this.state('possible_tags');
		if (!current_tags || current_tags.indexOf(tag_name) == -1){

			var full_string = (this.state('user_tags_string') || '');
			if (current_tags && current_tags.length){
				full_string += ', ';
			}
			full_string += tag_name;

			pvUpdate(this, 'user_tags_string', full_string);
		}

		//console.log(tag_name);
	},
	changeTags: function(string) {
		pvUpdate(this, 'user_tags_string', string);
	},
	req_map: [
		[
			['toptags'],
			function(r) {
				return [spv.toRealArray(spv.getTargetField(r, 'toptags.tag'))];
			},
			['lfm', 'get', function() {
				return ['track.getTopTags', {
					'artist': this.state('artist'),
					'track': this.state('track')
				}];
			}]
		],
		[
			['personal_tags'],
			function(r) {
				return [spv.toRealArray(spv.getTargetField(r, 'tags.tag'))];
			},
			['lfm', 'get', function() {
				return ['track.getTags', {
					'artist': this.state('artist'),
					'track': this.state('track'),
					'user': this.state('#lfm_userid')
				}, {nocache: true}];
			}]

		]
	]
});


var SongActTaging = spv.inh(comd.BaseCRow, {}, {
	actionsrow_src: '^',
	'nest-lfm_tagsong': [LfmTagSong],
	model_name: 'row-tag'
});
return SongActTaging;

});
