var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var User = mongoose.model('User');
var OnlineUser = mongoose.model('OnlineUser');
var bCrypt = require('bcrypt-nodejs');
var Mailer = require('../mailer.js');
var config = require('../config.js');
var jwt = require('jsonwebtoken');
var opts = {
    secretOrKey: 'superdupersecret'
};
var socket_io = require('socket.io');
var io = socket_io();
var socketApi = require("../socketApi.js");
var JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;


module.exports = function(passport) {

    //sends successful login state back to angular
    router.get('/success_signup', function(req, res) {
        res.status(200).send({ data: { message: 'Mail has been sent to your email please verify', status: '200' } });
    });

    //sends failure login state back to angular
    router.get('/failure_signup', function(req, res) {
        res.status(200).send({ data: { status: '401', message: "User already exists" } });
    });

    //sends successful login state back to angular
    router.get('/success_login', function(req, res) {
        res.status(200).send({ data: { message: 'success', status: '200', data: req.user ? req.user : {} } });
    });

    //sends failure login state back to angular
    router.get('/failure_login', function(req, res) {
        res.status(200).send({ data: { status: '401', message: "Invalid username or password Or user is not activated" } });
    });
    router.get("/secret", passport.authenticate('jwt', { session: false }), function(req, res) {
        res.json({ message: "Success! You can not see this without a token" });
    });
    //log in
    // router.post('/login', passport.authenticate('login', {
    //     successRedirect: '/auth/success_login',
    //     failureRedirect: '/auth/failure_login'
    // }));
    router.post('/login', function(req, res) {
        if (req.body.name && req.body.password) {
            var name = req.body.name;
            var password = req.body.password;
        }
        User.findOne({ '$or': [{ 'username': name }, { 'email': name }], 'status': { '$ne': 0 } }, function(err, user) {
            // In case of any error, return using the done method
            if (err)
                return res.status(200).json({ data: { message: "Something went wrong! please contact admin", status: 500 } });
            // Username does not exist, log the error and redirect back
            if (!user) {
                console.log('User Not Found with username ' + name);
                return res.status(200).json({ data: { message: "No user found or user account is deactivated", status: 401 } });
            }
            // User exists but wrong password, log the error 
            if (!isValidPassword(user, password)) {
                console.log('Invalid Password');
                return res.status(200).json({ data: { message: "Invalid Password", status: 401 } });
            }
            // User and password both match, return user from done method
            // which will be treated like success
            if (user) {
                var payload = { id: user.id };
                var token = jwt.sign(payload, opts.secretOrKey);
                var socketObj = {
                    user_id: user._id,
                    username: user.username,
                    user_role: user.user_role
                }
                // var online_user = new OnlineUser();
                // online_user.user_id = user._id;
                // online_user.username = user.username;
                // online_user.user_role = user.user_role;
                // online_user.save(function(err) {
                    // In case of any error, return using the done method
                    // if (err)
                        // return res.status(200).json({ data: { message: "Something went wrong! please contact admin", status: 500 } });
                    // console.log(socketObj);
                    // socketApi.sendNotificationWithAlert('user_online', socketObj);
                    return res.status(200).json({ data: { message: "User found", status: 200, data: user, token: token } });
                // });
            }
        });
    });

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
                res.status(200).send({ data: { message: 'something went wrong', status: '500' } });
            }
            // already exists
            if (user) {
                console.log('User already exists with username: ' + req_data.name);
                res.status(200).send({ data: { message: 'User already exists', status: '200' } });
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
                        res.status(200).send({ message: 'something went wrong', status: '500' });
                        throw err;
                    }
                    var url = config.constants.server_url + 'login/' + newUser.signup_secret;
                    var heder = config.mailConstants.signup_header;
                    var body = config.mailConstants.signup_body.replace('[USER_NAME]', newUser.username);
                    body = body.replace('[ACTIVATE_URL]', url);
                    Mailer.sendMail(newUser.email, heder, body);
                    res.status(200).send({ data: { message: 'Please verify your email', status: '200' } });
                });
            }
        });
    });

    router.post('/forget_password', function(req, res) {
        var req_data = req.body;
        console.log(req_data);
        // find a user in mongo with provided username
        User.findOne({ '$or': [{ 'username': req_data.name }, { 'email': req_data.email }] }, function(err, user) {
            // In case of any error, return using the done method
            if (err) {
                console.log('Error in SignUp: ' + err);
                res.status(200).send({ data: { message: 'something went wrong', status: '500' } });
            }
            // already exists
            if (user) {
                // if there is no user, create the user
                var new_password = Math.random().toString(36).slice(-8);
                var conditions = { _id: user._id },
                    update = { password: createHash(new_password) };
                User.update(conditions, update, {}, function(err) {
                    if (err) {
                        console.log('Error in forget password update paswor of user: ' + err);
                        res.status(200).send({ message: 'something went wrong', status: '500' });
                        throw err;
                    }
                    var heder = config.mailConstants.forget_password_header;
                    var body = config.mailConstants.forget_password_body.replace('[USER_NAME]', user.username).replace('[USER_NAME]', user.email).replace('[PASSWORD]', new_password);
                    Mailer.sendMail(user.email, heder, body);
                    res.status(200).send({ data: { message: 'Your new password has been sent your mail.', status: 200 } });
                });

                // });
            } else {
                res.status(200).send({ data: { message: 'User not exists', status: '200' } });
            }
        });
    });
    //log out
    router.get('/signout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    var isValidPassword = function(user, password) {
        // console.log(createHash(passport), user.password);
        return bCrypt.compareSync(password, user.password);
    };

    // Generates hash using bCrypt
    var createHash = function(password) {
        return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
    };

    return router;

}