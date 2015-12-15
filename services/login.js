var mongo = require("./mongodb");
var mongoURL = "mongodb://localhost:27017/facebook";

function handle_request(msg, callback){
	
	var response = {code:200, value:"Success"};
	console.log("In handle request:"+ JSON.stringify(msg));
	
	//mongo.connect(mongoURL, function(){
		var coll = mongo.collection('user');

		coll.findOne(msg.queryParams, function(err, user){
			if (user) {
				response.code = 200;
				console.log("Login success " + user.firstname);
				response.value = "Success Login " + user.firstname;
				response.username = user.firstname;
				response.lastname = user.lastname;
				response.userId = user._id;
				callback(null, response);
			} else {
				response.code = 401;
				console.log("returned false "+response.code);
				response.value = "Failed Login";
				callback(null, response);
			}
		});
//	}); 
//	mongo.close();
	//console.log("Response: " + response.code);
	
}

exports.handle_request = handle_request;