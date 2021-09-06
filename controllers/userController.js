const multer = require('multer');
const sharp = require('sharp');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

// const multerStorage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'public/img/users');
//     },
//     filename: (req, file, cb) => {
//         // user-userId-currentTimeStamp.fileExtension
//         const ext = file.mimetype.split('/')[1];
//         cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//     }
// });
const multerStorage = multer.memoryStorage(); // in this way the image will store as a buffer

const multerFilter = (req, file, cb) => {
    if(file.mimetype.startsWith('image')){
        cb(null, true);
    }else{
        cb(new AppError('Not an image! Please upload only images.', 400), false);
    }
}

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto =catchAsync(async (req, res, next) => {
    if (!req.file) return next();
    // we do this because the buffer file does'nt have filename field an we need it in updateMe middleware
    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
    await sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat('jpeg')
        .jpeg({quality: 90})
        .toFile(`public/img/users/${req.file.filename}`);
    next();
});

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if(allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
}



exports.updateMe = catchAsync(async (req, res, next) => {
    // console.log(req.file);
    // console.log(req.body);
    // 1) Create error if user POSTs password data
    if(req.body.password || req.body.passwordConfirm) {
        return next(new AppError('This route is not for password update. Please use /updateMyPassword', 400));
    }
    // 2) Filtered out unwanted fields names that are not allowed to be updated 
    const fillteredBody = filterObj(req.body, 'name', 'email');
    if(req.file) fillteredBody.photo = req.file.filename;
    // 3) Update user document
    const updatedUser = await User.findByIdAndUpdate(req.user._id, fillteredBody, {new: true, runValidators: true});

    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser
        }
    });
});

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
};

exports.deleteMe = catchAsync(async (req,res,next) =>{
    await User.findByIdAndUpdate(req.user._id, {active: false});

    res.status(204).json({
        status: 'success',
        data: null
    })
});

exports.createUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This route is not defined! Please use /signup instead'
    })
}

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User); // this for admin to update fields except the password because where ever we use findByIdAndUpdate all the save middleware is not run 
exports.deleteUser = factory.deleteOne(User);