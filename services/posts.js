var mongo = require("./mongodb");
var mongoURL = "mongodb://localhost:27017/facebook";
var async = require('async');

function handle_request(msg, callback){
	
	var response = {};
	console.log("In handle request post:"+ msg.apiCall);
	
	mongo.connect(mongoURL, function(){
		var coll = mongo.collection('posts');
		
		switch(msg.apiCall) {
		case "getUserPosts": {
			//console.log("In getUserPosts " + msg.queryParams.userId);
			coll.find(msg.queryParams, {_id:0, creatorname:0}).sort({"createTime":-1}).toArray(function(err, posts){
				if (!err) {
					response.code = 200;
					response.posts = posts;
					callback(null, response);
				} else {
					response.code = 401;
					response.posts = null;
					console.log("Failure");
					callback(null, response);
				}
			});
		}
		break;
		case "createPost": {
			console.log("In createPost");
			coll.insert(msg.queryParams, function(err, post){
				if (!err) {
					response.code = 200;
					callback(null, response);
				} else {
					response.code = 401;
					callback(null, response);
				}
			});
		}
		break;	
		case "getNewsFeed": {
			console.log("In getNewsFeed");
			async.parallel([
			              function(callback_2){
			             var friendColl = mongo.collection('friends');
			        	 var userFriendQuery = {userid_1:msg.queryParams.userid};
			        	 var userFriendDisplay = {userid_2:1,_id:0};
			        	 friendColl.find(userFriendQuery, userFriendDisplay).toArray(function(err, friend_ids){
			        		 if(err) {
			        			 response.code=401;
			        			 callback(null, response);
			        		 }
	        		 var userids = new Array();
	        		 
	        		 for(var i=0; i<friend_ids.length; i++) {
	        			 userids.push(friend_ids[i].userid_2);
	        			 console.log("Adding to list: " + friend_ids[i].userid_2);
	        			 }
	        		 userids.push(msg.queryParams.userid);
	        		 console.log("Friends: " + userids);
	        		 var postColl = mongo.collection('posts');
	        		 postColl.find({userid: {$in : userids}}, {_id:0}).sort({"createTime":-1}).toArray(function(err, posts){
	        			 if(err) {
		        			 response.code=401;
		        			 callback(null, response);
		        		 }
	        			 response.newsFeed = posts;
	        			 callback_2();
	        		 });
	        	 });	 
			},function(callback_2){
				callback_2();
			}], function(err){
				if(err){
					console.log("Error in User About");
					response.code = 401;
					callback(null, response);
				} else {
					response.code = 200;
					console.log("Successful User About");
					callback(null, response);
				} 
			});
		}
		break;
		case "getFriendPosts": {
			//console.log("In getUserPosts " + msg.queryParams.userId);
			var newColl = mongo.collection('posts');
			newColl.find(msg.queryParams, {_id:0, creatorname:0}).sort({"createTime":-1}).toArray(function(err, posts){
				if (!err) {
					response.code = 200;
					response.posts = posts;
					callback(null, response);
				} else {
					response.code = 401;
					response.posts = null;
					console.log("Failure");
					callback(null, response);
				}
			});
		}
		break;
		}
		
	}); 		
}

exports.handle_request = handle_request;