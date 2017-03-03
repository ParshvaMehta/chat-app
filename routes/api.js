var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Post = mongoose.model('Post');
var Mailer = require('../mailer.js');
var User = mongoose.model('User');

//Used for routes that must be authenticated.
function isAuthenticated(req, res, next) {
    // if user is authenticated in the session, call the next() to call the next request handler 
    // Passport adds this method to request object. A middleware is allowed to add properties to
    // request and response objects

    //allow all get request methods
    // if (req.method === "GET") {
    //     return next();
    // }
    if (req.isAuthenticated()) {
        return next();
    }
    // if the user is not authenticated then redirect him to the login page
    return res.status(401).send({ status: '401', message: "Unauthorised user!!"});
};

router.get('/activate_user/:id', function(req, res) {
    var conditions = { _id: req.params.id },
        update = { status: 1, signup_secret: '' },
        options = {};

    User.update(conditions, update, options, function callback(err, users) {
        if (err) {
            return res.status(500).send(err);
        }
        return res.status(200).send({ message: 'User has been activated' });
    });
});
//Register the authentication middleware
router.use('/user', isAuthenticated);
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
    User.find(function(err, users) {
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

module.exports = router;
