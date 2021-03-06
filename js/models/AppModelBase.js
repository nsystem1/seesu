define(function(require) {
'use strict';
var pv = require('pv');
var spv = require('spv');
var BrowseMap = require('../libs/BrowseMap');
var animateMapChanges = require('js/libs/provoda/dcl/probe/animateMapChanges');

var AppModelBase = spv.inh(pv.Model, {
	init: function(target) {
		target.binded_models = {};
		// target.navigation = [];
		// target.map = ;
		target.current_mp_md = null;
		target.on('child_change-current_mp_md', function(e) {
			if (e.target){
				this.resortQueue();
			}

		});
		target.views_strucs = {};
	}
}, {
	'compx-full_url': [
		['@url_part:navigation.pioneer'],
		function (list) {
			return list && list.join('');
		}
	],
	'compx-doc_title': [
		['@nav_title:navigation.pioneer'],
		function (list) {
			if (!list) {
				return 'Seesu';
			}
			var as_first = list[list.length - 1];
			var as_second = list[list.length - 2];
			if (!as_second) {
				return as_first;
			}
			return as_first + ' ← ' + as_second;
		}
	],
	'effect-browser-location': [
	  [
	    ['#navi', 'self'], ['full_url'],
	    function(navi, self, url) {
				if (url == null) {return;}
				var bwlev = self.getNesting('current_mp_bwlev');
				navi.set(url, bwlev);
				self.trackPage(bwlev.getNesting('pioneer').model_name);
	    }
	  ],
	  [['doc_title']]
	],
	initMapTree: function(start_page, needs_url_history, navi) {
		this.useInterface('navi', needs_url_history && navi);
		pv.updateNesting(this, 'navigation', []);
		pv.updateNesting(this, 'start_page', start_page);

		this.map = BrowseMap.hookRoot(this, this.start_page);

		this.map
			.on('bridge-changed', function(bwlev) {
				animateMapChanges(this, bwlev);
			}, this.getContextOptsI());

		return this.map;
	},
	changeNavTree: function(nav_tree) {
		// this.nav_tree = spv.filter(nav_tree, 'resident');
		this.nav_tree = nav_tree;
		if (this.matchNav){
			this.matchNav();
		}

	},
	showStartPage: function(){
		var bwlev = BrowseMap.showInterest(this.map, []);
		BrowseMap.changeBridge(bwlev);
	},
	animationMark: function(models, mark) {
		for (var i = 0; i < models.length; i++) {
			pv.update(models[i].getMD(), 'map_animating', mark);
		}
	},
	resortQueue: function(queue) {
		if (queue){
			queue.removePrioMarks();
		} else {
			for (var i = 0; i < this.all_queues.length; i++) {
				this.all_queues[i].removePrioMarks();
			}
		}
		var md = this.getNesting('current_mp_md');
		if (md){
			if (md.checkRequestsPriority){
				md.checkRequestsPriority();
			} else if (md.setPrio){
				md.setPrio();
			}
		}

		this.checkActingRequestsPriority();
	},
	routePathByModels: function(pth_string, start_md, need_constr) {
		return BrowseMap.routePathByModels(start_md || this.start_page, pth_string, need_constr);

	},
	knowViewingDataStructure: function(constr_id, used_data_structure) {
		if (!this.used_data_structure) {
			this.used_data_structure = used_data_structure;
			pv.update(this.map, 'used_data_structure', used_data_structure);
			pv.update(this, 'used_data_structure', used_data_structure);
		}
		//console.log(1313)
	}
});


return AppModelBase;
});
