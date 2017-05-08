var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var session = require('express-session');
var cors = require('cors')
var jwt = require('jsonwebtoken');
var passportJWT = require("passport-jwt");
var ExtractJwt = passportJWT.ExtractJwt;
var JwtStrategy = passportJWT.Strategy;
 //initialize mongoose schemas
require('./models/models');
var initPassport = require('./passport-init');
var Server = require('socket.io');
var api = require('./routes/api');
var authenticate = require('./routes/authenticate')(passport);

//// Initialize Passport

var app = express();

var mongoose = require('mongoose'); //add for Mongo support
mongoose.connect('mongodb://localhost:27017/video-playlist'); //connect to Mongo

// var mongoose = require('mongoose'); //add for Mongo support
// mongoose.connect('mongodb://parshva:parshva@ds161059.mlab.com:61059/heroku_29bk315v'); //connect to Mongo

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(cors());

app.use(express.static(path.join(__dirname, 'public')));
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
    secret: 'Super duper secret',
    resave: false,
    saveUninitialized: true
}));
//app.use(express.cookieSession()); // Express cookie session middleware 
app.use(passport.initialize());
//app.use(passport.session());
initPassport(passport);


app.use('/api', api);
app.use('/auth', authenticate);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

 

module.exports = app;
