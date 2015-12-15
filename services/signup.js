var mongo = require("./mongodb");
var mongoURL = "mongodb://localhost:27017/facebook";


function handle_request(msg, callback){
	
	var response = {code:200, value:"Success"};
	console.log("In handle request Signup:"+ msg.firstName);
	
	mongo.connect(mongoURL, function(){
		var coll = mongo.collection('user');
		
		coll.findOne({email:msg.queryParams.email}, function(err, results){
			if(err) {
				response.code = 401;
				callback(null, response);
			} else {
				if(results){
					response.code = 200;
					response.value = "Email id exists";
					response.emailExists = true;
					callback(null, response);
				} else {
					coll.insert(msg.queryParams, function(err, user){
						if (!err) {
							console.log("Updated: "+JSON.stringify(user));
							var newUserDetails = {userid:user.ops[0]._id.toString(), employment:'', education:'', description:'', contactNumber:'', dateOfBirth:''};
							mongo.collection('user_details').insert(newUserDetails, function(err, user_details){
								if(!err) {
									var newUserInterests = {userid:user.ops[0]._id.toString(), books:[], shows:[], movies:[], sports:[], music:[]};
									mongo.collection('user_interests').insert(newUserInterests, function(err, user_details){
										if(!err) {
											response.code = 200;
											response.value = "Success Login " + msg.firstname;
											response.emailExists = false;
											callback(null, response);
										} else {
											response.code = 401;
											console.log("Error in create user-interests "+response.code);
											response.value = "Sigup Failed";
											callback(null, response);
										}
									});
								} else {
									response.code = 401;
									console.log("Error in create user-details "+response.code);
									response.value = "Sigup Failed";
									callback(null, response);
								}
							});
						} else {
							response.code = 401;
							console.log("returned false "+response.code);
							response.value = "Sigup Failed";
							callback(null, response);
						}
					});
				}
			}
		});

	}); 		
}

exports.handle_request = handle_request;