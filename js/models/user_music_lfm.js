define(function(require) {
'use strict';
var app_serv = require('app_serv');
var BrowseMap = require('js/libs/BrowseMap');
var LoadableList = require('./LoadableList');
var spv = require('spv');
var SongsList = require('./SongsList');
var ArtCard = require('./ArtCard');
var LfmAuth = require('js/LfmAuth');
var declr_parsers = require('js/modules/declr_parsers');
var $ = require('jquery');
var pv = require('pv');

var ArtistsList = ArtCard.ArtistsList;
var AlbumsList = ArtCard.AlbumsList;

var pvUpdate = pv.update;
var cloneObj = spv.cloneObj;
//
var UserCardLFMLogin = spv.inh(LfmAuth.LfmLogin, {}, {
	'compx-access_desc': [['^access_desc']],
	beforeRequest: function() {
		var auth = this.getNesting('auth');
		pvUpdate(auth, 'requested_by', this._provoda_id);
	},
	'compx-active': [
		['has_session', '@one:requested_by:auth'],
		function(has_session, requested_by) {
			return has_session && requested_by == this._provoda_id;
		}
	]
});

var no_access_compx = {
	depends_on: ['userid'],
	fn: function(userid) {
		return !userid;
	}
};

var auth_bh = {
	'compx-has_no_access': no_access_compx,
	'nest-pmd_switch': ['^'],
	'nest-auth_part': [UserCardLFMLogin, {
	  ask_for: 'for_current_user'
	}],

	'compx-userid': [
		['lfm_userid', '#lfm_userid', 'for_current_user'],
		function(lfm_userid, cur_lfm_userid, for_current_user) {
			return (for_current_user ? cur_lfm_userid : lfm_userid) || null;
		}
	],
	'compx-has_lfm_auth': [
		['for_current_user', '@one:has_session:auth_part'],
		function(for_current_user, sess) {
			return for_current_user && sess;
		}
	],

	'compx-parent_focus': [['^mp_has_focus']],
	'stch-has_lfm_auth': function(target, state) {
		if (state) {
			// если появилась авторизация,
			// то нужно выключить предложение авторизоваться
			target.switchPmd(false);
		}
	},
	'stch-parent_focus': function(target, state) {
		if (!state) {
			// если обзорная страница потеряла фокус,
			// то нужно выключить предложение авторизоваться
			target.switchPmd(false);
		}
	},
	'stch-lfm_userid': function(target, state) {
		if (state) {
			target.updateNesting('auth_part', null);
		}
	},
	'compx-acess_ready': [
		['has_no_access', '@one:active:auth_part'],
		function(no_access, active_auth) {
			return !no_access && active_auth;
		}
	],
	'stch-acess_ready': function(target, state) {
		if (state) {
			target.loadStart();
			target.showOnMap();
		}
	}
};

//LULA - LfmUserLibraryArtist
//непосредственно список композиций артиста, которые слушал пользователь
var LULATracks = spv.inh(SongsList, {}, cloneObj({
	'nest_req-songs-list': [
		declr_parsers.lfm.getTracks('tracks'),
		['#lfm', 'get', function() {
			return ['library.getTracks', {
				user: this.state('userid'),
				artist: this.head.artist_name
			}];
		}]
	]
}, auth_bh));

var slashPrefix = function(src) {
	return '/' + src;
};

//artist, один артист с треками
var LULA = spv.inh(BrowseMap.Model, {}, cloneObj({
	model_name: 'lula',
	netdata_as_states: {
		url_part: [slashPrefix, 'artist'],
		nav_title: 'artist',
		artist_name: 'artist',
		playcount: null,
		lfm_image: 'lfm_img'
	},
	net_head: ['artist_name'],
	'nest-all_time': ['all_time', {
	  preload_on: 'mp_has_focus',
	}],

	'compx-selected_image': {
		depends_on: ['lfm_image'],
		fn: function(lfm_i) {
			return lfm_i;
		}
	},
	'sub_page-all_time': [LULATracks, [null, 'All Time']]
}, auth_bh));


var UserArtists = spv.inh(LoadableList, {}, {
	model_name: 'lulas',
	main_list_name: 'artists',
	'nest_rqc-artists': LULA,
	'compx-has_no_access': no_access_compx
});

// var LULAs = function() {};//artists, список артистов
// UserArtists.extendTo(LULAs, cloneObj({
// 	'nest_req-artists': [
// 		declr_parsers.lfm.getArtists('artists'),
// 		['#lfm', 'get', function() {
// 			return ['library.getArtists', {
// 				user: this.state('userid')
// 			}];
// 		}]
// 	]

// }, auth_bh));

var TopLUArt = spv.inh(UserArtists, {}, cloneObj({
	'nest_rqc-artists': LULA,
	'nest_req-artists': [
		declr_parsers.lfm.getArtists('topartists'),
		['#lfm', 'get', function() {
			return ['user.getTopArtists', {
				user: this.state('userid'),
				period: this.head.timeword
			}];
		}]
	],
	head_by_urlname: {
		timeword: 'name_spaced'
	}
}, auth_bh));

var TopUserTracks = spv.inh(SongsList, {}, cloneObj({
	'nest_req-songs-list': [
		declr_parsers.lfm.getTracks('toptracks'),
		['#lfm', 'get', function() {
			return ['user.getTopTracks', {
				user: this.state('userid'),
				period: this.head.timeword
			}];
		}]
	],
	head_by_urlname: {
		timeword: 'name_spaced'
	}
}, auth_bh));


var LfmLovedList = spv.inh(SongsList, {}, cloneObj({
	'compx-access_desc': [['#locales.grant-love-lfm-access']],
	'nest_req-songs-list': [
		declr_parsers.lfm.getTracks('lovedtracks'),
		['#lfm', 'get', function() {
			return ['user.getLovedTracks', {
				user: this.state('userid')
			}];
		}]
	]
}, auth_bh));

var RecommArtList = spv.inh(ArtistsList, {}, cloneObj({
	page_limit: 30,
	'compx-access_desc': [['#locales.lastfm-reccoms-access']],
	'compx-loader_disallowed': [
		['loader_disallowed'],
		function() {
			return !app_serv.app_env.cross_domain_allowed;
		}
	],
	'nest_req-artists_list': [
		[function(xml) {
			var data_list = [];
			var artists = $(xml).find('channel item title');
			if (artists && artists.length) {
				for (var i=0, l = (artists.length < 30) ? artists.length : 30; i < l; i++) {
					var artist = $(artists[i]).text();
					data_list.push({
						artist: artist
					});
				}
			}
			return data_list;
		}],
		[function() {
			return {
				api_name: 'last_fm_xml',
				source_name: 'last.fm',
				get: function(url) {
					return $.ajax({
						url: 'http://ws.audioscrobbler.com/1.0/' + url,
						type: "GET",
						dataType: "xml"
					});
				},
				errors_fields: []
			};

		}, 'get', function() {
			return ['user/' + this.state('userid') + '/systemrecs.rss'];
		}]
	]
}, auth_bh));

var RecommArtListForCurrentUser = spv.inh(RecommArtList, {}, {
	'compx-loader_disallowed': null,
	'nest_req-artists_list': [
		declr_parsers.lfm.getArtists('recommendations'),
		['#lfm', 'get', function() {
			return ['user.getRecommendedArtists', {
				sk: this.app.lfm.sk
			}];
		}]
	]
});

var user_artists_sp = ['recommended', /*'library',*/ 'top:7day', /* 'top:1month',*/
	'top:3month', 'top:6month', 'top:12month', 'top:overall'];

var LfmUserArtists = spv.inh(BrowseMap.Model, {}, {
	model_name: 'lfm_listened_artists',
	'nest-lists_list':
		[user_artists_sp],
	'nest-preview_list':
		[user_artists_sp, {
		  preload_on: 'mp_has_focus',
		}],
	sub_page: {
		'recommended': {
			constr: RecommArtList,
			title: [
				['#locales.reccoms-for', 'userid'],
				function(recomms, userid) {
					return recomms && recomms + ' ' + userid;
				}
			]
		},
		// 'library': {
		// 	constr: LULAs,
		// 	title: 'library'
		// },
		'top:7day': {
			constr: TopLUArt,
			title: [null, 'top of 7day']
		},
		/*'top:1month':{
			constr: TopLUArt,
			title: 'top of month'
		},*/
		'top:3month':{
			constr: TopLUArt,
			title: [null, 'top of 3 months']
		},
		'top:6month':{
			constr: TopLUArt,
			title: [null, 'top of 6 months']
		},
		'top:12month':{
			constr: TopLUArt,
			title: [null, 'top of 12 months']
		},
		'top:overall':{
			constr: TopLUArt,
			title: [null, 'overall top']
		}
		//артисты в библиотеке
		//недельный чарт
		//
		//лучшие за последние  7 днея, лучше за 3 месяца, полгода, год
		//недельные чарты - отрезки по 7 дней
	}
});

LfmUserArtists.LfmUserArtistsForCU = spv.inh(LfmUserArtists, {}, {
	'sub_page-recommended': {
		constr: RecommArtListForCurrentUser,
		title: [['#locales.reccoms-for-you']]
	}
});



var LfmRecentUserTracks = spv.inh(SongsList, {}, cloneObj({
	getRqData: function() {
		if (!this.slice_time_end){
			this.slice_time_end = (new Date()/1000).toFixed();
		}
		return {
			user: this.state('userid'),
			extended: 1,
			to: this.slice_time_end,
			nowplaying: true
		};
	},

	'nest_req-songs-list': [
		declr_parsers.lfm.getTracks('recenttracks'),
		['#lfm', 'get', function() {
			return ['user.getRecentTracks', this.getRqData()];
		}]
	]
}, auth_bh));

var user_tracks_sp = [
	'loved', 'recent', 'top:7day', /*'top:1month',*/
	'top:3month', 'top:6month', 'top:12month', 'top:overall'];

var LfmUserTracks = spv.inh(BrowseMap.Model, {}, {
	model_name: 'lfm_listened_tracks',
	'nest-lists_list':
		[user_tracks_sp],
	'nest-preview_list':
		[user_tracks_sp, {
		  preload_on: 'mp_has_focus',
		}],
	sub_page: {
		'loved': {
			constr: LfmLovedList,
			title: [['#locales.loved-tracks']]
		},
		'recent':{
			constr: LfmRecentUserTracks,
			title: [null, "Recently listened"]
		},
		'top:7day': {
			constr: TopUserTracks,
			title: [null, 'top of 7day']
		},
		/*'top:1month':{
			constr: TopUserTracks,
			title: 'top of month'
		},*/
		'top:3month':{
			constr: TopUserTracks,
			title: [null, 'top of 3 months']
		},
		'top:6month':{
			constr: TopUserTracks,
			title: [null, 'top of 6 months']
		},
		'top:12month':{
			constr: TopUserTracks,
			title: [null, 'top of 12 months']
		},
		'top:overall':{
			constr: TopUserTracks,
			title: [null, 'overall top']
		}
		//лучшие за последние  7 днея, лучше за 3 месяца, полгода, год
		//недельные чарты - отрезки по 7 дней
	}
});


var UserNewReleases = spv.inh(AlbumsList, {}, cloneObj({
	'compx-access_desc': [['#locales.lastfm-reccoms-access']],
	page_limit: 50,
	'nest_req-albums_list': [
		declr_parsers.lfm.getAlbums('albums'),
		['#lfm', 'get', function() {
			return ['user.getNewReleases', {
				user: this.state('userid'),
				userecs: this.recomms ? 1 : 0
			}];
		}]
	]
}, auth_bh));

var UserLibNewReleases = spv.inh(UserNewReleases, {}, {});

var RecommNewReleases = spv.inh(UserNewReleases, {}, {
	recomms: true
});


var LfmUserTopAlbums = spv.inh(AlbumsList, {}, cloneObj({
	head_by_urlname: {
		timeword: 'name_spaced'
	},
	'nest_req-albums_list': [
		declr_parsers.lfm.getAlbums('topalbums'),
		['#lfm', 'get', function() {
			return ['user.getTopAlbums', {
				user: this.state('userid'),
				period: this.head.timeword
			}];
		}]
	]
}, auth_bh));



var user_albums_sp = ['recommended', 'new_releases', 'top:7day', /*'top:1month',*/
		'top:3month', 'top:6month', 'top:12month', 'top:overall'];

var LfmUserAlbums = spv.inh(BrowseMap.Model, {}, {
	model_name: 'lfm_listened_albums',
	'nest-lists_list':
		[user_albums_sp],
	'nest-preview_list':
		[user_albums_sp, {
		  preload_on: 'mp_has_focus',
		}],

	sub_page: {
		'recommended': {
			constr: RecommNewReleases,
			title: [
				['for_current_user', 'lfm_userid'],
				function(for_current_user, lfm_userid) {
					var base = 'new releases of artists recommended for ';
					return base + (for_current_user ? 'you' : lfm_userid);
				}
			]
		},
		'new_releases': {
			constr: UserLibNewReleases,
			title: [
				['for_current_user', 'lfm_userid'],
				function(for_current_user, lfm_userid) {
					var base = 'new releases of artists from %user% library';
					return base.replace('%user%', for_current_user ? 'your' : lfm_userid);
				}
			]
		},
		'top:7day':{
			constr: LfmUserTopAlbums,
			title: [null, 'Top of 7 days']
		},
		/*'top:1month':{
			constr: LfmUserTopAlbums,
			title: 'Top of 1 month'
		},*/
		'top:3month':{
			constr: LfmUserTopAlbums,
			title: [null, 'Top of 3 months']
		},
		'top:6month':{
			constr: LfmUserTopAlbums,
			title: [null, 'Top of 6 months']
		},
		'top:12month':{
			constr: LfmUserTopAlbums,
			title: [null, 'Top of 12 months']
		},
		'top:overall':{
			constr: LfmUserTopAlbums,
			title: [null, 'Overall top']
		}
	}
});



var TaggedSongs = spv.inh(SongsList, {}, cloneObj({
	'nest_req-songs-list': [
		declr_parsers.lfm.getTracks('taggings.tracks', false, 'taggings'),
		['#lfm', 'get', function() {
			return ['user.getPersonalTags', {
				user: this.state('userid'),
				taggingtype: 'track',
				tag: this.head.tag_name
			}];
		}]
	]
}, auth_bh));

var TaggedArtists = spv.inh(ArtistsList, {}, cloneObj({
	'nest_req-artists_list': [
		declr_parsers.lfm.getArtists('taggings.artists', false, 'taggings'),
		['#lfm', 'get', function() {
			return ['user.getPersonalTags', {
				user: this.state('userid'),
				taggingtype: 'artist',
				tag: this.head.tag_name
			}];
		}]
	]
}, auth_bh));


var TaggedAlbums = spv.inh(AlbumsList, {}, cloneObj({
	page_limit: 50,
	'nest_req-albums_list': [
		declr_parsers.lfm.getAlbums('taggings.albums', false, 'taggings'),
		['#lfm', 'get', function() {
			return ['user.getPersonalTags', {
				user: this.state('userid'),
				taggingtype: 'album',
				tag: this.head.tag_name
			}];
		}]
	]
}, auth_bh));

var user_tag_sp = ['artists', 'tracks', 'albums'];
var UserTag = spv.inh(BrowseMap.Model, {}, {
	model_name: 'lfm_user_tag',
	net_head: ['tag_name'],
	'nest-lists_list':
		[user_tag_sp],
	'nest-preview_list':
		[user_tag_sp, {
		  preload_on: 'mp_has_focus',
		}],
	sub_page: {
		'tracks': {
			constr: TaggedSongs,
			title: [null, 'Tracks']
		},
		'artists': {
			constr: TaggedArtists,
			title: [null, 'Artists']
		},
		'albums': {
			constr: TaggedAlbums,
			title: [null, "Albums"]
		}
	}
});

var LfmUserTags = spv.inh(LoadableList, {}, cloneObj({
	model_name: 'lfm_listened_tags',
	main_list_name: 'tags',
	page_limit: 3000,
	'nest_req-tags': [
		[
			{
				is_array: true,
				source: 'toptags.tag',
				props_map: {
					nav_title: 'name',
					url_part: 'name',
					tag_name: 'name',
					count: null
				}
			}
		],
		['#lfm', 'get', function() {
			return ['user.getTopTags', {
				user: this.state('userid')
			}];
		}]
	],
	'nest_rqc-tags': UserTag,


	tagsParser: function(r, field_name) {
		var result = [];
		var array = spv.toRealArray(spv.getTargetField(r, field_name));
		for (var i = 0; i < array.length; i++) {
			result.push({
				tag_name: array[i].name,
				count: array[i].count
			});
		}
		return result;
		//console.log(r);
	}
}, auth_bh));


var LfmUsersList = spv.inh(LoadableList, {}, {
	'nest_rqc-list_items': '#users/lfm:[:userid]',

	main_list_name: 'list_items',
	model_name: 'lfm_users',
	page_limit: 200
});

var LfmUsersListOfUser = spv.inh(LfmUsersList, {}, cloneObj({}, auth_bh));

var LfmFriendsList = spv.inh(LfmUsersListOfUser, {}, {
	beforeReportChange: function(list) {
		list.sort(function(a,b ){return spv.sortByRules(a, b, [
			{
				field: function(item) {
					switch (item.states.gender) {
						case 'f'://female
							return 1;
						case 'm'://male
							return 2;
						default:
							return 3;
					}
				}
			},
			{
				field: 'states.song_time_raw',
				reverse: true
			}
		]);});
		return list;
	},
	'nest_req-list_items': [
		declr_parsers.lfm.getUsers('friends'),
		['#lfm', 'get', function() {
			return ['user.getFriends', {
				recenttracks: true,
				user: this.state('userid')
			}];
		}]
	]
});
var LfmNeighboursList = spv.inh(LfmUsersListOfUser, {}, {
	getRqData: function() {
		return {
			user: this.state('userid')
		};
	},
	'nest_req-list_items': [
		declr_parsers.lfm.getUsers('neighbours'),
		['#lfm', 'get', function() {
			return ['user.getNeighbours', this.getRqData()];
		}]
	]
});

return {
	LfmUserArtists:LfmUserArtists,
	LfmUserTracks:LfmUserTracks,
	LfmUserTags:LfmUserTags,
	LfmUserAlbums:LfmUserAlbums,
	LfmUsersList: LfmUsersList,
	LfmFriendsList: LfmFriendsList,
	LfmNeighboursList: LfmNeighboursList
};

});
