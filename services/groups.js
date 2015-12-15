var mongo = require("./mongodb");
var mongoURL = "mongodb://localhost:27017/facebook";
var async = require("async");

function handle_request(msg, callback){
	
	var response = {};
	console.log("In handle request friend:"+ msg.apiCall);
	
	mongo.connect(mongoURL, function(){
		
		switch(msg.apiCall) {
		case "createGroup": {
			console.log("In createGroup");
			var coll = mongo.collection('groups');
			//var query = [{userid_1:msg.queryParams.userid, userid_2:msg.queryParams.friendid, create_time: new Date()},{userid_1:msg.queryParams.friendid,userid_2:msg.queryParams.userid, create_time: new Date()}];
			console.log("createGroup query: "+ JSON.stringify(msg.queryParams));
			coll.insert(msg.queryParams, function(err, creategroup){
				if (!err) {
					response.code = 200;
					response.groupid=creategroup.ops[0]._id;
					console.log("Done createGroup");
					callback(null, response);
				} else {
					response.code = 401;
					callback(null, response);
				}
			});
			}
			break;
		case "getGroupProfile" : {
			console.log("In getGroupProfile");
			var coll = mongo.collection('groups');
			console.log("createGroup query: "+ JSON.stringify(msg.queryParams));
			var ObjectID = require('mongodb').ObjectID;
			try {
				var query = {_id: new ObjectID(msg.queryParams._id)};
			
			coll.findOne(query, function(err, groupData){
				if (!err) {
					response.code = 200;
					response.groupData=groupData;
					console.log("Done createGroup");
					callback(null, response);
				} else {
					response.code = 401;
					callback(null, response);
				}
			});
			} catch(err) {
				response.code = 401;
				response.groupData = {};
				callback(null, response);
			}
			}
			break;
		case "searchUser": {
			console.log("In getGroupProfile");
			var coll = mongo.collection('user');
			var ObjectID = require('mongodb').ObjectID;
			console.log("Check ObjId: " +new ObjectID(msg.queryParams.userid));
			//db.user.aggregate([{$match: {"_id":{"$nin":["56393f5ec8abf3b48f0750ca"]},"$or":[{"firstname":{"$regex":"^Joe"}},{"lastname":{"$regex":"^Joe"}}]}},{$project:{"userid":"$_id","_id":0}}] )
			var query = [{$match: {_id:{$nin:[new ObjectID(msg.queryParams.userid)]}, $or:[{firstname:{$regex:msg.queryParams.searchUser, $options: "i"}},{lastname:{$regex:msg.queryParams.searchUser, $options: "i"}}]}}, {$project:{"userid":"$_id","_id":0,"firstname":1,"lastname":1}}];
			console.log("searchUser query: "+ JSON.stringify(query));
			
			coll.aggregate(query).toArray( function(err, userData){
				if (!err) {
					response.code = 200;
					response.userData=userData;
					console.log("Done searchUser:" + JSON.stringify(userData));
					callback(null, response);
				} else {
					response.code = 401;
					callback(null, response);
				}
			});
			}
			break;
		case "addMember": {
			console.log("In addMember");
			var coll = mongo.collection('groups');
			var ObjectID = require('mongodb').ObjectID;
			var query = {$push:{members:msg.queryParams.user}};
			console.log("addMember query: "+ JSON.stringify(query));
			
			coll.update({_id: new ObjectID(msg.queryParams.groupid)}, query, function(err, userData){
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
		case "deleteMember": {
			console.log("In deleteMember");
			var coll = mongo.collection('groups');
			var ObjectID = require('mongodb').ObjectID;
			var query = {$pull:{members:{userid:msg.queryParams.userid}}};
			console.log("addMember query: "+ JSON.stringify(query));
			
			coll.update({_id: new ObjectID(msg.queryParams.groupid)}, query, function(err, userData){
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
		case "updateGroup": {
			console.log("In updateGroup");
			var coll = mongo.collection('groups');
			var ObjectID = require('mongodb').ObjectID;
			var query = {$set:msg.queryParams.updatedData};
			console.log("updateGroup query: "+ JSON.stringify(query));
			
			coll.update({_id: new ObjectID(msg.queryParams.groupid)}, query, function(err, userData){
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
		case "deleteGroup": {
			console.log("In deleteGroup");
			var coll = mongo.collection('groups');
			var ObjectID = require('mongodb').ObjectID;
			
			coll.remove({_id: new ObjectID(msg.queryParams.groupid)}, function(err, userData){
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
		case "getMyGroups": {
			console.log("In getMyGroups");
			var coll = mongo.collection('groups');
			async.series([
					function(callback_2) {
						coll.find({creatorid:msg.queryParams.userid}).toArray(function(err, myGroups){
							if(err) {
								console.log("Error in getMyGroups-1");
								callback(null, response);
							} else {
								response.myGroups=myGroups;
								callback_2();
							}
						});
					},
					function(callback_2) {
						coll.find({"members.userid":{$in:[msg.queryParams.userid]}}).toArray(function(err, otherGroups){
							if(err) {
								console.log("Error in getMyGroups-1");
								callback(null, response);
							} else {
								response.otherGroups=otherGroups;
								callback_2();
							}
						});
					},
					function(callback_2) {
						var userColl = mongo.collection('friends');
						userColl.find({userid_1:msg.queryParams.userid},{userid_2:1, _id:0}).toArray(function(err, friendsIds){
							if(err) {
								console.log("Error in getMyGroups-2");
								callback(null, response);
							} else {
								console.log("Friends retrieved: " + JSON.stringify(friendsIds));
								var ids = new Array();
								for(var i=0;i<friendsIds.length; i++) {
									ids.push(friendsIds[i].userid_2);
								}
								var query = [ 
								             {$match:{$and:[{creatorid:{$nin:[msg.queryParams.userid]}},{"members.userid":{$nin:[msg.queryParams.userid]}}, {$or:[{creatorid:{$in:ids}}, {"members.userid":{$in:ids}}]}]}},
								             {$project:{_id:1, groupname:1, numberOfValue: {$size:"$members"}}}, {$sort:{"numberOfValue":-1}} ];
								console.log("getMyGroups-3 query:"+JSON.stringify(query));
								coll.aggregate(query).toArray(function(err, friendGroupList){
									if(err) {
										console.log("Error in getMyGroups-3");
										callback(null, response);
									} else {
										response.friendGroupList=friendGroupList;
										callback_2();
									}
								});
							}
						});
					}
			                ],function(err){
				if(err) {
					console.log("Error in getMyGroups");
					response.code = 401;
					callback(null, response);
				} else {
					response.code = 200;
					console.log("Successful getMyGroups");
					callback(null, response);
				}
				
			});
			}
			break;
		}
	}); 
}

exports.handle_request = handle_request;