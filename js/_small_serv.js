hard_testing = false;

if (typeof console != 'object'){
	
	
	if  (navigator.userAgent.match(/Opera/)){
		log = function(){
				opera.postError.apply(opera, arguments)
			
		}
	} else {
		if (hard_testing) {
			document.addEventListener('DOMContentLoaded', function(){
				var h = document.getElementsByTagName('head')[0];
				var _s = document.createElement('script');
					_s.src = "http://userscripts.ru/js/nice-alert/nice_alert.js";
				h.appendChild(_s)
			}, false);
		}
		
	
		log = function(text){
			if (!hard_testing) {return false;}
			alert(text)	
		}
	}
	
	
	console = {};
	console.log = function(text){
		log(text)
	}	
} else {
	log = console.log
}






if ((typeof widget != 'object') || !widget.preferenceForKey){
	widget = {};
	widget.preferenceForKey = function(){return false}
	widget.setPreferenceForKey = function(){return false}
	
}