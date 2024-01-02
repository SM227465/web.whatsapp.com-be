import mongoose from 'mongoose';
import logger from '../configs/logger.config.js';

const localDB = process.env.LOCAL_DB_URL;
const cloudDB = process.env.CLOUD_DB_URL.replace('<password>', process.env.CLOUD_DB_PASS);

export const connectWithDB = () => {
  mongoose
    .set('strictQuery', false)
    .connect(localDB)
    .then(() => logger.info('Connected to MongoDB.'))
    .catch((err) => {
      logger.error('Failed to connect with MongoDB.');
      logger.error(err.message);
      process.exit(1);
    });
};
