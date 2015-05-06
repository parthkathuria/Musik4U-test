/**
 * New node file
 */

var mysql =  require('mysql');
var elasticsearch = require('elasticsearch');
var redis = require('redis');
var client = redis.createClient(6379, "localhost");
var connection =  mysql.createConnection({
	host : "localhost",
	user :"root",
	password:"",
	database:"music4u"

});

/*var elasticClient = new elasticsearch.Client({
	host: 'localhost:9200',
	log: 'trace'
});*/


exports.input = function(socket) {

	socket.on('userId',function(msg){
		client.set(msg.userId, socket.id, function(err) {
			if (err) throw err;
			console.log("User socket is now: " + socket.id);
		});
		client.get(msg.userId,function(err,id){
			console.log("Redis:" + id);
			if(err) throw err;
		})
	});

socket.on('clearUserId',function(msg){
	client.del(msg.userId,function(err){
		if(err) throw err;
		console.log("redis key deleted: " + msg.userId);
	});
});


	console.log('user connected' +socket.id);
	socket.on('comments', function(msg){
		console.log('message: ' + msg.comment +":"+msg.sessionId+msg.audioId);
		// var userId=getUserId(msg.sessionId);



		var userId=2;
		/*client.set(userId, socket.id, function(err) {
			if (err) throw err;
			console.log("User socket is now" + socket.id);
		});*/

		var audioId=msg.audioId;
		var comment=msg.comment;
		var sql="insert into comments(userId,audioId,comment) values (?,?,?)";

		connection.query(sql, [userId,audioId,comment], function (err,rows,fields){
			if(err) throw err;

		});
		socket.emit('comments', msg.comment);
	});

	socket.on('likes', function(msg){
		console.log('message likes:'+msg.sessionId+msg.audioId);
		// var userId=getUserId(msg.sessionId);


		/*client.set(userId, socket.id, function(err) {
			if (err) throw err;
			console.log("User socket is now" + socket.id);
		});*/
		var audioId=msg.audioId;
		var userId=msg.sessionId;

		var sql="insert into likes_table(user_id,audio_id) values (?,?)";

		connection.query(sql, [userId,audioId], function (err,rows,fields){
			if(err) throw err;
			else{
				var likeSql="select count(*) as numberOfLikes from likes_table where user_id=? and audio_id=?";
				connection.query(likeSql, [userId,audioId], function (err,numberOfLikes){
					if(err) throw err;
					else{
						var numOfLikes = numberOfLikes;
						var data = {
							'numOfLikes':numOfLikes,
							'userId' : userId
						}
						/*elasticClient.update({
							index: 'music4u',
							type: 'musictype',
							id: audioId,
							body: {
								script: 'ctx._source.num_likes += 1',
//							    upsert: {
//							    	num_likes: 1
//							    }
							}
						}, function (err, results){
							if(err)
								throw err;
							else
							{
								console.log("After re-insert: "+results);
								console.log("Number of likes ##### : "+numOfLikes);
								socket.emit('likes', numOfLikes);
							}
						});*/
						socket.emit('likes', data);
					}
				});
			};

		});

	});

		socket.on('unlikes', function(msg){
		console.log('message unlikes:'+msg.sessionId+msg.audioId);
		// var userId=getUserId(msg.sessionId);

		/*client.set(userId, socket.id, function(err) {
			if (err) throw err;
			console.log("User socket is now" + socket.id);
		});*/
		var audioId=msg.audioId;
		var userId=msg.sessionId;

		var sql="delete from likes_table where audio_id=? and user_id=?";

		connection.query(sql, [audioId,userId], function (err,rows,fields){
			//console.log("jibin");
			if(err) throw err;
			else{
				var likeSql="select count(*) as numberOfLikes from likes_table where user_id=? and audio_id=?";
				connection.query(likeSql, [userId,audioId], function (err,numberOfLikes){
					if(err) throw err;
					else{
						var numOfLikes = numberOfLikes;
						var data = {
							'numOfLikes':numOfLikes,
							'userId' : userId
						}
						/*elasticClient.update({
							index: 'music4u',
							type: 'musictype',
							id: audioId,
							body: {
								script: 'ctx._source.num_likes -= 1',
//							    upsert: {
//							    	num_likes: 1
//							    }
							}
						}, function (err, results){
							if(err)
								throw err;
							else
							{
								console.log("After re-insert: "+results);
								console.log("Number of likes ##### : "+numOfLikes);
								socket.emit('likes', numOfLikes);
							}
						});*/
						socket.emit('unlikes', data);
					}
				});
			};

		});

	});

	socket.on('follows', function(msg){
		console.log('message:'+msg.followerID+msg.profileId);
		// var userId=getUserId(msg.sessionId);

		var userId= msg.userId;
		/*client.set(userId, socket.id, function(err) {
			if (err) throw err;
			console.log("User socket is now" + socket.id);
		});*/
		var followerId = msg.followerId;
		var sql="insert into followerlist(userId,followerId) values (?,?)";

		connection.query(sql, [userId,followerId], function (err,rows,fields){
			if(err) throw err;
			// else{
			// 	var followSql="select count(*) as numberOfFollowers from followerlist where followerId=?  and status=1";
			// 	connection.query(followSql, [userId], function (err,numberOfFollowers){
			// 		if(err) throw err;
			// 		else{
			// 			socket.emit('follows', numberOfFollowers);
			// 		}
			// 	});
			// };

		});

	});

	socket.on('unfollow', function(msg){
		console.log('message:'+msg.sessionId+msg.audioId);
		// var userId=getUserId(msg.sessionId);

		var userId= msg.userId;
		/*client.set(userId, socket.id, function(err) {
			if (err) throw err;
			console.log("User socket is now" + socket.id);
		});*/
		var followerId = msg.followerId;
		var sql="delete from followerlist where userId=? and followerId=?";

		connection.query(sql, [userId ,followerId], function (err,rows,fields){
			if(err) throw err;
			// else{
			// 	var likeSql="select count(*) as numberOfFollowers from followerlist where followerId=?";
			// 	connection.query(likeSql, [userId], function (err,numberOfLikes){
			// 		if(err) throw err;
			// 		else{
			// 			socket.emit('follows', numberOfFollowers);
			// 		}
			// 	});
			// };

		});

	});


};
