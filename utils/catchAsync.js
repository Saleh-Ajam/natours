module.exports = fn => {
    return (req, res, next) => {
        // fn(req, res, next).catch(err => next(err)); same as below catch will bass the error to the next()
        fn(req, res, next).catch(next);
    };
};