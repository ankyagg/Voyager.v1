import { Sequelize } from 'sequelize';
import mongoose from 'mongoose';

// Postgres Connection
export const sequelize = new Sequelize(
  process.env.PG_DATABASE || 'travel_db',
  process.env.PG_USER || 'postgres',
  process.env.PG_PASSWORD || 'password',
  {
    host: process.env.PG_HOST || 'localhost',
    dialect: 'postgres',
    logging: false,
  }
);

// MongoDB Connection
export const connectMongo = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/travel_places');
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection failed (Check if MongoDB is running locally).');
  }
};

export const connectPostgres = async () => {
  try {
    await sequelize.authenticate();
    console.log('Postgres connected successfully');
    // Sync models in production/dev
    if (process.env.NODE_ENV !== 'production' && process.env.PG_HOST !== 'localhost') {
      await sequelize.sync({ alter: true });
    }
  } catch (err) {
    console.error('Postgres connection failed (Check if Postgres is running locally).');
  }
};
