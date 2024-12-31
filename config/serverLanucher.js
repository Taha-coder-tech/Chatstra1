const mongoose = require('mongoose');

const uri = 'mongodb://127.0.0.1:27017/Chatstra';

mongoose
  .connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Successfully connected to MongoDB');
    process.exit(0); // Exit after successful connection
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1); // Exit with error
  });
