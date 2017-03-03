var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var postSchema = new mongoose.Schema({
    created_by: { type: Schema.ObjectId, ref: 'User' }, //should be changed to ObjectId, ref "User"
    created_at: { type: Date, default: Date.now },
    text: String
});

var userSchema = new mongoose.Schema({
    username: String,
    password: String, //hash created from password
    email: String,
    created_at: { type: Date, default: Date.now },
    signup_secret: String,
    user_role:{ type: Number, default: 0 },
    status: { type: Number, default: 0 }
})


mongoose.model('Post', postSchema);
mongoose.model('User', userSchema);
