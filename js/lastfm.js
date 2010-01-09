var apikey = '2803b2bcbc53f132b4d4117ec1509d65';
var	s = '77fd498ed8592022e61863244b53077d';
var api='http://ws.audioscrobbler.com/2.0/';
var lfm = function(method,params,callback) {
	if (method) {
		var pv_signature_list = [], // array of <param>+<value>
			params_full = params || {},
			apisig = ((params && (params.sk || params.token )) || (method == 'auth.getToken')) ? true : false; // yes, we need signature
		
		params_full.method = method;
		params_full.api_key = apikey;
		params_full.format = params_full.format || 'json';
		
		if(apisig) {
			for (var param in params_full) {
				if (!(param == 'format') && !(param == 'callback')){
					pv_signature_list.push(param + encodeURIComponent(params_full[param]));
				}
			}
			
			pv_signature_list.sort();
			
			var paramsstr = '';
			for (var i=0, l = pv_signature_list.length; i < l; i++) {
				paramsstr += pv_signature_list[i];
			};
			
			log(paramsstr + s);
			
			params_full.api_sig = hex_md5(paramsstr += s);
		}
		
		$.ajax({
		  url: api,
		  global: false,
		  type: "GET",
		  dataType: "json",
		  data: params_full,
		  error: function(r){
		  },
		  success: function(r){
			if (callback) {callback(r);}
		  }
		});
	}
};

var lfm_scroble = {
  handshake: function(callback){
  	var _this = this;
	var timestamp = ((new Date()).getTime()/1000).toFixed(0);
	return $.ajax({
		  url: 'http://post.audioscrobbler.com/',
		  global: false,
		  type: "GET",
		  dataType: "text",
		  data: {
		  	'hs': 'true',
		  	'p': '1.2.1',
		  	'c': 'tst',
		  	'v': '1.0',
		  	'u': 'YodaPunk',
		  	't': timestamp,
		  	'a': hex_md5(s + timestamp),
		  	'api_key': apikey,
		  	'sk': lfm_auth.sk
		  },
		  error: function(r){
		  },
		  success: function(r){
			var response = r.split(/\n/);
			if (response[0] == 'OK'){
				_this.s = response[1];
				if (callback) {callback();}
			} else {
				log(r)
			}
			
		  }
	})	
  },
  nowplay: function(artist,title){
  	
  	if (this.s) {
  		var _this = this;
  		return $.ajax({
		  url: 'http://post.audioscrobbler.com:80/np_1.2',
		  global: false,
		  type: "POST",
		  dataType: "text",
		  data: {
		  	's': _this.s,
		  	'a': artist,
		  	't': title
		  },
		  error: function(r){
		  },
		  success: function(r){
			log(r)
		  }
		})	
	} 
  	
  },
  submit: function(artist,title,duration){
  	
  	
  	if (this.s) {
  		var _this = this;
  		var timestamp = ((new Date()).getTime()/1000).toFixed(0);
  		
  		return $.ajax({
		  url: 'http://post2.audioscrobbler.com:80/protocol_1.2',
		  global: false,
		  type: "POST",
		  dataType: "text",
		  data: {
		  	's': _this.s,
		  	'a[0]': artist,
		  	't[0]': title,
		  	'i[0]': timestamp,
		  	'o[0]': 'P',
		  	'r[0]': ' ',
		  	'l[0]': duration,
		  	'b[0]': ' ',
		  	'n[0]': ' ',
		  	'm[0]': ' '
		  	
		  },
		  error: function(r){
		  },
		  success: function(r){
			log(r)
		  }
		})	
	} 
  	
  },
};
lfm_scroble.handshake();