var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var User = mongoose.model('User');
var bCrypt = require('bcrypt-nodejs');
var Mailer = require('../mailer.js');
var config = require('../config.js');

module.exports = function(passport) {

    //sends successful login state back to angular
    router.get('/success_signup', function(req, res) {
        res.status(200).send({data:{ message: 'Mail has been sent to your email please verify', status: '200' }});
    });

    //sends failure login state back to angular
    router.get('/failure_signup', function(req, res) {
        res.status(401).send({data:{ status: '401', message: "User already exists" }});
    });

    //sends successful login state back to angular
    router.get('/success_login', function(req, res) {
        res.status(200).send({data:{ message: 'success', status: '200', data: req.user ? req.user : {} }});
    });

    //sends failure login state back to angular
    router.get('/failure_login', function(req, res) {
        res.status(401).send({data:{ status: '401', message: "Invalid username or password Or user is not activated" }});
    });

    //log in
    router.post('/login', passport.authenticate('login', {
        successRedirect: '/auth/success_login',
        failureRedirect: '/auth/failure_login'
    }));

    //sign up
    // router.post('/signup', passport.authenticate('signup', {
    //     successRedirect: '/auth/success_signup',
    //     failureRedirect: '/auth/failure_signup'
    // }));
    //sign up
    router.post('/signup', function(req, res) {
        var req_data = req.body;
        console.log(req_data);
        // find a user in mongo with provided username
        User.findOne({ '$or': [{ 'username': req_data.name }, { 'email': req_data.email }] }, function(err, user) {
            // In case of any error, return using the done method
            if (err) {
                console.log('Error in SignUp: ' + err);
                res.status(500).send({data:{ message: 'something went wrong', status: '500' }});
            }
            // already exists
            if (user) {
                console.log('User already exists with username: ' + req_data.name);
                res.status(200).send({data:{ message: 'User already exists', status: '200' }});
            } else {
                // if there is no user, create the user
                var newUser = new User();

                // set the user's local credentials
                newUser.username = req_data.name;
                newUser.password = createHash(req_data.password);
                newUser.email = req_data.email;
                newUser.signup_secret = newUser._id;
                //save the user
                newUser.save(function(err) {
                    if (err) {
                        console.log('Error in Saving user: ' + err);
                        res.status(500).send({ message: 'something went wrong', status: '500' });
                        throw err;
                    }
                    var url = config.constants.server_url + 'api/activate_user/' + newUser.signup_secret;
                    var heder = config.mailConstants.signup_header;
                    var body = config.mailConstants.signup_body.replace('[USER_NAME]', newUser.username);
                    body = body.replace('[ACTIVATE_URL]', url);
                    Mailer.sendMail(newUser.email, heder, body);
                    res.status(200).send({data:{ message: 'Please verify your email', status: '200' }});
                });
            }
        });
    });
    //log out
    router.get('/signout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    var isValidPassword = function(user, password) {
        return bCrypt.compareSync(password, user.password);
    };

    // Generates hash using bCrypt
    var createHash = function(password) {
        return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
    };

    return router;

}
