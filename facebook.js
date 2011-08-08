(function(win){
	if(!console){
		console = { log: function(msg){}};
	};

	var FacebookController = function(key, cb){
		var self = this;
		FacebookController.initialized = false;

		if(this.instance){
			return FacebookController.instance;
		}

		this.uid = null;
		
		this.init = function(cb){
			cb = cb || function(r){ console.log(r); }
			if(FacebookController.initialized){ return }

			var fbroot = document.getElementById("fb-root");
			if(!fbroot){ 
				var div = document.createElement("div");
				div.setAttribute("id", "fb-root");
				document.body.appendChild(div);
			}

			if(typeof FB != "object"){ return console.log("FB API could not be loaded for unknown reasons."); }
			if(!key){ return console.log("missing API Key / App ID"); }
			var options = {
				appId: key,
				status: true,
				cookie: true,
				xfbml: true,
				oauth: true
			};
			FB.init(options);
			
			// resize IFrame size
			if(parent !== window){
				FB.Canvas.setSize();
			}

			this.getUser(function(uid){
				var info = {
					isAuthorized: this.isAuthorized()
				};
				cb(info);
			});

			FacebookController.initialized = true;
		};

		this.isAuthorized = function(){
			return this.uid != null;
		};

		this.getUser = function(cb){
			cb = cb || function(r){ console.log(r); }
			if(this.isAuthorized()){ return cb(this.uid); }

			FB.getLoginStatus(function(resp){
				console.log(resp);
				if(resp && resp.authResponse){
					self.uid = resp.authResponse.userID;
					self.token = resp.authResponse.accessToken;
				}
				cb(this.uid);
			});
		};

		this.revokeAuth = function(returnURL, cb){
			FB.api({ method: 'Auth.revokeAuthorization' }, function(response) {
          			self.uid = null;
				self.token = null;
				if(returnURL !== null){ return location.href = returnURL; }
				typeof cb !== "function" && cb();
        		});
		};

		this.requestPermission = function(perm, granted, denied){
			perm = perm || '';
			granted = granted || function(){};
			denied = denied || function(){};

			FB.login(function(resp){
				console.log(resp);
				if(resp && resp.authResponse){
					self.uid = resp.authResponse.userID;
					self.token = resp.authResponse.accessToken;
					granted();
				} else {
					denied();
				}
			}, {scope: perm});
		};

		this.logout = function(cb){
			FB.logout(function(){
				if(typeof cb === "function"){ cb(); }
			});
		};

		this.share = function(opt, cb){
			opt = opt || {};
			cb = cb || function(r){ console.log(r); }
			
			if(!opt.link){
				return console.log("missing link to share");
			}

			FB.ui({
     				method: 'feed',
     				name: opt.headline || '',
     				link: opt.link,
     				picture: opt.imageURL || null,
     				caption: opt.caption || '',
     				description: opt.desc || ''
   			}, function(response) {
     				if (response && response.post_id) {
       					cb(true);
     				} else {
       					cb(false);
     				}
   			});
		};

		this.fqlQuery = function(queryString, cb){
			cb = cb || function(r){ console.log(r); }
			var query = FB.Data.query(queryString);
			query.wait(cb);
		};

		this.getFriends = function(cb){
			cb = cb || function(r){ console.log(r); }
			if(this.uid === null){ console.log("missing uid when looking for friends."); }
			this.fqlQuery("select name, uid from user where uid in(select uid1 from friend where uid2="+this.uid+")", function(rows){
				typeof cb === "function" && cb(rows);
			});
		};

		this.getLoggedInUser = function(cb){
			this.callGraphAPI("/me", cb);
		};

		this.getLikes = function(cb){
			this.callGraphAPI("/me/likes", cb);
		};

		this.callGraphAPI = function(path, cb){
			cb = cb || function(r){ console.log(r); }
			path = path + "?access_token="+this.token;
			console.log(path);
			FB.api(path, cb);
		};

		this.init(cb);

		FacebookController.instance = this;
	};
	
	if(!win["social"]){
		win["social"] = {};
	}

	if(win["social"]["facebook"]){ 
		console.log("namespace collision detected!"); 
	} else {
		win["social"]["facebook"] = FacebookController;
	}
})(this);
