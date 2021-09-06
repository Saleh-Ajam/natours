const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true,'Review can not be empty!']
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'Review must belong to a tour.']
    },
    user : {    
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Review must belong to a user']
    }
}, 
{// if we have a calculated virtual property we want to show it in the output
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

reviewSchema.index({tour: 1, user: 1}, {unique: true});


reviewSchema.pre(/^find/, function(next){
    // this.populate({
    //     path: 'tour',
    //     select: 'name'
    // }).populate({
    //     path: 'user',
    //     select: 'name photo'
    // });
    this.populate({
        path: 'user',
        select: 'name photo'
    });
    next();
});
// this method is run on the model it's static not on the document
reviewSchema.statics.calcAverageRatings = async function(tourId) {
    // Aggregation pipeline
    const stats = await this.aggregate([
        {
            $match: {tour: tourId}
        },
        {
            $group: {
                _id: '$tour',
                nRatings: { $sum: 1},
                avgRating: { $avg: '$rating'}
            }
        }
    ]);
    if(stats.length > 0){
        await Tour.findByIdAndUpdate(tourId, {
        ratingsQuantity: stats[0].nRatings,
        ratingsAverage: stats[0].avgRating
        });
    }else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5
            });
    }
    // this fumction will never call so we will call it using middleware
};

reviewSchema.post('save', function() {
    // this points to current review
    this.constructor.calcAverageRatings(this.tour);
});
// findByIdAndUpdate(), findByIdAndDelete()
// we have query middleware for them we don't have access to the document
// behund the scenes the y work finfOneAndUpdate
reviewSchema.pre(/^findOneAnd/, async function(next){
    // this keyword is refer for a query
    this.r = await this.findOne();
    next();
});

reviewSchema.post(/^findOneAnd/, async function(){
    // await this.findOne(); does not work here, query has already executed
    await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;