module.exports.constants = {
    server_url: 'http://localhost:9000/'
};
// module.exports.constants = {
//     server_url:'https://video-playlist.herokuapp.com/'
// };
module.exports.mailConstants = {
    signup_header: 'Please activate your account',
    signup_body: 'Hi [USER_NAME], <br/><br/> Activate your account by clicking <a href="[ACTIVATE_URL]">here</a> <br/><br/> <b>Thanks</b>,<br/>Support Team',
	forget_password_header: 'You have requested for forget password',
	forget_password_body: 'Hi [USER_NAME], <br/><br/> <b>User name </b> : [USER_NAME] <br/><br/> <b>Password</b> : [PASSWORD] <br/><br/><b>Thanks</b>,<br/>Support Team'    
}
