var mysql = require('mysql');
var async = require('async');
//var esIndex = require("./elasticSearchIndex");
var elasticsearch = require('elasticsearch')
var pool = mysql.createPool({
	host     : 'localhost',
	user     : 'root',
	password : 'sample123',
	port: '3306',
	database: 'music4u'
});


var elasticClient = new elasticsearch.Client({
	host: 'localhost:9200',
	log: 'trace'
});

function indexThisrow(callback, row)
{
	var rowId = row[0].audioId;
	console.log(row);
	elasticClient.create({
		index: 'music4u',
		type: 'musictype',
		id: rowId,
		body: {
			audioName: row[0].audioName,
			owner: row[0].owner,
			author: row[0].author,
			language: row[0].language,
			genre: row[0].genre,
			producer: row[0].producer,
			director: row[0].director,
			description: row[0].description
		}
	}, function (err, results){
		if(err)
			throw err;
		else
		{
			callback(err, "Success!");
		}
	});
}

function insertUser(callback,firstname,lastname,email,confirm_password){

	var sql = "INSERT INTO User (password, firstname, lastname, email) VALUES('"+ confirm_password + "','" + firstname + "','" + lastname + "','" + email + "')";
	//console.log(sql);
	pool.getConnection(function(err, connection){
		connection.query(sql, function(err, results) {
			if (err) {
				throw err;
			}
			else
			{
				callback(err, results);
			}
			console.log(results);
		});
		connection.release();
	});	
}

function validateUser(callback,email,password){
	console.log("Email: " + email + "Password: " + password);
	var sql = "SELECT * FROM User where email = '" + email + "'" + " and password = '" + password + "'";
	console.log(sql);
	pool.getConnection(function(err, connection){
		connection.query( sql,  function(err, rows){
			if(err)	{
				throw err;
			}else{		  		
				console.log("DATA : "+JSON.stringify(rows));
				callback(err, rows);		  		
			}
		});		  
		connection.release();
	});	
}

function getAudio(callback,userId){
	console.log(userId);
	var sql = "SELECT * from audio as a where a.userId ="+userId+" or a.userId in (select f.followerId from followerList as f where f.userId = "+userId+") order by a.userId";
	console.log(sql);
	pool.getConnection(function(err,connection){
		connection.query(sql,function(err,rows){
			if(err){
				throw err;
			}else{
				//console.log(JSON.stingify(rows));
				callback(err,rows);
			}
		});
	});
}


function getHomeAudioLatest(callback, slimit, elimit){
	var sql = "SELECT * FROM Audio JOIN Likes JOIN Comments ORDER BY creationDate DESC LIMIT "+slimit+", "+elimit;
	pool.getConnection(function(err, connection){
		connection.query( sql,  function(err, rows){
			if(err)	{
				throw err;
			}else{
				if(rows.length!==0){
					console.log("DATA : "+JSON.stringify(rows));
					callback(err, JSON.stringify(rows));
				}
			}
		});		  
		connection.release();
	});
}

/*var getWallAudio = function getWallAudioList(callback,userId)
{
	var connection  = mysql.createConnection({
		host     : 'localhost',
		user     : 'root',
		password : 'sample123',
		port: '3306',
		database: 'music4u'
	});
	var sql = "SELECT * FROM audio WHERE userId = '40' ";
	
	console.log("jibin");
	connection.connect();
	connection.query(sql, function(err, rows, fields) {
		  if (!err){
		    //console.log('The solution is: ', fields);
			  ///fields = rows
			  get_data(rows);
		  //return rows;
		  } else{
		    console.log('Error while performing Query.');
	}
		});
	//console.log(rows);

	connection.end();
	//return data;
	
}
function get_data(rows){
	console.log(rows);
}
console.log(getWallAudio);*/
function getHomeAudioTrendy(callback){
	var sql = "SELECT DISTINCT audioLiked, COUNT(audioLiked) AS CountOfLikes FROM Likes GROUP BY audioLiked;";
	pool.getConnection(function(err, connection){
		connection.query( sql,  function(err, rows){

			if(rows.length!==0){
				var audios = [];
				//async
				async.forEach(rows, getSpecificAudio, afterAllTasks);
				function getSpecificAudio(row, callback)
				{
					console.log('JSON row : '+JSON.stringify(row));
					var audioRow = JSON.stringify(row);
					var audioId = row.audioLiked;
					var numLikes = row.CountOfLikes;
					var audioList = row;
					console.log("num of likes : "+numLikes);
					var sqlCom = "SELECT COUNT(audioId) AS CountOfComments FROM Comments WHERE audioId = "+ audioId +" GROUP BY audioId";
					connection.query( sqlCom,  function(err, row){
						if(err)	{
							console.log(err);
							throw err;
						}else{
							if(row.length!=0) {
								var numComments = row[0].CountOfComments;
								console.log("num of comments : "+numComments);
							}
							else {
								var numComments = 0;
							}
							var sql = "SELECT * FROM Audio WHERE audioId = "+audioId;
							connection.query( sql,  function(err, row){
								if(err)	{
									throw err;
								}else{
									if(row.length!==0){
										//audios.push(JSON.stringify(row));
										console.log("{\"audio\":"+JSON.stringify(row)+",\"comments\":"+numComments+",\"likes\":"+numLikes);
										audios.push("{\"audio\":"+JSON.stringify(row)+",\"comments\":"+numComments+",\"likes\":"+numLikes);
										callback(err);
									}
								}
							});	
						}
					});	
				}
				function afterAllTasks(err) {
					console.log("DATA : "+audios);
					callback(err, audios);
				}
			}
		});		  
		connection.release();
	});
}

exports.retrieveAudio=function(callback, userId, audioId){
	console.log(userId+":"+audioId);
	var selectSql="select * from audio where audioId= ? and owner= ?";
	pool.getConnection(function(err, connection){
		connection.query(selectSql, [audioId,userId], function (err,results){
			if (err) {
				console.log("ERROR: " + err.message);
				//res.send(err.message);
				throw err;
			}else{
				console.log("second query");
				var audios = JSON.stringify(results);
				var commentSql="select * from comments where audioId= ? and userId= ?";
				connection.query(commentSql, [audioId,userId], function (err,comments){
					if (err) {
						console.log(err);
						throw err;

					}else{
						console.log("third query");
						var comment=JSON.stringify(comments);
						var likeSql="select count(*) as numberOfLikes from Likes where audioLiked= ? and whoLikes= ? and likeStatus=1";
						connection.query(likeSql, [audioId,userId], function (err,numberOfLikes){
							if (err) {
								console.log(err);
								throw err;

							}else{
								console.log(numberOfLikes[0].numberOfLikes);
								//res.json({"audio":results,"comments":comment,"likes":numberOfLikes});
								callback("{\"audio\":"+audios+",\"comments\":"+comment+",\"likes\":"+JSON.stringify(numberOfLikes)+"}");
							}
						});
					};
				});
			};
		});
		connection.release();
	});
};

function audioUpload1(callback, userId, author, language, genre, producer, director, description, releaseDate, audioName, owner, audioFileLoc, creationDate, lastModified, audioId){
	var sql="insert into Audio(audioId,author,language, genre,producer,director, description,releaseDate,audioName,owner,audioFileLoc,lastModified) values (?,?,?,?,?,?,?,?,?,?,?,?)";

	pool.getConnection(function(err, connection){
		connection.query(sql, [audioId,author,language, genre,producer,director, description,releaseDate,audioName,owner,audioFileLoc,creationDate,lastModified], 
				function (err,rows,fields){
			if (err) {
				console.log("ERROR: " + err.message);
				callback(err.message);
			}else{

				if(rows.length!=0)
				{
					var getsql = "select * from audio where audioId= "+audioId;
					connection.query( getsql,  function(err, row){
						if(err) {
							throw err;
						}
						else
						{
							if(row.length!=0){
								console.log('Row : '+JSON.stringify(row));
								//index into the elastic search
								var rowId = row[0].audioId;
								console.log('rowId : '+rowId);
								var jsonrow = JSON.stringify(row);
								var rowId1 = jsonrow.audioId;
								console.log('json rowId : '+rowId1);
								
								elasticClient.create({
									index: 'music4u',
									type: 'musictype',
									id: rowId,
									body: {
										audioName: row[0].audioName,
										owner: row[0].owner,
										author: row[0].author,
										language: row[0].language,
										genre: row[0].genre,
										producer: row[0].producer,
										director: row[0].director,
										description: row[0].description
									}
								}, function (err, results){
									if(err)
										throw err;
									else
									{
										console.log(results);
									}
								});
							}
						}
					});
				}
				//callback(JSON.stringify(data));
			}
		});
		connection.release();
	});
}

function insertAudio(data){
	var sql = "insert into audio(albumArt,audioFile, userId,artist,title, genre_id,description,name,created_at) values('"+data.albumArt+"','"+data.audioFile+"','"+data.userId+"','"+data.artist+"','"+data.title+"','"+data.genre+"','"+data.description+"','"+data.name+"','"+data.created+"')";
	pool.getConnection(function(err, connection){
		connection.query(sql, function(err, results) {
			if (err) {
				throw err;
				console.log(err);
			}
		});
		connection.release();
	});	
}

function getSearchedAudios(callback, keyword){
	// elastic search 
	console.log('Keyword*********** : '+keyword);
	elasticClient.search({
		  index: 'music4u',
		  q: '_all:'+keyword
		}, function (error, response) {
			var hits = response.hits.hits;
			console.log('Hits(Minu)******** : '+JSON.stringify(hits));
			callback(JSON.stringify(hits));
		});
}

exports.insertUser = insertUser;
exports.validateUser = validateUser;
exports.getAudio = getAudio;
exports.getHomeAudioLatest = getHomeAudioLatest;
exports.getHomeAudioTrendy = getHomeAudioTrendy;
exports.insertAudio = insertAudio;
exports.getSearchedAudios = getSearchedAudios;
