var mongo = require("./mongodb");
var mongoURL = "mongodb://localhost:27017/facebook";
var async = require("async");

function handle_request(msg, callback){
	
	var response = {};
	console.log("In handle request friend:"+ msg.apiCall);
	
	mongo.connect(mongoURL, function(){
		var coll = mongo.collection('friends');
		
		switch(msg.apiCall) {
		case "getUserFriends": {
			console.log("In getUserFriends " + msg.queryParams.userId);
			async.parallel([
		         function(callback_2) {
		        	 var friendColl = mongo.collection('friends');
		        	 var userFriendQuery = {userid_1:msg.queryParams.userId};
		        	 var userFriendDisplay = {userid_2:1,_id:0};
		        	 coll.find(userFriendQuery, userFriendDisplay).toArray(function(err, friend_ids){
		        		 if(err) {
		        			 response.code=401;
		        			 callback(null, response);
		        		 }
		        		 var userids = new Array();
		        		 var ObjectID = require('mongodb').ObjectID;
		        		 for(var i=0; i<friend_ids.length; i++) {
		        			 userids.push(new ObjectID(friend_ids[i].userid_2));
		        			 }
		        		 console.log("Friends: " + userids);
		        		 var userColl = mongo.collection('user');
		        		 userColl.find({_id: {$in : userids}}, {firstname:1, lastname:1}).toArray(function(err, userFriends){
		        			 if(err) {
			        			 response.code=401;
			        			 callback(null, response);
			        		 }
		        			 response.userFriends = userFriends;
		        			 callback_2();
		        		 });
		        	 });
		        	 
		         },
		         function(callback_2) {
		        	 var friendColl = mongo.collection('friend_requests');
		        	 var userFriendRequestQuery = {requesteeid:msg.queryParams.userId , request_status:'Pending'};
		        	 var userFriendRequestDisplay = {requesterid:1,_id:0};
		        	 friendColl.find(userFriendRequestQuery, userFriendRequestDisplay).toArray(function(err, requesterids){
		        		 if(err) {
		        			 response.code=401;
		        			 callback(null, response);
		        		 }
		        		 var userids = new Array();
		        		 var ObjectID = require('mongodb').ObjectID;
		        		 for(var i=0; i<requesterids.length; i++) {
		        			 userids.push(new ObjectID(requesterids[i].requesterid));
		        			 }
		        		 console.log("Request Friends: " + userids);
		        		 var userColl = mongo.collection('user');
		        		 userColl.find({_id: {$in : userids}}, {firstname:1, lastname:1}).toArray(function(err, userRequests){
		        			 if(err) {
			        			 response.code=401;
			        			 callback(null, response);
			        		 }
		        			 response.userRequests = userRequests;
		        			 callback_2();
		        		 });
		        	 });
		         }
		                ],function(err){
					if(err) {
						console.log("Error");
					} else {
						response.code = 200;
						console.log("Successful retrieve friends data");
						callback(null, response);
					}
			});
		
		}
		break;
		case "unfriendUser": {
			console.log("In unfriendUser");
			var coll_2 = mongo.collection("friends");
			var removeQuery = {$or:[{userid_1:msg.queryParams.userid,userid_2:msg.queryParams.friendid},{userid_1:msg.queryParams.friendid,userid_2:msg.queryParams.userid}]}
			coll_2.deleteMany(removeQuery, function(err, result){
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
		case "searchRequest": {
			console.log("In searchRequest");
			async.parallel([
					         function(callback_2) {
					        	 var friendColl = mongo.collection('user');
					        	 var ObjectID = require('mongodb').ObjectID;
					        	 var ids = new Array();
					        	 ids.push(new ObjectID(msg.queryParams.userid));
					        	 //var searchQuery = {$or: [{firstname : {$regex: msg.queryParams.searchQuery}},{lastname : {$regex: msg.queryParams.searchQuery}}]};
					        	 var searchQuery = {_id : {$nin : ids},$or: [{firstname : {$regex: msg.queryParams.searchQuery, $options: "i"}},{lastname : {$regex: msg.queryParams.searchQuery, $options: "i"}}]};
					        	 console.log("searchQuery"+JSON.stringify(searchQuery));
					        	 friendColl.find(searchQuery, {firstname:1,lastname:1}).toArray(function(err, users){
					        		 if(err) {
					        			 response.code=401;
					        			 callback(null, response);
					        		 }
					        			 response.userResults = users;
					        			 console.log(JSON.stringify(users));
					        			 callback_2();
					        	 });
					        	 
					         },
					         function(callback_2) {
					        	 var groupColl = mongo.collection('groups');
					        	 var searchQuery = {groupname : {$regex: msg.queryParams.searchQuery.slice(1), $options: "i"}};
					        	 groupColl.find(searchQuery, {groupname:1}).toArray(function(err, groups){
					        		 if(err) {
					        			 response.code=401;
					        			 callback(null, response);
					        		 }
					        			 response.groupResults = groups;
					        			 callback_2();
					        	 });
					         }
					                ],function(err){
								if(err) {
									console.log("Error");
									response.code = 401;
									callback(null, response);
								} else {
									response.code = 200;
									console.log("Successful retrieve user: " + JSON.stringify(response));
									callback(null, response);
								}
						});
		}
		break;
		case "getUserProfile": {
			console.log("In getUserProfile");
			var coll_2 = mongo.collection("friends");
			var searchQuery = {userid_1:msg.queryParams.userid, userid_2:msg.queryParams.friendid};
			coll_2.findOne(searchQuery, function(err, result){
				if (!err) {
					if(result) {
						console.log("Are Friends");
						response.isFriend = true;
					} else {
						console.log("Not Friends");
						response.isFriend = false;
					}
					response.code = 200;
					callback(null, response);
				} else {
					response.code = 401;
					callback(null, response);
				}
			});
		}
		break;
		case "getFriendName": {
			console.log("In getFriendName: " + JSON.stringify(msg.queryParams));
			var coll_2 = mongo.collection("user");
			var ObjectID = require('mongodb').ObjectID;
			coll_2.findOne({_id:new ObjectID(msg.queryParams._id)}, {firstname:1, lastname:1, _id:0}, function(err, result){
				if (!err) {
					response.code = 200;
					if(result) {
						response.userData={};
						response.userData.firstname = result.firstname; 
						response.userData.lastname = result.lastname;
						response.noUser = false;
					} else {
						response.noUser = true;
					}
					callback(null, response);
				} else {
					response.code = 401;
					callback(null, response);
				}
			});
		}
		break;
		case "getFriendAbout": {
			console.log("In getFriendAbout");
			var coll_2 = mongo.collection("user_details");
			var aggregateQuery = [{$match: msg.queryParams}, {$project:{ _id:0, "Date Of Birth":"$dateOfBirth", "Employment":"$employment", "Education":"$education", "Contact Number":"$contactNumber", "Description":"$description"}}];
			console.log("AggregateQuery: "+ JSON.stringify(aggregateQuery));
			coll_2.aggregate(aggregateQuery, function(err, result){
				if (err) {
					response.code = 401;
					callback(null, response);
				}
				response.userAbout = result[0];
				var coll_3 = mongo.collection("life_events");
				coll_3.find(msg.queryParams, {userid:0,_id:0}).toArray(function(err, result2){
					if(err) {
						response.code = 401;
						callback(null, response);
					}
					response.code = 200;
					response.userEvents = result2;
					callback(null, response);
				});
	       	});
		}
		break;
		case "getFriendFriends": {
			var friendColl = mongo.collection('friends');
	       	 var userFriendDisplay = {userid_2:1,_id:0};
	       	 coll.find(msg.queryParams, userFriendDisplay).toArray(function(err, friend_ids){
	       		 if(err) {
	       			 response.code=401;
	       			 callback(null, response);
	       		 }
	       		 var userids = new Array();
	       		 var ObjectID = require('mongodb').ObjectID;
	       		 for(var i=0; i<friend_ids.length; i++) {
	       			 userids.push(new ObjectID(friend_ids[i].userid_2));
	       			 }
	       		 console.log("Friends: " + userids);
	       		 var userColl = mongo.collection('user');
	       		 userColl.find({_id: {$in : userids}}, {firstname:1, lastname:1}).toArray(function(err, userFriends){
	       			 if(err) {
		        			 response.code=401;
		        			 callback(null, response);
		        		 }
	       			 response.userFriends = userFriends;
	       			callback(null, response);
	       		 });
	       	 });
		}
		break;
		case "getFriendInterests": {
			console.log("In getFriendInterests");
			var coll = mongo.collection('user_interests');
			coll.findOne(msg.queryParams, function(err, userInterests){
				if (!err) {
					response.code = 200;
					//console.log("getUserInterests Result "+userInterests.books[0].title);
					response.userInterests = userInterests;
					console.log("Done getFriendInterests");
					callback(null, response);
				} else {
					response.code = 401;
					callback(null, response);
				}
			});
		}
		break;
		case "getFriendRequestStatus": {
			console.log("In getFriendRequestStatus");
			var coll2 = mongo.collection('friend_requests');
			var query = {request_status:{$nin:['Accepted','Declined','Cancelled']}, $or:[{requesterid:msg.queryParams.userid,requesteeid:msg.queryParams.friendid},{requesterid:msg.queryParams.friendid,requesteeid:msg.queryParams.userid}]};
			console.log(JSON.stringify(query));
			coll2.findOne(query, function(err, friendRequest){
				if (!err) {
					response.code = 200;
					if(friendRequest) {
						console.log("Friend Request present");
						response.friendRequestId = friendRequest._id;
						if(friendRequest.requesterid == msg.queryParams.userid) {
							response.requestStatus = "Request Pending";
						} else {
							console.log("Friend Request User to respond");
							response.requestStatus = "Respond To Request";
						}
					} else {
						console.log("No Friend Request");
						response.requestStatus = "Send Friend Request";
					}
					callback(null, response);
				} else {
					response.code = 401;
					callback(null, response);
				}
			});
		}
		break;
		case "acceptRequest": {
			console.log("In acceptRequest");
			var coll = mongo.collection('friends');
			var query = [{userid_1:msg.queryParams.userid, userid_2:msg.queryParams.friendid, create_time: new Date()},{userid_1:msg.queryParams.friendid,userid_2:msg.queryParams.userid, create_time: new Date()}];
			console.log("acceptRequest in friends: "+ JSON.stringify(query));
			coll.insert(query, function(err, friendUpdate){
				if (!err) {
					var ObjectID = require('mongodb').ObjectID;
					var coll2 = mongo.collection('friend_requests');
					var findQuery = {_id:new ObjectID(msg.queryParams.friendRequestId)};
					coll2.update(findQuery, {$set:{request_status:'Accepted'}}, function(err, requestUpdate){
						if(err) {
							response.code = 401;
							callback(null, response);
						}
						response.code = 200;
						console.log("Done acceptRequest");
						callback(null, response);
					});
				} else {
					response.code = 401;
					callback(null, response);
				}
			});
		}
		break;
		case "declineRequest": {
			console.log("In declineRequest");
			var coll = mongo.collection('friend_requests');
			var ObjectID = require('mongodb').ObjectID;
			coll.update({_id:new ObjectID(msg.queryParams.requestid)}, {$set:{request_status:'Declined'}}, function(err, userInterests){
				if (!err) {
					response.code = 200;
					console.log("Done declineRequest");
					callback(null, response);
				} else {
					response.code = 401;
					callback(null, response);
				}
			});
		}
		break;
		case "addAsFriend": {
			console.log("In addAsFriend");
			var coll = mongo.collection('friend_requests');
			msg.queryParams["request_status"] = "Pending";
			msg.queryParams["request_time"] = new Date();
			coll.insert(msg.queryParams, function(err, userInterests){
				if (!err) {
					response.code = 200;
					console.log("Done addAsFriend");
					callback(null, response);
				} else {
					response.code = 401;
					callback(null, response);
				}
			});
		}
		break;
		case "cancelRequest": {
			console.log("In cancelRequest");
			var coll = mongo.collection('friend_requests');
			coll.update(msg.queryParams,{$set:{request_status:'Cancelled'}}, function(err, userInterests){
				if (!err) {
					response.code = 200;
					console.log("Done cancelRequest");
					callback(null, response);
				} else {
					response.code = 401;
					callback(null, response);
				}
			});
		}
		break;
		}
		
	}); 		
}

exports.handle_request = handle_request;