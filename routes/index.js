var express = require('express');
var router = express.Router();
var mysql = require('./db/mysql_connect');
var fs = require('fs');
var crypto = require('crypto');
var redis = require('redis');
var session = require('express-session');
var redisStore = require('connect-redis')(session);
var client = redis.createClient(6379, "localhost");

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

router.get('/signin',function(req,res){
	res.render('signin');
});

router.get('/explore',function(req,res){
	res.render('explore');
});

router.get('/wall/:sessionId',function(req,res){
	res.render('wall',{sessionId:req.params.sessionId});
});

router.get('/wall/:sessionId/upload',function(req,res){
	res.render('upload',{sessionId:req.params.sessionId});
});


router.get('/signup',function(req,res){
	res.render('signup');
});

function generate_sessionId(callback)
{
	var current_date = (new Date()).valueOf().toString();
	var random = Math.random().toString();
	callback(crypto.createHash('sha1').update(current_date + random).digest('hex'));
}
router.post('/register',function(req,res){
	console.log(req.body);
	if(!req.body.hasOwnProperty('firstname') || !req.body.hasOwnProperty('lastname') || !req.body.hasOwnProperty('email') ||!req.body.hasOwnProperty('password')) {
		res.statusCode = 500;
		return res.send('Error 500: Post syntax incorrect.');
	}

	mysql.insertUser(function(err,results){
		if(err){
			throw err;
			console.log(err);
		}else{
			if(results.length == 0)
			{
				var msg = "Not able to store the user";
				res.end({Error : msg});
			}
			else
			{
				//console.log(results);
				var usrId = results.insertId;
				generate_sessionId(function(result) {
					if(result.length != 0) {
						req.session.userId = usrId;
						req.session.sessionId = result;
						console.log(result);
						//res.render(200,'/wall/'+result,{sessionId : req.session.sessionId,userId : req.session.userId})
						res.status(200).send({sessionId : req.session.sessionId,userId : req.session.userId});
						//res.send('{\"sessionId\" : \"'+ req.session.sessionId + '\"}');
					}
				});
			}
		}
	},req.param('firstname'),req.param('lastname'), req.param('email'), req.param('password'));
});

router.post('/login',function(req,res){
	if(!req.body.hasOwnProperty('email') ||!req.body.hasOwnProperty('password')) {
		res.statusCode = 400;
		return res.send('Error 400: Post syntax incorrect.');
	}

	mysql.validateUser(function(err,results){
		if(err){
			throw err;
		}else{
			if(results.length == 0)
			{
				var msg = "Your credentials don't match. Please try again.";
				res.end({Error : msg});
			}
			else
			{
				console.log(results);
				var usrId = results[0].userId;
				generate_sessionId(function(result) {
					if(result.length != 0) {
						client.rpush([result, usrId], function(err, reply) {
							console.log(reply); //prints 2
						});
						req.session.sessionId = result;
						res.status(200).send({
							sessionId : req.session.sessionId,
							userId : req.session.userId
						});
						/*res.render('wall', {
							sessionId : req.session.sessionId,
							userId : req.session.userId
						});*/
//						res.end('{\"sessionId\" : \"'+ req.session.sessionId + '\"}');
					}
				});
			}
		}
	},req.param('email'),req.param('password'));
});
module.exports = router;
