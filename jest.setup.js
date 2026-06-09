const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.test' });

module.exports = async () => {
    await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 30000,
    });
    console.log('Test DB Connected!');
};