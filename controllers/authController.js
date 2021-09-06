const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');

const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');

const signToken = id => {
    return  jwt.sign({id}, process.env.JWT_SECRET,{expiresIn:process.env.JWT_EXPIRES_IN});

}

const createAndSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);

    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true // this will make it so the cookie can not be accessed or modified in any way by the browser 
    }
    if(process.env.NODE_ENV === 'production') cookieOptions.secure = true;

    res.cookie('jwt', token, cookieOptions);
    // to not return password to the user if he signup (creating new document), we actually set it to select false in our schema so doesn't show up when we query for all the users but, here it come from creating a new document this is different
    // remove the passsword from the output
    user.password = undefined;
    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    }); // 201 created
}
exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt: req.body.passwordChangedAt,
        role: req.body.role
    });
    const url = `${req.protocol}://${req.get('host')}/me`;
    await new Email(newUser, url).sendWelcome();
    createAndSendToken(newUser, 201, res);// 201 created
});

exports.login = catchAsync(async (req, res, next) => {
    const {email, password} = req.body;
    // 1) Check if email and password exist
    if (!email || !password) {
        return next(new AppError('Please provide email and password!',400));
    }
    // 2) Check if the user exists && password is correct 
    const user = await User.findOne({ email }).select('+password');
    
    if( !user || !(await user.correctPassword(password, user.password)) ){
        return next(new AppError('Incorrect email or password', 401)); //401 unauthorized
    }
    // 3) If everything ok, send token to client 
    createAndSendToken(user, 200, res);
});

exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now()+ 10 * 1000),
        httpOnly: true
    });
    res.status(200).json({status: 'success'});
}

exports.protect = catchAsync( async (req, res, next) =>{
    // 1) Getting the token and check if it's there
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }else if(req.cookies.jwt){
        token = req.cookies.jwt;
    }
    
    if(!token) {
        return next(new AppError('You are not logged in! Please log in to get access.', 401)); // 401 unautorized
    }
    // 2) Verification the token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    // 3) Check if the user still exists
    const currentUser = await User.findById(decoded.id);
    if(!currentUser) {
        return next(new AppError('The user belonging to this token does not longger exist.', 401));
    }
    // 4) Check if user change password after the token was issued
    if(currentUser.changedPasswordAfter(decoded.iat)){
        return next(new AppError('User recently changed password! Please log in again.', 401));
    }
    // GEANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
});

// Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) =>{
    try{
        // we removed catchAsync because we have 'loggouedout' token for logging out and that will cause an error to verify that token so we wrapped it with try catch blocks because we don't wabt to cause an error
        if(req.cookies.jwt){
            // 1) Verification the token
            const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
            // 2) Check if the user still exists
            const currentUser = await User.findById(decoded.id);
            if(!currentUser) {
                return next();
            }
            // 3) Check if user change password after the token was issued
            if(currentUser.changedPasswordAfter(decoded.iat)){
                return next();
            }
            // THERE IS A LOGGED IN USER
            res.locals.user = currentUser;
            return next();
        }
    }catch (err) {
        return next();
    }

    return next();
};

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // roles is an array ['admin', 'lead-guide']
        if(!roles.includes(req.user.role)){
            return next(new AppError('You do not have permission to perform this action', 403)); // 403 forbiden
        }
        next();
    }
}

exports.forgotPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on Posted email
    const user = await User.findOne({email: req.body.email});
    if(!user){
        return next(new AppError('there is no user with email address.', 404));
    }
    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({validateBeforeSave: false });
    
    // 3) Send it to user's email
    try{
        const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
        await new Email(user, resetUrl).sendPasswordReset();

       res.status(200).json({
           status: 'success',
           message: 'Token sent to email!'
       });
    }catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({validateBeforeSave: false });
        return next(new AppError('There was an error sending the email. Try again later!', 500));
    }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1) get user based on the token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({passwordResetToken: hashedToken, passwordResetExpires: {$gt: Date.now()}});

    // 2) If token has not expired, and there is user, set the new password
    if(!user) {
        return next(new AppError('Token is invalid or has expired', 400));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    // use save to turn on the validators
    await user.save();
    // here we don't want to turn off the validator we want to sure that password is equal to passwordConfirm (validator will do that automatically)
    // 3) Update changePasswordAt property for the user
    // we did this step using pre save middleware in userModel.js
    // 4) Log the user in, send JWT
    createAndSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1) Get user from collection
    const user = await User.findById(req.user._id).select('+password');
    // 2) Check if POSTED current password is correct
    if(! await user.correctPassword(req.body.passwordCurrent, user.password)) {
        return next(new AppError('Your current password is wrong', 401));
    }
    // 3) If so, update the password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    // NOTE: we can not use User.findByIdAndUpdate() here for two reasins 
    // 1-- because the password confirm validator is using this keyword so when we use update mongoose does not keep the object in memory
        // so keep in your mind do not use update() with any thing related to password
    // 2-- the pre save middlewares are not gonna work so that the password won't be encrypted and also the passwordChangedAt timestamp won't be set also 
    // So User.findByIdAndUpdate() will NOT work as intended!

    await user.save(); // we want the validation to happen so, we do not turn off the validation
    // 4) Log user in, send JWT
    createAndSendToken(user, 200, res);
});