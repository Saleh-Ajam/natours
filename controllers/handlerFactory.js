const catchAsync  = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');


exports.deleteOne = Model => catchAsync(async (req, res, next)=>{
    const doc = await Model.findByIdAndDelete(req.params.id);

    if(!doc){
        return next(new AppError('No document Found with that ID', 404));
    }    

    res.status(204).json({
        status: 'success',
        data: null
    });
});

exports.updateOne = Model => catchAsync(async (req, res, next)=>{
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new : true,
        runValidators: true // to run the validators again like required, minLength and max Length
    });
    if(!doc){
        return next(new AppError('No document Found with that ID', 404));
    }
    res.status(200).json({
        status: 'success',
        data: {
            doc
        }
    });
});

exports.createOne = Model => catchAsync(async (req, res, next)=>{
    const doc = await Model.create(req.body);
        
        res.status(201).json({
            status: 'success',
            data: {
                data: doc
            }
        });
});

exports.getOne = (Model, populateOptions) => catchAsync(async (req, res, next)=>{
    let query = Model.findById(req.params.id);
    if(populateOptions) query = query.populate(populateOptions);
    const doc = await query;

    if(!doc){
        return next(new AppError('No document Found with that ID', 404));
    }
    res.status(200).json({
        status: 'success',
        data: {
            data: doc
        }
    });
});

exports.getAll = Model => catchAsync(async (req, res, next)=>{
    // To allow for nested GET reviews on tour (hack)
    let filter = {}
    if(req.params.tourId) filter = {tour: req.params.tourId};

    // BUILD QUERY
    const features = new APIFeatures(Model.find(filter), req.query)
    .filter().sort()
    .limitFields()
    .paginate(); 
    // EXECUTE THE QUERY
    // const docs = await features.query.explain();
    const docs = await features.query;
     
    // SEND RESPONSE
    res.status(200).json({
        status: 'success',
        results: docs.length,
        data: {
            data: docs
        }
    });
});