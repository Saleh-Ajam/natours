const Review = require('./../models/reviewModel');
// const catchAsync = require('./../utils/catchAsync');
const factory = require('./../controllers/handlerFactory');


exports.setTourUserIds = (req, res, next) => {
    // Allow Nested Routes
    if(!req.body.tour) req.body.tour = req.params.tourId;
    if(!req.body.user) req.body.user = req.user._id; // from the protect middleware
    next();
}

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);