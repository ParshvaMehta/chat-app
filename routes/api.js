var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Post = mongoose.model('Post');
var Mailer = require('../mailer.js');
var User = mongoose.model('User');
var VideoPlayList = mongoose.model('VideoPlayList');
var WaitList = mongoose.model('WaitList');
var Userplaylist = mongoose.model('Userplaylist');
var groupChat = mongoose.model('groupChat');
var config = require('../config.js');
var request = require('request');
var JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;
var jwt = require('jsonwebtoken');
var moment = require('moment');

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
/* User Play list api*/
router.route('/userplaylist/:user_id')
    .get(function(req, res) {
        var user_id = req.params.user_id
        VideoPlayList.find({ user_id: user_id }, function(err, videos) {
            if (err)
                return res.status(200).json({ data: { message: "Something went wrong! please contact admin", status: 500 } });
            return res.status(200).json({ message: "Playlist found", data: videos, status: 200 });
        })
    })

router.route('/userplaylist')
    .post(function(req, res) {
        var url = req.body.url,
            user_id = req.body.user_id,
            userplaylist_id = req.body.userplaylist_id,
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
                user_id: user_id,
                userplaylist_id: userplaylist_id
            }, function(err, video) {
                if (err)
                    return res.status(200).json({ data: { message: "Something went wrong! please contact admin", status: 500 } });
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
                        var duration = moment.duration(videoData.contentDetails.duration).asSeconds();
                        var playlist = new VideoPlayList();
                        playlist.user_id = user_id;
                        playlist.youtube_video_id = videoData.id;
                        playlist.title = videoData.snippet.title;
                        playlist.thumbnail = videoData.snippet.thumbnails.high.url;
                        playlist.duration = duration;
                        playlist.embedHtml = videoData.player.embedHtml;
                        playlist.url = url;
                        playlist.userplaylist_id = userplaylist_id;
                        Userplaylist.findById(userplaylist_id, function(err, userplaylists) {
                            if (err) {
                                console.log('Error in Saving playlist: ' + err);
                                res.status(200).send({ message: 'something went wrong', status: '500' });
                            }
                            if (userplaylists) {
                                var playlist = new VideoPlayList();
                                playlist.user_id = user_id;
                                playlist.youtube_video_id = videoData.id;
                                playlist.title = videoData.snippet.title;
                                playlist.thumbnail = videoData.snippet.thumbnails.high.url;
                                playlist.duration = duration;
                                playlist.embedHtml = videoData.player.embedHtml;
                                playlist.url = url;
                                playlist.userplaylist_id = userplaylist_id;
                                playlist.order = userplaylists.total_video + 1;
                                playlist.save(function(err) {
                                    if (err) {
                                        console.log('Error in Saving playlist: ' + err);
                                        res.status(200).send({ message: 'something went wrong', status: '500' });
                                    }
                                    Userplaylist.update({ _id: userplaylist_id }, { $inc: { total_video: 1 } }, function(err, u) {
                                        if (err) {
                                            console.log('Error in Saving playlist: ' + err);
                                            res.status(200).send({ message: 'something went wrong', status: '500' });
                                        }
                                        res.status(200).send({ message: 'Video Added to your playlist', status: '200' });
                                    });
                                });
                            } else {
                                return res.status(200).json({ data: { message: "User playlist not found", data: video, status: 200 } });

                            }

                        });
                        // res.status(200).send({ "data": videoData, "duration":duration });


                    });
                }
            });

        } else {
            res.status(200).send({ 'message': 'Invalid url', 'status': '200' });
        }
    })

/* wait list api*/
router.route('/waitlist')
    .get(function(req, res) {
        WaitList.find({ status: 0 }).populate('videoplaylists_id').sort([
            ['created_at', 1]
        ]).limit(50).exec(function(err, waitlist) {
            if (err)
                return res.status(200).json({ data: { message: "Something went wrong! please contact admin", status: 500 } });
            return res.status(200).json({ data: { message: "Waitlist Found", data: waitlist, status: 200 } });
        });
    })
    .post(function(req, res) {
        // var video_id = req.body.video_id,
        var user_id = new mongoose.mongo.ObjectId(req.body.user_id);
        Userplaylist.find({ $and: [{ user_id: user_id }, { isactive: true }] }, function(err, userplaylist) {
            if (err)
                return res.status(200).json({ data: { message: "Something went wrong! please contact admin", status: 500 } });
            if (!userplaylist || userplaylist.length <= 0) {
                return res.status(200).json({ message: "No Active playlist found", status: 200 });
            }
            var userplaylist_id = userplaylist[0]._id;
            VideoPlayList.find({ userplaylist_id: userplaylist_id, order: 1 }, function(err, videos) {
                if (err)
                    return res.status(200).json({ data: { message: "Something went wrong! please contact admin", status: 500 } });
                if (!videos || videos.length <= 0) {
                    return res.status(200).json({ message: "No video found in active playlist", status: 200 });
                }
                console.log(videos[0]._id);
                var videoplaylists_id = videos[0].id;
                WaitList.find({ videoplaylists_id: videoplaylists_id, status: 0 }, function(err, waitlist) {
                    if (err)
                        return res.status(200).json({ data: { message: "Something went wrong! please contact admin", status: 500 } });
                    if (waitlist && waitlist.length > 0) {
                        return res.status(200).json({ message: "You are already in waitlist!", status: 200 });
                    }
                    var waitList = new WaitList();
                    waitList.videoplaylists_id = videoplaylists_id;
                    waitList.save(function(err) {
                        if (err)
                            return res.status(200).json({ data: { message: "Something went wrong! please contact admin", status: 500 } });
                        return res.status(200).json({ message: "Your video added in queue", status: 200 });
                    });
                });
                //return res.status(200).json({ message: "Your video added in queue", status: 200, data: videos });
            });
        });
        // VideoPlayList.findById(videoplaylists_id, function(err, videos) {
        //     if (err)
        //         return res.status(200).json({ data: { message: "Something went wrong! please contact admin", status: 500 } });
        //     if (!videos || videos.length <= 0) {
        //         return res.status(200).json({ message: "Video not found", status: 200 });
        //     }
        //     WaitList.find({ videoplaylists_id: videoplaylists_id, status: 0 }, function(err, waitlist) {
        //         if (err)
        //             return res.status(200).json({ data: { message: "Something went wrong! please contact admin", status: 500 } });
        //         if (waitlist && waitlist.length > 0) {
        //             return res.status(200).json({ message: "This Video is already in Queue!", status: 200 });
        //         }
        //         var waitList = new WaitList();
        //         waitList.videoplaylists_id = videoplaylists_id;
        //         waitList.save(function(err) {
        //             if (err)
        //                 return res.status(200).json({ data: { message: "Something went wrong! please contact admin", status: 500 } });
        //             return res.status(200).json({ message: "Your video added in queue", status: 200 });
        //         });
        //     });
        // })
    })
router.get('/waitlist/current', function(req, res) {
    WaitList.findOne({ status: 0 }).populate('videoplaylists_id').sort([
        ['created_at', 1]
    ]).exec(function(err, current) {
        if (err)
            return res.status(200).json({ data: { message: "Something went wrong! please contact admin", status: 500 } });
        if (current) {
            if (!current.started) {
                WaitList.findByIdAndUpdate(current._id, { started: new Date() }, function(err, currentVideo) {
                    if (err)
                        return res.status(200).json({ data: { message: "Something went wrong! please contact admin", err: err, status: 500 } });
                    return res.status(200).json({ data: { message: "Current Video", data: current, start_time: 0, status: 200 } });
                });
            } else {
                var timeDiff = moment().diff(moment(current.started, 'seconds')) / 1000;
                if (timeDiff > current.videoplaylists_id.duration) {
                    var current_id = current._id;
                    WaitList.findByIdAndUpdate(current_id, { status: 1 }, function(err, currentVideo) {
                            if (err)
                                return res.status(200).json({ data: { message: "Something went wrong! please contact admin", status: 500 } });
                            WaitList.findOne({ status: 0 }).populate('videoplaylists_id').sort([
                                ['created_at', 1]
                            ]).exec(function(err, current) {
                                if (err)
                                    return res.status(200).json({ data: { message: "Something went wrong! please contact admin", status: 500 } });
                                return res.status(200).json({ data: { message: "Current Video", start_time: 0, data: current, status: 200 } });
                            });
                        })
                        // return res.status(200).json({ data: { message: "Current Video", data: [], status: 200 } });
                } else {
                    return res.status(200).json({ data: { message: "Current Video", data: current, start_time: timeDiff, status: 200 } });
                }
            }
        } else {
            return res.status(200).json({ data: { message: "No waitlist video found", data: [], status: 200 } });
        }
    })
})
router.get('/waitlist/next/:id', function(req, res) {
    var current_id = req.params.id;
    WaitList.findByIdAndUpdate(current_id, { status: 1 }, function(err, currentVideo) {
        if (err)
            return res.status(200).json({ data: { message: "Something went wrong! please contact admin", status: 500 } });
        WaitList.findOne({ status: 0 }).populate('videoplaylists_id').sort([
            ['created_at', 1]
        ]).exec(function(err, current) {
            if (err)
                return res.status(200).json({ data: { message: "Something went wrong! please contact admin", status: 500 } });
            if (current) {
                if (!current.started) {
                    WaitList.findByIdAndUpdate(current._id, { started: new Date() }, function(err, currentVideo) {
                        if (err)
                            return res.status(200).json({ data: { message: "Something went wrong! please contact admin", err: err, status: 500 } });
                        return res.status(200).json({ data: { message: "Current Video", data: current, start_time: 0, status: 200 } });
                    });
                } else {
                    var timeDiff = moment().diff(moment(current.started, 'seconds')) / 1000;
                    if (timeDiff > current.videoplaylists_id.duration) {
                        var current_id = current._id;
                        WaitList.findByIdAndUpdate(current_id, { status: 1 }, function(err, currentVideo) {
                                if (err)
                                    return res.status(200).json({ data: { message: "Something went wrong! please contact admin", status: 500 } });
                                WaitList.findOne({ status: 0 }).populate('videoplaylists_id').sort([
                                    ['created_at', 1]
                                ]).exec(function(err, current) {
                                    if (err)
                                        return res.status(200).json({ data: { message: "Something went wrong! please contact admin", status: 500 } });
                                    return res.status(200).json({ data: { message: "Current Video", start_time: 0, data: current, status: 200 } });
                                });
                            })
                            // return res.status(200).json({ data: { message: "Current Video", data: [], status: 200 } });
                    } else {
                        return res.status(200).json({ data: { message: "Current Video", data: current, start_time: timeDiff, status: 200 } });
                    }
                }
            } else {
                return res.status(200).json({ data: { message: "No waitlist video found", data: [], start_time: 0, status: 200 } });
            }
            //return res.status(200).json({ data: { message: "Current Video", data: current, status: 200 } });
        });
    })
})
router.post('/video_remove_from_waitlist', function(req, res) {
    var user_id = req.body.user_id,
        video_id = req.body.video_id,
        waitlist_id = req.body.waitlist_id,
        user = {};
    User.findById(user_id, function(err, user) {
        if (err)
            return res.status(200).json({ data: { message: "Something went wrong! please contact admin", status: 500 } });
        var user_role = user.user_role,
            canDelete = false;
        if (user_role == 1 || user_role == 2) {
            WaitList.remove({ "_id": waitlist_id }, function(err) {
                if (err)
                    return res.status(200).json({ data: { message: "Something went wrong! please contact admin", status: 500 } });
                return res.status(200).json({ data: { message: "Video has been reomoved from queue", status: 200 } });
            });
        }
        VideoPlayList.findById(video_id, function(err, video) {
            if (err)
                return res.status(200).json({ data: { message: "Something went wrong! please contact admin", status: 500 } });

            if (!video)
                return res.status(200).json({ data: { message: "No video found", data: video, status: 200 } });

            if (video.user_id == user_id) {
                WaitList.remove({ "_id": waitlist_id }, function(err) {
                    if (err)
                        return res.status(200).json({ data: { message: "Something went wrong! please contact admin", status: 500 } });
                    return res.status(200).json({ data: { message: "Video has been reomoved from queue", status: 200 } });
                });
            } else {
                return res.status(200).json({ data: { message: "You no permission to delete", status: 200 } });
            }

        });

    });
})
router.get('/waitlist/history', function(req, res) {
    var query = WaitList.find({ status: 1 }).populate('videoplaylists_id').sort({ created_at: -1 }).skip(0).limit(50)
    query.exec(function(err, currentVideo) {
        if (err)
            return res.status(200).json({ data: { message: "Something went wrong! please contact admin", status: 500 } });

        return res.status(200).json({ data: { message: "Videos history found", data: currentVideo, status: 200 } });
    });
})
router.route('/uservideoplaylist')
    .post(function(req, res) {
        var user_id = req.body.user_id,
            name = req.body.name,
            userplaylist = new Userplaylist();

        userplaylist.user_id = user_id;
        userplaylist.name = name;
        console.info(userplaylist);
        userplaylist.save(function(err) {
            if (err) {
                console.log('Error in Saving userplaylist: ' + err);
                res.status(200).send({ message: 'something went wrong', status: '500' });
                throw err;
            }
            res.status(200).send({ message: 'Playlist create successfully', status: '200' });
        })
    });
router.get('/uservideoplaylist/:user_id', function(req, res) {
    var user_id = req.params.user_id;
    Userplaylist.find({ user_id: user_id }).populate('videoplaylists_id').sort([
        ['created_at', 1]
    ]).exec(function(err, userplaylist) {
        if (err)
            return res.status(200).json({ data: { message: "Something went wrong! please contact admin", status: 500 } });
        return res.status(200).json({ data: { message: "userplaylist found", data: userplaylist, status: 200 } });
    });
});
router.get('/uservideoplaylist/active/:user_id/:user_playlist_id', function(req, res) {
    var user_id = req.params.user_id,
        user_playlist_id = req.params.user_playlist_id;
    console.info(user_playlist_id);
    Userplaylist.update({ user_id: user_id }, { isactive: false }, { multi: true }, function(err, update) {
        if (err)
            return res.status(200).json({ data: { message: "Something went wrong! please contact admin", status: 500 } });
        Userplaylist.findByIdAndUpdate(user_playlist_id, { $set: { isactive: true } }, function(err, update) {
            if (err)
                return res.status(200).json({ data: { message: "Something went wrong! please contact admin", status: 500 } });
            return res.status(200).json({ data: { message: "Playlist Activated", status: 200 } });
        });
    });

});
router.get('/video/:user_playlist_id', function(req, res) {
    var userplaylist_id = req.params.user_playlist_id;
    VideoPlayList.find({ userplaylist_id: userplaylist_id }).sort([
        ['order', 1]
    ]).exec(function(err, videos) {
        if (err)
            return res.status(200).json({ data: { message: "Something went wrong! please contact admin", status: 500 } });
        return res.status(200).json({ message: "Playlist found", data: videos, status: 200 });
    })
});
//router.post('/video/reoder/:userplaylist_id/:videoplaylists_id/:old_order_id/:new_order_id', function(req, res) {
router.post('/video/reorder', function(req, res) {
    var videoplaylists_id = req.body.videoplaylists_id,
        old_order_id = req.body.old_order_id,
        new_order_id = req.body.new_order_id,
        userplaylist_id = req.body.userplaylist_id;
    if (old_order_id > new_order_id) {

        VideoPlayList.update({ order: { $gte: new_order_id, $lt: old_order_id }, userplaylist_id: userplaylist_id }, { $inc: { order: 1 } }, { multi: true }, function(err) {
            if (err)
                return res.status(200).json({ data: { message: "Something went wrong! please contact admin", status: 500 } });
            VideoPlayList.update({ _id: videoplaylists_id }, { order: new_order_id }, function(err, videos) {
                if (err)
                    return res.status(200).json({ data: { message: "Something went wrong! please contact admin", status: 500 } });
                return res.status(200).json({ message: "Order  Updated", status: 200 });
            });
        })
    } else if (old_order_id < new_order_id) {
        VideoPlayList.update({ order: { $lte: new_order_id, $gt: old_order_id }, userplaylist_id: userplaylist_id }, { $inc: { order: -1 } }, { multi: true }, function(err) {
            if (err)
                return res.status(200).json({ data: { message: "Something went wrong! please contact admin", status: 500 } });
            VideoPlayList.update({ _id: videoplaylists_id }, { order: new_order_id }, function(err, videos) {
                if (err)
                    return res.status(200).json({ data: { message: "Something went wrong! please contact admin", status: 500 } });
                return res.status(200).json({ message: "Order  Updated", status: 200 });
            });
        })
    } else {
        return res.status(200).json({ data: { message: "Something went wrong! please contact admin", status: 500 } });
    }
});

router.get('/get_waitlist_status/:user_id', function(req, res) {
    var user_id = req.params.user_id;
    WaitList.find({ status: 0 }).populate('videoplaylists_id', null, { user_id: user_id }).exec(function(err, waitlist) {
        if (err)
            return res.status(200).json({ data: { message: "Something went wrong! please contact admin", err: err, status: 500 } });
        var userAlreadyInPlaylist = false;
        for (var i = 0; i < waitlist.length; i++) {
            if (waitlist[i].videoplaylists_id != null) {
                if (waitlist[i].videoplaylists_id.user_id == user_id) {
                    userAlreadyInPlaylist = true;
                    break;
                }
            }
        }
        return res.status(200).json({ data: { message: "waitlist data found", data: { already_in_waitlist: userAlreadyInPlaylist }, status: 200 } });
    });

    // Userplaylist.find({ user_id: user_id, isactive: true }).exec(function(err, userplaylist) {
    //     if (err)
    //         return res.status(200).json({ data: { message: "Something went wrong! please contact admin", status: 500 } });
    //     if (userplaylist[0]) {
    //         if (userplaylist[0]._id) {
    //            var userplaylist_id = userplaylist[0]._id;

    //         } else {
    //             return res.status(200).json({ data: { message: "Something went wrong! please contact admin", status: 500 } });
    //         }
    //     }
    //     return res.status(200).json({ data: { message: "msg found", data: userplaylist[0]._id, status: 200 } });
    // });
});
router.get('/removevideofromplaylistbyuserid/:user_id', function(req, res) {
    var user_id = req.params.user_id;
    WaitList.find({ status: 0 }).populate('videoplaylists_id', null, { user_id: user_id }).exec(function(err, waitlist) {
        if (err)
            return res.status(200).json({ data: { message: "Something went wrong! please contact admin", err: err, status: 500 } });
        var waitlistByUser = false;
        for (var i = 0; i < waitlist.length; i++) {
            if (waitlist[i].videoplaylists_id != null) {
                if (waitlist[i].videoplaylists_id.user_id == user_id) {
                    //console.log(waitlist[i]);
                    waitlistByUser = waitlist[i];
                    break;
                }
            }
        }
        var conditions = { _id: waitlistByUser._id },
            update = { status: 1 },
            options = {};

        WaitList.update(conditions, update, options, function callback(err, users) {
            if (err) {
                return res.status(500).send(err);
            }
            return res.status(200).send({ data: { message: 'Waitlist leave successfully', 'status': 200 } });
        });
        // return res.status(200).json({ data: { message: "waitlist data found", data: { already_in_waitlist: userAlreadyInPlaylist }, status: 200 } });
    });
});

router.post('/groupchat/new_msg', function(req, res) {
    var user_id = req.body.user_id,
        msg = req.body.msg;
    var groupchat = new groupChat();
    groupchat.user_id = user_id;
    groupchat.msg = msg
    groupchat.save(function(err) {
        if (err)
            return res.status(200).json({ data: { message: "Something went wrong! please contact admin", status: 500 } });
        return res.status(200).json({ message: "Msg Saved", status: 200 });
    });

});
router.get('/groupchat/:page', function(req, res) {
    var page = req.params.page;
    groupChat.find({}).populate('user_id').sort([
        ['created_at', 1]
    ]).exec(function(err, msg) {
        if (err)
            return res.status(200).json({ data: { message: "Something went wrong! please contact admin", status: 500 } });
        return res.status(200).json({ data: { message: "msg found", data: msg, status: 200 } });
    });
});

router.get('/groupchat/delete/:id', function(req, res) {
    var id = req.params.id;
    groupChat.remove({
        _id: req.params.id
    }, function(err) {
        if (err)
            return res.status(200).json({ data: { message: "Something went wrong! please contact admin", status: 500 } });
        return res.status(200).json({ data: { message: "msg deletd", status: 200 } });
    });
});




module.exports = router;
