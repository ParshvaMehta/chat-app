var mongoose = require('mongoose');
var User = mongoose.model('User');
var LocalStrategy = require('passport-local').Strategy;
var bCrypt = require('bcrypt-nodejs');
var Mailer = require('./mailer.js');
var config = require('./config.js');
var JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;
var opts = {}
opts.jwtFromRequest = ExtractJwt.fromAuthHeader();
opts.secretOrKey = 'superdupersecret';
module.exports = function(passport) {

    // Passport needs to be able to serialize and deserialize users to support persistent login sessions
    /*passport.serializeUser(function(user, done) {
        console.log('serializing user:', user.username);
        done(null, user._id);
    });
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            console.log('deserializing user:', user.username);
            done(err, user);
        });
    });*/

    passport.use('jwt', new JwtStrategy(opts, function(jwt_payload, done) {
        console.log('payload received', jwt_payload);
        console.log(jwt_payload.id);
        // check in mongo if a user with username exists or not
        User.findById(jwt_payload.id, function(err, user) {
            console.log(user);
            // In case of any error, return using the done method
            if (err)
                return done(err, false);
            // Username does not exist, log the error and redirect back
            if (user) {
                console.log(user);
                done(null, user);
            } else {
                done(null, false);
                // or you could create a new account
            }
        });
    }));
    // passport.use('login', new LocalStrategy({
    //         passReqToCallback: true
    //     },
    //     function(req, username, password, done) {
    //         // check in mongo if a user with username exists or not
    //         User.findOne({ '$or': [{ 'username': username }, { 'email': username }], 'status': { '$ne': 0 } },
    //             function(err, user) {
    //                 // In case of any error, return using the done method
    //                 if (err)
    //                     return done(err);
    //                 // Username does not exist, log the error and redirect back
    //                 if (!user) {
    //                     console.log('User Not Found with username ' + username);
    //                     return done(null, false);
    //                 }
    //                 // User exists but wrong password, log the error 
    //                 if (!isValidPassword(user, password)) {
    //                     console.log('Invalid Password');
    //                     return done(null, false); // redirect back to login page
    //                 }
    //                 // User and password both match, return user from done method
    //                 // which will be treated like success
    //                 return done(null, user);
    //             }
    //         );
    //     }
    // ));

    /*passport.use('signup', new LocalStrategy({
            passReqToCallback: true // allows us to pass back the entire request to the callback
        },
        function(req, username, password, done) {

            var req_data = req.body;
            // find a user in mongo with provided username
            User.findOne({ '$or': [{ 'username': username }, { 'email': username }] }, function(err, user) {
                // In case of any error, return using the done method
                if (err) {
                    console.log('Error in SignUp: ' + err);
                    return done(err);
                }
                // already exists
                if (user) {
                    console.log('User already exists with username: ' + username);
                    return done(null, false);
                } else {
                    // if there is no user, create the user
                    var newUser = new User();

                    // set the user's local credentials
                    newUser.username = username;
                    newUser.password = createHash(password);
                    newUser.email = req.body.email;
                    newUser.signup_secret = newUser._id;
                    //save the user
                    newUser.save(function(err) {
                        if (err) {
                            console.log('Error in Saving user: ' + err);
                            throw err;
                        }
                        var url = config.constants.server_url + 'api/activate_user/' + newUser.signup_secret;
                        var heder = config.mailConstants.signup_header;
                        var body = config.mailConstants.signup_body.replace('[USER_NAME]', newUser.username);
                        body = body.replace('[ACTIVATE_URL]', url);
                        Mailer.sendMail(newUser.email, heder, body);
                        return done(null, newUser);
                    });
                }
            });
        }));*/

    var isValidPassword = function(user, password) {
        return bCrypt.compareSync(password, user.password);
    };

    // Generates hash using bCrypt
    var createHash = function(password) {
        return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
    };

};
