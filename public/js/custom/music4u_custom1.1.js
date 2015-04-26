Music4u = {
	"user":null,
	"general":null
};

Music4u.user  = function(window, document, undefined){
    'use strict';
	var user_param = {
		"user_session":'',
		"status" : false
		
	},
	check_login = function(){
		user_param.user_session = getCookie('user_session');
		if(user_param.user_session !=""){
			user_param.status = true;
		}else{
			user_param.status = false;
		}
	},
	getCookie = function(cName){
		var name = cName + '=';
		var ca = document.cookie.split(';');
		for(var i=0; i<ca.length; i++) {
			var c = ca[i];
			while (c.charAt(0)==' ') c = c.substring(1);
			if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
		}
		return "";
	},
	unsetkCookie = function(cname){
		
	},
	setCookie = function(cname, cvalue){
		document.cookie = cname + "=" + cvalue;
	},
	login = function(){
		var email = $("#email").val();
		var password = $("#password").val();
		alert(email);
		if(email !='' && password !=''){
			var data = {
				"email":email,
				"password":password
			}
			$.ajax({
					type: "POST",
					url: "/login",
					data: data,
					dataType: 'JSON',
					success: function(data) {
						//set cookie after login
							user_param.user_session = data.sessionId;
							setCookie("user_session",user_param.user_session);
							alert("Success:" + user_param.user_session);
							window.location.href= "/wall/"+data.sessionId;
					},
					cache: false,
					error: function(error) {
						unsetkCookie("user_session");
						console.log("login failed");
					}
				});
		}else{
			
		}
	},
	logout= function(){
		var data = {
			"email":"jibin"
		}
		$.ajax({
                type: "GET",
                url: "/logout",
                data: data,
                dataType: 'JSON',
                success: function(data) {
					//set cookie after login
					unsetkCookie("user_session");
					
                },
                cache: false,
                error: function(error) {
                    console.log("Ajax request has failed. logout failed");
                }
            });
	},
	audioUpload= function(){
		
		var files = $("#audioFile");
		var audio_file = new FormData(files);
		/*$.each(files, function(key, value)
		{
			data.append(key, value);
		});*/
		
		
		var data = {
			"session_id":session_id,
			"audio_file": audio_file
		}
		$.ajax({
                type: "POST",
                url: "/"+session_id+"/audio",
                data: data,
                dataType: 'JSON',
                success: function(data) {
					//set cookie after login
					unsetkCookie("email");
					window.location.href= "/wall/"+data.sessionId;
                },
                cache: false,
                error: function(error) {
                    console.log("Ajax request has failed. logout failed");
                }
            });
	},
	register = function(){
		var email = $("#email").val();
		var firstname = $("#firstname").val();
		var lastname = $("#lastname").val();
		var password = $("#confirm_password").val();
		//alert(name);
		//alert(email);
		var data = {
			"firstname": firstname,
			"lastname": lastname,
			"password":password,
			"email":email
		}
		$.ajax({
                type: "POST",
                url: "/register",
                data: data,
                dataType: 'JSON',
                success: function(data) {
					//set cookie after login
					//email = "jibin";
					setCookie("email",email);
					//alert("Success : " +data.sessionId);
					window.location.href= "/wall/"+data.sessionId;
                },
                cache: false,
                error: function(error) {
                    console.log(Error + "\nAjax request has failed. Registration Failed ");
                }
            });
	};
	
return {
        check_login: check_login,
        user_param: user_param,
        register: register,
        login: login,
        logout: logout
    };
}(this, document);

Music4u.general  = function(window, document, undefined){
	'use strict';
	var user_param = {
		"user_session":'',
		"status" : false
		
	},
	get_genere = function(){
		var data = {
			"session_id":session_id,
			"audio_file": audio_file
		}
		$.ajax({
                type: "GET",
                url: "/genere",
                data: data,
                dataType: 'JSON',
                success: function(data) {
					//set cookie after login
					unsetkCookie("email");
                },
                cache: false,
                error: function(error) {
                    console.log("Ajax request has failed. logout failed");
                }
            });
	};

return {
        get_genere: get_genere
    };
}(this, document);

function login_user(){
	
	var email = $('#email').val();
	var password = $('#password').val();
	
	if( password != '' && email !=''){
		Music4u.user.login();
	}
}

function signup_user(){
	Music4u.user.register();
}