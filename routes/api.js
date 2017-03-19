var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Post = mongoose.model('Post');
var Mailer = require('../mailer.js');
var User = mongoose.model('User');
var VideoPlayList = mongoose.model('VideoPlayList');
var config = require('../config.js');
var request = require('request');
var JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;
var jwt = require('jsonwebtoken');

//Used for routes that must be authenticated.
function isAuthenticated(req, res, next) {
    jwtOptions.secretOrKey = 'superdupersecret';
    // if user is authenticated in the session, call the next() to call the next request handler 
    // Passport adds this method to request object. A middleware is allowed to add properties to
    // request and response objects
    if (req.headers.authorization) {
        passport.authenticate('jwt', { session: false }, function(err, user, info) {
            if (err) return res.fail(err)
            if (!user) return res.fail(new errors.UserNotFoundError())
            req.user = user
            next()
        })
    }
    return res.status(200).send({ status: '200', data: jwtOptions });
    //allow all get request methods
    // if (req.method === "GET") {
    //     return next();
    // }
    // if (req.isAuthenticated()) {
    //     return next();
    // }
    // if the user is not authenticated then redirect him to the login page
    return res.status(401).send({ status: '401', message: "Unauthorised user!!" });
};

router.get('/user/activate_user/:id', function(req, res) {
    var conditions = { _id: req.params.id },
        update = { status: 1, signup_secret: '' },
        options = {};

    User.update(conditions, update, options, function callback(err, users) {
        if (err) {
            return res.status(500).send(err);
        }
        return res.status(200).send({ data: { message: 'User has been activated', 'status': 200 } });
    });
});
//Register the authentication middleware
//router.use('/youtube', isAuthenticated);
router.route('/user')
    // //creates a new post
    // .post(function(req, res) {

//     var post = new Post();
//     post.text = req.body.text;
//     post.created_by = req.body.created_by;
//     post.save(function(err, post) {
//         if (err) {
//             return res.send(500, err);
//         }
//         return res.json(post);
//     });
// })
//gets all user
.get(function(req, res) {
    var query = User.find({}).select({ 'password': 0, 'signup_secret': 0, 'created_at': 0, '__v': 0 });

    query.exec(function(err, users) {
        if (err) {
            return res.status(500).send(err);
        }
        return res.status(200).send({ 'message': 'User found successfully', 'data': users, 'status': '200' });
    });
});

//post-specific commands. likely won't be used
router.route('/user/:id')
    //gets specified post
    .get(function(req, res) {
        User.findById(req.params.id, function(err, post) {
            if (err)
                res.send(err);
            res.json(post);
        });
    })
    //updates specified post
    .put(function(req, res) {
        Post.findById(req.params.id, function(err, post) {
            if (err)
                res.send(err);

            post.created_by = req.body.created_by;
            post.text = req.body.text;

            post.save(function(err, post) {
                if (err)
                    res.send(err);

                res.json(post);
            });
        });
    })
    //deletes the post
    .delete(function(req, res) {
        Post.remove({
            _id: req.params.id
        }, function(err) {
            if (err)
                res.send(err);
            res.json("deleted :(");
        });
    });

router.route('/userplaylist/:user_id')
    .get(function(req, res) {
        var user_id = req.params.user_id
        VideoPlayList.find({ user_id: user_id }, function(err, videos) {
            if (err)
                return res.status(200).json({ data: { message: "Something went wrong! please contact admin", status: 500 } });
            return res.status(200).json({ data: { message: "Playlist found", data: videos, status: 200 } });
        })
    })

router.route('/userplaylist')
    .post(function(req, res) {
        var url = req.body.url,
            user_id = req.body.user_id,
            id,
            validUrl = false;

        if (url.indexOf(config.constants.youtube_https_url_snippet) != -1) {
            id = url.replace(config.constants.youtube_https_url_snippet, '');
            validUrl = true;
        }
        if (url.indexOf(config.constants.youtube_http_url_snippet) != -1) {
            id = url.replace(config.constants.youtube_http_url_snippet, '');
            validUrl = true;
        }
        if (url.indexOf(config.constants.youtube_shorten_https_url_snippet) != -1) {
            id = url.replace(config.constants.youtube_shorten_https_url_snippet, '');
            validUrl = true;
        }
        if (url.indexOf(config.constants.youtube_shorten_http_url_snippet) != -1) {
            id = url.replace(config.constants.youtube_shorten_http_url_snippet, '');
            validUrl = true;
        }
        if (validUrl) {
            VideoPlayList.find({
                youtube_video_id: id,
                user_id: user_id
            }, function(err, video) {

                if (err)
                    return res.status(200).json({ data: { message: "Something went wrong! please contact admin", status: 500 } });
                console.log(video);
                if (video.length > 0) {
                    return res.status(200).json({ data: { message: "Video already exist in your playlist", data: video, status: 200 } });
                }
                if (video.length <= 0) {
                    var uri = "https://www.googleapis.com/youtube/v3/videos?id=" + id + "&key=" + config.constants.youtube_key + "&part=snippet,contentDetails,statistics,status,player,contentDetails&fields=items(id,snippet,statistics,status,player,contentDetails)";
                    request({
                        uri: uri,
                        method: "GET",
                        timeout: 10000,
                        followRedirect: true,
                        maxRedirects: 10
                    }, function(error, response, body) {
                        var videoData = JSON.parse(body).items[0];
                        var playlist = new VideoPlayList();
                        playlist.user_id = user_id;
                        playlist.youtube_video_id = videoData.id;
                        playlist.title = videoData.snippet.title;
                        playlist.thumbnail = videoData.snippet.thumbnails.high.url;
                        playlist.duration = videoData.contentDetails.duration;
                        playlist.embedHtml = videoData.player.embedHtml;
                        playlist.url = url;
                        playlist.save(function(err) {
                                if (err) {
                                    console.log('Error in Saving playlist: ' + err);
                                    res.status(200).send({ message: 'something went wrong', status: '500' });
                                    throw err;
                                }
                                res.status(200).send({ message: 'Video Added to your playlist', status: '200' });

                            })
                            // res.status(200).send({ "playlist": playlist, "data": videoData });

                    });
                }
            });

        } else {
            res.status(200).send({ 'message': 'Invalid url', 'status': '200' });
        }
    })
module.exports = router;
