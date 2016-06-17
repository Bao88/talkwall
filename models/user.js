var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = Schema({

    local:
    {
        apikey:     String,
        email:      String,
        name:       String,
        createdAt:  { type: Date, default: Date.now },
        lastLogin:  { type: Date }
    },
    facebook:
    {
        id:         String,
        token:      String,
        email:      String,
        name:       String,
        createdAt:  { type: Date, default: Date.now },
        lastLogin:  { type: Date }
    },
    google:
    {
        id:         String,
        token:      String,
        email:      String,
        name:       String,
        createdAt:  { type: Date, default: Date.now },
        lastLogin:  { type: Date }
    },
    nickname:       { type: String, default: 'teacher' },
    defaultEmail:   { type: String, unique: false },
    lastOpenedWall: { type: Schema.Types.ObjectId, ref: 'Wall', default: null},
    helpViewed:     { type: Boolean, default: false }
});

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);