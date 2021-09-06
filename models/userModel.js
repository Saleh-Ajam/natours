const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please tell us your name!']
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    photo: {
        type: String,
        default: 'default.jpg'
    },
    role: {
        type: String,
        enum: ['user','guide', 'lead-guide','admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Please provide a paswword'],
        minlength: 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            // This is only works on CREATE or SAVE!!!
            validator: function(el) { // el refer to passwordConfirm
                return el === this.password;
            },
            message: 'Passwords are not the same!'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});

userSchema.pre('save', async function(next) {
    // Only run this function if password was actually modified
    if(!this.isModified('password')) return next();
    // 12 is cost paramater this is a measure that how cpu intensive this operation will be
    // the default value is here 10 but we can use 12 because computers has to become more and more powerfull
    // hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
    // Delete passwordconfirm field
    this.passwordConfirm = undefined;
    next();
});


userSchema.pre('save', function(next) {
    if(!this.isModified('password') || this.isNew) return next();
    this.passwordChangedAt = Date.now() - 1000; // because sometimes save to database is slow and then we will issued the token before this time saved to DB and we previously checked if the user changed his password before log in using protect router middleware to ensure that the token is generated after the password is changed by substrafcting 1 second
    next();
});

userSchema.pre(/^find/, function(next) {
    // this is point to the current query
    this.find({active: {$ne: false}});
    next();
});

userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
}

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if(this.passwordChangedAt){
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime()/1000, 10);
        return JWTTimestamp < changedTimestamp;
    }
    //False means NOT changed
    return false;
}

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    // console.log({resetToken}, this.passwordResetToken);
    return resetToken;
}

const User = mongoose.model('User', userSchema);
module.exports = User;