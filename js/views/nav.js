define(['provoda'], function(provoda) {
"use strict";

var baseNavUI = function() {};

provoda.View.extendTo( baseNavUI, {
	dom_rp: true,
	createBase: function() {
		/**/
		this.useBase(this.root_view.getSample('common-nav'));
		//this.c = $('<span class="nav-item"><span>.</span><b></b></span>');
	}/*,
	createDetailes: function(){
		this.createBase();
		this.bindClick();
		var text_place = this.c.find('span');
		if (text_place){
			this.text_place = text_place;
		}
		this.dom_related_props.push('text_place');
	},
	stack_types: ['top', 'bottom', 'middle'],
	state_change: {
		"mp_show": function(opts) {
			if (opts){
				this.c.removeClass('hidden');
			} else {
				this.c.addClass('hidden');
			}
		},
		'mp_has_focus': function(state) {
			if (!state){
				this.c.addClass('nnav');
			} else {
				this.c.removeClass('nnav');
			}
		},
		'mp_stack': function(state, old_state) {
			if (state){
				if (this.stack_types.indexOf(state) != -1){
					this.c.addClass('stack-' + state);
				}
				if (old_state){
					this.c.removeClass('stack-' + old_state);
				}
				

			} else {
				this.resetStackMark();
			}
		},
		"nav_title": function(text) {
			this.c.attr('title', text || '');
			if (this.text_place){
				this.text_place.text(text || '');
			}
		}
	},

	resetStackMark: function() {
		this.c.removeClass('stack-bottom stack-middle stack-top');
	},
	bindClick: function() {
		var _this = this;
		this.c.click(function(){
			_this.RPCLegacy('zoomOut');
		});
		this.addWayPoint(this.c, {
			canUse: function() {

				//mp_show && mp_stack || !mp_has_focus
				return _this.state('mp_show') && (_this.state('mp_stack') || !_this.state('mp_has_focus'));
			}
		});
	}*/
});


var StartPageNavView = function() {};

baseNavUI.extendTo(StartPageNavView, {
	createBase: function(){
		//this.c = $('<span class="nav-item nav-start" title="Seesu start page"><b></b><span class="icon">.</span></span>');
		this.useBase(this.root_view.getSample('start_page-nav'));
	}/*,
	'stch-mp_stack':function(state) {
		//mp_stack && mp_stack == !!mp_stack
		if (state && state == !!state){
			this.c.addClass('stacked');
		} else {
			this.c.removeClass('stacked');
		}
	},
	'stch-mp_has_focus': function(state) {
		if (!state){
			this.c.addClass("nav-button");
		} else {
			this.c.removeClass("nav-button");
		}
	}*/
});


var investgNavUI = function() {};

baseNavUI.extendTo(investgNavUI, {
	createBase: function() {
	//	this.c = $('<span class="nav-item nav-search_results" title="Search results"><b></b><span class="icon">.</span></span>');
		this.useBase(this.root_view.getSample('search_page-nav'));

	}/*,
	"stch-nav_title": function(text) {
		this.c.attr('title', text || '');
	}*/
});
return {
	baseNavUI:baseNavUI,
	StartPageNavView:StartPageNavView,
	investgNavUI:investgNavUI
};
});
