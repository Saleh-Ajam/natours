const AppError = require('./../utils/appError');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldDB = err => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
 const message = `Invalid input data. ${errors.join('. ')}.`;
 return new AppError(message, 400);
};

const handleJWTError = () => new AppError('Invalid token. Please log in again!', 401);
const handleJWTExpiredError = () => new AppError('Your token has expired! Please log in again.',401);

const sendErrorDev = (err, req, res) =>{
  // A) API
  if(req.originalUrl.startsWith('/api')){
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } else {
    // B) RENDERED WEBSITE
    console.error('Error: ', err);
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message
    })
  }
  
};

const sendErrorProduction = (err, req, res) =>{
  // A) API
  if(req.originalUrl.startsWith('/api')){
    // A) operational, trusted error: send message to client
    if(err.isOperational){
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    // B) Programing or other unknown error: don't leak error details
    } else {
      // 1) Log the error ( in the logs on heruko for exapmle)
      console.error('Error: ', err);

      // 2) Send generic message 
      return res.status(500).json({
        status: 'error',
        message: 'Something went very wrong!'
      });
    }
  } else {
    // B) RENDERES WEBSITE
    // A) operational, trusted error: send message to client
    if(err.isOperational){
      return res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: err.message
      })
    // B) Programing or other unknown error: don't leak error details
    } else {
      // 1) Log the error ( in the logs on heruko for exapmle)
      console.error('Error: ', err);

      // 2) Send generic message 
      return res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: 'Please try again later.'
      })
    }

  }
}

module.exports = (err, req, res, next)=>{

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if(process.env.NODE_ENV === 'development'){
    sendErrorDev(err, req, res);
  }else if(process.env.NODE_ENV === 'production'){
    
    let error = { ...err }; 
    
    if(err.name === 'CastError'){
      // err is MongooseError object and error will become java script object
      // so there fields we can not destructuring to error variable so toJSON() 
      // is a method in class MongooseError and it returns some Fields like name from MongooseError object
      // this hole process because we couldn't get the name field from err to error
      error = { ...err ,...err.toJSON()}; 
      error = handleCastErrorDB(error);
      sendErrorProduction(error, req, res);
    }
    else if(err.code === 11000) {
      error = handleDuplicateFieldDB(err);
      sendErrorProduction(error, req, res);
    }
    else if(err.name === 'ValidationError') {
      error = handleValidationErrorDB(err);
      sendErrorProduction(error, req, res);
    }
    else if(err.name === 'JsonWebTokenError') {
      error = handleJWTError();
      sendErrorProduction(error, req, res);
    }else if(err.name === 'TokenExpiredError'){
      error = handleJWTExpiredError();
      sendErrorProduction(error, req, res);
    }else sendErrorProduction(err, req, res);
  }
}