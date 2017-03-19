module.exports.constants = {
    server_url: 'http://localhost:9000/',
    //server_url:'https://messaging-application.herokuapp.com/#!/',
    youtube_key:'AIzaSyCxWFaWnHGoTPRAB5i3p04wv5njSPX32qU',
    youtube_https_url_snippet:'https://www.youtube.com/watch?v=',
    youtube_http_url_snippet:'http://www.youtube.com/watch?v=',
    youtube_shorten_https_url_snippet:'https://youtu.be/',
    youtube_shorten_http_url_snippet:'http://youtu.be/',
            
};
module.exports.mailConstants = {
    signup_header: 'Please activate your account',
    signup_body: 'Hi [USER_NAME], <br/><br/> Activate your account by clicking <a href="[ACTIVATE_URL]">here</a> <br/><br/> <b>Thanks</b>,<br/>Support Team',
	forget_password_header: 'You have requested for forget password',
	forget_password_body: 'Hi [USER_NAME], <br/><br/> <b>User name </b> : [USER_NAME] <br/><br/> <b>Password</b> : [PASSWORD] <br/><br/><b>Thanks</b>,<br/>Support Team'    
}
