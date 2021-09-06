const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour', 
        required: [true, 'Booking mustbelong to a Tour!']
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User', 
        required: [true, 'Booking mustbelong to a User!']
    },
    price: {
        type: Number,
        required: [true, 'Booking mustbelong to a price.!']
    },
    createdAt: {
        type: Date,
    default: Date.now()
    },
    paid: {
        type: Boolean,
        default: true
    }
});

bookingSchema.pre(/^find/, function (next) {
    this.populate('user').populate({
        path: 'tour',
        select: 'name'
    });
    next();
});

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;