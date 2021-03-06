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
    user_role: { type: Number, default: 0 },
    status: { type: Number, default: 0 },
    avtar: { type: String, default: "default-user.png" }
})

var videoPlaylistSchema = new mongoose.Schema({
    youtube_video_id: String,
    title: String,
    thumbnail: String,
    duration: String,
    embedHtml: String,
    user_id: { type: Schema.Types.ObjectId, ref: 'User' },
    created_at: { type: Date, default: Date.now },
    upvote: { type: String, default: '' },
    downvote: { type: String, default: '' },
    url: String,
    status: { type: Number, default: 0 },
    userplaylist_id: { type: Schema.Types.ObjectId, ref: 'Userplaylist' },
    order: { type: Number, default: 0 }
})

var userPlaylistSchema = new mongoose.Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'User' },
    name: String,
    isactive: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
    total_video: { type: Number, default: 0 }
});

var waitListSchema = new mongoose.Schema({
    videoplaylists_id: { type: Schema.Types.ObjectId, ref: 'VideoPlayList' },
    created_at: { type: Date, default: Date.now },
    status: { type: Number, default: 0 },
    upvote: { type: String, default: '' },
    downvote: { type: String, default: '' },
    grab: { type: String, default: '' },
    started: { type: Date },
    user_id: { type: Schema.Types.ObjectId, ref: 'User' }
});

var groupChatSchema = new mongoose.Schema({
    msg: String,
    user_id: { type: Schema.Types.ObjectId, ref: 'User' },
    created_at: { type: Date, default: Date.now },
    status: { type: Number, default: 0 }
});

var configurationSchema = new mongoose.Schema({
    lock_queue:{ type: Boolean, default: false },
    toggle_cycle:{ type: Boolean, default: false},
    discord_url:String,
    youtube_url:String,
    facebook_url:String,
    soundcloud_url:String,
    room_info_text:String,
    is_defalut:{ type: Boolean, default: true}
});

var onlineUserSchema = new mongoose.Schema({
    user_id:{ type: Schema.Types.ObjectId, ref: 'User' },
    username : String,
    user_role :{ type: Number, default: 0 },
    socket_id : String,
    avtar:String
});

mongoose.model('Post', postSchema);
mongoose.model('User', userSchema);
mongoose.model('Userplaylist', userPlaylistSchema);
mongoose.model('VideoPlayList', videoPlaylistSchema);
mongoose.model('WaitList', waitListSchema);
mongoose.model('groupChat', groupChatSchema);
mongoose.model('Configuration', configurationSchema);
mongoose.model('OnlineUser',onlineUserSchema);