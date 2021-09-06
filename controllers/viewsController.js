const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('./../utils/appError');

exports.getOverview =catchAsync(async (req, res, next) => {
  // 1) Get tour data from collection
  const tours = await Tour.find();
  // 2) Build template
  // 3) Render that template using tour data from 1) 
    res.status(200).render('overview',{
      title: 'All Tours',
      tours
    });
});

exports.getTour = catchAsync(async(req, res, next) => {
  // 1) get the data, for the requested tour (including reviews and guides )
  const tour = await Tour.findOne({slug: req.params.slug}).populate({
    path: 'reviews',
    fields: 'review rating user'
  });

  if(!tour) return next(new AppError('There is no tour with that name.', 404));
  // 2) Build templdate

  // 3) Render template using the data from 1)
  res.status(200)
  .set(
    'Content-Security-Policy',
    "default-src 'self' https://*.mapbox.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
  ).render('tour',{
    title: `${tour.name} Tour`, 
    tour
  });
});

exports.getLoginForm = (req, res) => {

  // res.setHeader('Content-Security-Policy', 'script-src cdnjs.cloudflare.com'); 
  // connect-src script-src cdnjs.cloudflare.com now is not necessary because we install axios as npm module
  // res.status(200).set(
    // 'Content-Security-Policy',
    // "default-src 'self' https://cdnjs.cloudflare.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;connect-src http://127.0.0.1:3000/api/v1/users/login"
      // )
  res.status(200)
  .render('login',{
    title: 'Log into your account'
  })
};

exports.getAccount = (req, res) => {
  res.status(200).render('account',{
    title: 'Your Account'
  });
}


exports.getMyTours = catchAsync(async(req, res, next) => {
  // we can do virtual populate on the tours
    /// 1) Fin all bookings
    const bookings = await Booking.find({user: req.user.id })
    // 2) Find tours with the returned IDs
    const tourIDs = bookings.map(el => el.tour);
    const tours = await Tour.find({_id: {$in: tourIDs}});

    res.status(200).render('overview', {tours});
});

exports.updateUserData = catchAsync(async(req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(req.user.id, {
    name: req.body.name,
    email: req.body.email
  },{new: true, runValidators: true});
  res.status(200).render('account', {
    title: 'Your Account',
    user: updatedUser
  });
});