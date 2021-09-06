const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1) GLOBAL MIDDLEWARES
// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Set Security HTTP headers
app.use(helmet());
// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP, please try again in an hour!'
});

app.use('/api',limiter);
//Body parser, reading data from the body into req.body limited the data to 10 kilo bytes
app.use(express.json({limit:'10kb'})); // this parses the data from the body
app.use(express.urlencoded({ extended: true, limit: '10kb'})); // this for parsing the form body data
app.use(cookieParser());// this parses the data from the cookie

//Data sanitization against NoSQL query injection 
app.use(mongoSanitize());
//Data santization against XSS
// this clean any user input from malicious html code basically (maybe the haccker is trying to injust html with javascript code attached to it)
app.use(xss());
// Prevent parameter pollution
app.use(hpp({
  whitelist: ['duration', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize', 'difficulty', 'price']
}));
// this is only working for text because the images in jpeg and it's already compressed
app.use(compression());

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});

// 3) MUNTING ROUTES

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next)=>{
  // when we pass obj to next() exprees will assume  that it's an error
  // and it will skip all the middlewares in the middleware stack and send the error that we passed in
  // to our global error handling middleware  which then be executed
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
