const cron = require('node-cron');
const Article = require('../models/articleModel');

// Define a cron job to check for scheduled articles and update their status
const scheduleTask = () => {
  console.log('Cron job scheduled to run every minute');

  cron.schedule('* * * * *', async () => {
    console.log('Running scheduled task');
    
    try {
      const currentDate = new Date();
      console.log(`Current Date and Time: ${currentDate}`);

      // Find articles with status 'scheduled' and scheduledTime less than or equal to current time
      const articlesToUpdate = await Article.find({
        status: 'scheduled',
        scheduledTime: { $lte: currentDate }
      });

      if (articlesToUpdate.length > 0) {
        // Log the IDs of the articles to be updated
        console.log('Articles to be updated:', articlesToUpdate.map(article => article._id));

        // Update status of found articles to 'published'
        const result = await Article.updateMany(
          { _id: { $in: articlesToUpdate.map(article => article._id) } },
          { $set: { status: 'published' } }
        );

        console.log(`${articlesToUpdate.length} articles have been published.`);
        console.log('Update result:', result);
      } else {
        console.log('No articles to update at this time.');
      }
    } catch (error) {
      console.error('Error updating article statuses:', error);
    }
  });
};

module.exports = scheduleTask;
