// to import data run node dev-data/data/import-dev-data.js --import
// to delete data run node dev-data/data/import-dev-data.js --delete 
const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

const Tour = require('./../../models/tourModel');
const Review = require('./../../models/reviewModel');
const User = require('./../../models/userModel');

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
mongoose.connect(DB, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true
})
.then(connection => console.log('DB connection successful!'));

// READ JSON FILE
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`,'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`,'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`,'utf-8'));

//IMPORT DATA INTO DB
const importData = async () => {
    try{
        await Tour.create(tours);
        await User.create(users, { validateBeforeSave: false });
        await Review.create(reviews);
        console.log('Data successfully loaded!');
    }catch(err){
        console.log(err.message);
    }
    process.exit();
};

// DELETE ALL DATA FROM DB
const deleteData = async () => {
    try{
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        console.log('Data successfully deleted!');
    }catch(err){
        console.log(err.message);
    }
    process.exit();
}

if(process.argv[2] ==='--import'){
    importData();
}else if(process.argv[2] === '--delete') {
    deleteData();
}
console.log(process.argv);