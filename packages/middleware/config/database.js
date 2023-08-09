/* eslint-disable no-console */
const mongoose = require('mongoose');
require('dotenv').config();
// const DB_URL = "mongodb+srv://root:3oLnzWfonfQ62BLg@cluster0.q7kjuoi.mongodb.net/4DwallDB"
const { DB_URL } = process.env;
// mongoose.set('debug', true);

const connectToMongo = async () => {
  try {
    // await mongoose.connect(`${DB_URL}/${DB_NAME}`).then(() => console.log('Connected!'));
    mongoose.connect(DB_URL).then(() => console.log('Connected!'));
    const { connection } = mongoose;

    connection.on('connecting', () => {
      console.log('connecting');
    });

    connection.on('timeout', () => {
      console.log('timeout!');
    });

    connection.on('error', (error) => {
      console.error(`Error in MongoDb connection: ${error}`);
    });

    connection.on('connection', () => {
      console.log('connected!');
    });
  } catch (error) {
    console.log('error');
  }
};
module.exports = connectToMongo;
