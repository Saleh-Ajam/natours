const mongoose = require('mongoose');
const dotenv = require('dotenv');


// uncaught exceptions: bugs that have occured in our synchronous code
// but are not handled anywhere
process.on('uncaughtException', err => {
  console.log(err.name, err.message);
  console.log('UNCAUGHT EXCEPTION! Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
    // after uncaught exception the entire node process is so called uncleaned state
    // So to fix that the process is need to terminate and then to be restarted hosting services already do that out the box complete that automatically
  
});


dotenv.config({ path: './config.env' });
const app = require('./app');


const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
mongoose.connect(DB, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true
})
.then(connection => console.log('DB connection successful!'));




const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// you may use tool to restart the server because we do not want the app hangging like forever
// or maybe some of the platforms that host nodeJS will automatically do that on thiere own
process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION! Shutting down...');
  console.log(err.name, err.message);
  // to give the server time to close all the request that are pending or handeled 
  // before shut down the process
  server.close(()=> {
    // code 0 stands for success and 1 stands for uncaught exceptions
    process.exit(1);
  });
});