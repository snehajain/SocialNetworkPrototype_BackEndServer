var mongo = require("./mongodb");
var mongoURL = "mongodb://localhost:27017/facebook";
var async = require("async");

function handle_request(msg, callback){
	
	var response = {};
	console.log("In handle request user:"+ msg.apiCall);
	//userAbout
	mongo.connect(mongoURL, function(){
		
		switch(msg.apiCall) {
		case "getUserAbout": {
			async.parallel([
	                function(callback_2) {
	                	var coll = mongo.collection('user_details');
	                	var aggregateQuery = [{$match: msg.queryParams}, {$project:{ _id:0, "Date Of Birth":"$dateOfBirth", "Employment":"$employment", "Education":"$education", "Contact Number":"$contactNumber", "Description":"$description"}}];
	        			coll.aggregate(aggregateQuery,  function(err, userAbout){
	        				if (!err) {
	        					response.userAbout = userAbout[0];
	        					callback_2();
	        				} else {
	        					response.code = 401;
	        					callback(null, response);
	        				}
	        			});
	                },
	                function(callback_2) {
	                	var coll = mongo.collection('life_events');
	        			coll.find(msg.queryParams).sort({event_date:-1}).toArray(function(err, lifeEvents){
	        				if (!err) {
	        					response.userEvents = lifeEvents;
	        					console.log("Successful User About" + JSON.stringify(lifeEvents));
	        					callback_2();
	        				} else {
	        					response.code = 401;
	        					callback(null, response);
	        				}
	        			});
	                }], function(err){
						if(err) {
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
		case "getUserInterests": {
			console.log("In getUserInterests");
			var coll = mongo.collection('user_interests');
			coll.findOne(msg.queryParams, function(err, userInterests){
				if (!err) {
					response.code = 200;
					//console.log("getUserInterests Result "+userInterests.books[0].title);
					response.userInterests = userInterests;
					console.log("Done getUserInterests");
					callback(null, response);
				} else {
					response.code = 401;
					callback(null, response);
				}
			});
		}
		break;	
		case "editAbout": {
			console.log("editAbout");
			var coll = mongo.collection('user_details');
			coll.update(msg.queryParams, {$set: msg.setParams}, {upsert:true}, function(err, result){
				if (!err) {
					response.code = 200;
					console.log("Done editAbout");
					callback(null, response);
				} else {
					response.code = 401;
					callback(null, response);
				}
			});
		}
		break;
		case "removeInterest" : {
			console.log("In getUserInterests");
			var coll = mongo.collection('user_interests');
			var removeQuery = {userid:msg.queryParams.userid};
			var type = msg.queryParams.interest_type;
			var pullCondition = {$pull:{}};
			pullCondition.$pull[type]={interest_id:msg.queryParams.interest_id};			
			console.log("pullCondition " + JSON.stringify(pullCondition));
			coll.update(removeQuery, pullCondition, function(err, result){
				if (!err) {
					response.code = 200;
					console.log("Done removeInterest");
					callback(null, response);
				} else {
					response.code = 401;
					callback(null, response);
				}
			});
		}
		break;
		case "searchInterest" : {
			console.log("In searchInterest");
			var coll = mongo.collection('user_interests');
			var type = msg.queryParams.interest_type + ".interest_id";
			var searchQuery = {userid:msg.queryParams.userid};
			var displayQuery = {_id:0};
			displayQuery[type] = 1;
			coll.findOne(searchQuery, displayQuery, function(err, result){
				if (err) {
					response.code = 401;
					console.log("Done searchInterest");
					callback(null, response);
				} 
				var ObjectID = require('mongodb').ObjectID;
				var interestIds = new Array();
				var typeDesc = msg.queryParams.interest_type;
				for(var i=0; i<result[typeDesc].length; i++) {
					interestIds.push(new ObjectID(result[typeDesc][i]["interest_id"]));
				}
				//var reg = new RegExp(msg.queryParams.query_name);
				console.log("Ids only "+interestIds + " msg.queryParams.query_name: ");
				coll = mongo.collection('interests');
				
				var query = {interest_type:typeDesc, $or: [{title : {$regex: msg.queryParams.query_name, $options: "i"}},{description : {$regex: msg.queryParams.query_name, $options: "i"}}], _id : {$nin : interestIds}};
				console.log("Query--: "+ JSON.stringify(query));
				coll.find(query).toArray(function(err, interests){
					if(err) {
						response.code = 401;
						console.log("Done searchInterest");
						callback(null, response);
					}
					response.code = 200;
					response.interests=interests;
					callback(null, response);
				});
			});
		}
		break;
		case "addInterest" : {
			console.log("In addInterest");
			var coll = mongo.collection('user_interests');
			var updateQuery = {userid:msg.queryParams.userid};
			var interestData = msg.queryParams.interest;
			var updateData = {$push:{}};
			updateData.$push[interestData.interest_type]={interest_id:interestData._id, title: interestData.title, description: interestData.description};
			//console.log("updateData "+JSON.stringify(updateData));
			coll.update(updateQuery, updateData, function(err, result){
				if (!err) {
					response.code = 200;
					console.log("Done addInterest");
					callback(null, response);
				} else {
					response.code = 401;
					callback(null, response);
				}
			});
		}
		break;
		case "addEvent" : {
			console.log("In addEvent");
			var coll = mongo.collection('life_events');
			var insertQuery = msg.queryParams.newEvent;
			insertQuery["userid"] = msg.queryParams.userid;
			console.log("insertQuery "+JSON.stringify(insertQuery));
			coll.insert(insertQuery, function(err, result){
				if (!err) {
					response.code = 200;
					console.log("Done addEvent");
					callback(null, response);
				} else {
					response.code = 401;
					callback(null, response);
				}
			});
		}
		break;
		case "createInterest" : {
			console.log("In createInterest");
			var coll = mongo.collection('interests');
			coll.insert(msg.queryParams, function(err, result){
				if (!err) {
					response.code = 200;
					console.log("Done createInterest");
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