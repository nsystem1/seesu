(function() {
"use strict";
//var d = window.document;
var cbp;
var chrome = window.chrome;
var opera = window.opera;
if (chrome && chrome.extension) {
	cbp = chrome.extension.getBackgroundPage();
} else if (window.opera && opera.extension && opera.extension.bgProcess){
	cbp = opera.extension.bgProcess;
}
// cbp.big_timer.setN('popup-start');
var need_ui = true;
if (need_ui){
	cbp.require(['spv', 'view_serv'], function(spv, view_serv) {
		if (!window){
			return;
		}
		view_serv.handleDocument(window.document);
	});
}
console.log(need_ui);
if (!need_ui) {
	return;
}

initViews(cbp.requirejs, cbp.appModel, cbp.views_proxies, window, true);

function initViews(requirejs, appModel, proxies, win, can_die, need_exposed) {
	//ui thread;
	requirejs(['js/views/AppView', 'pv', 'spv'], function(AppView, pv, spv) {
		appModel.updateLVTime(); // useless?

		var proxies_space = Date.now();
		proxies.addSpaceById(proxies_space, appModel);
		var mpx = proxies.getMPX(proxies_space, appModel);
		var doc = win.document;

		initMainView();

		if (!need_exposed) {
			return;
		}

		initExposedView();
		return;

		function initMainView() {
			var view = new AppView(options(), {d: doc, can_die: can_die});
			mpx.addView(view, 'root');
			view.onDie(function() {
				//views_proxies.removeSpaceById(proxies_space);
				view = null;
			});
			view.requestAll();
		}

		function initExposedView() {
			var exposed_view = new AppView.AppExposedView(options(true), {d: doc, can_die: can_die});
			mpx.addView(exposed_view, 'exp_root');
			exposed_view.requestAll();
		}

		function options(usual_flow) {
			return {
				mpx: mpx,
				proxies_space: proxies_space,
				_highway: {
					views_counter: 1,
					views_proxies: proxies,
					calls_flow: new pv.CallbacksFlow(win),
					local_calls_flow: new pv.CallbacksFlow(spv.getDefaultView(doc), !usual_flow, 250)
				}
			};
		}
	});
}

})();

/*



cbp.jsLoadComplete({
	test: function() {
		return cbp.app_env
	},
	fn: function() {
		cbp.handleDocument(window.document, {category: 'popup-init', start_time: 'popup-start'});
		//cbp.handleDocument(d);
	}
});
cbp.jsLoadComplete({
	test: function() {
		return cbp.appTelegrapher
	},
	fn: function() {

		var app_tph = new cbp.appTelegrapher();
		app_tph.init(window, {category: 'popup-init', start_time: 'popup-start'}, true);
		//
		cbp.app_view = app_tph.app_view;
	}
});*/
