import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'meyshop',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false, // Set to console.log for SQL query logging
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL connected successfully');
    
    // Sync models with database (create tables if they don't exist)
    // In production, you should use migrations instead
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true });
    }
  } catch (error) {
    console.error('Unable to connect to MySQL:', error.message);
    process.exit(1);
  }
};

export { sequelize };
export default connectDB;
