const cron = require('node-cron');
const { sendScheduledMessages } = require('../controllers/messageController');

// Schedule the job to run every minute (you can adjust the frequency)
cron.schedule('* * * * *', () => {
  console.log('Checking for scheduled messages...');
  sendScheduledMessages(); // Run the function to send scheduled messages
});
