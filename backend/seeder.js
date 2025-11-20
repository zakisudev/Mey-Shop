import dotenv from 'dotenv';
import users from './data/users.js';
import products from './data/products.js';
import User from './models/userModel.js';
import Product from './models/productModel.js';
import Order from './models/orderModel.js';
import OrderItem from './models/orderItemModel.js';
import Review from './models/reviewModel.js';
import { sequelize } from './config/db.js';
import './models/index.js'; // Import to set up associations

dotenv.config();

const importData = async () => {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('MySQL connected successfully');

    // Create tables if they don't exist (sync without dropping existing tables)
    console.log('Creating tables if they don\'t exist...');
    await sequelize.sync({ alter: false, force: false });
    console.log('Tables created/verified successfully');

    // Clear existing data
    await OrderItem.destroy({ where: {} });
    await Order.destroy({ where: {} });
    await Review.destroy({ where: {} });
    await Product.destroy({ where: {} });
    await User.destroy({ where: {} });

    // Import users (passwords are already hashed, but Sequelize hooks will hash again)
    // So we'll create users with plain passwords and let hooks handle hashing
    const usersWithPlainPasswords = users.map(user => ({
      ...user,
      password: '123456', // Plain password, will be hashed by hook
    }));

    const createdUsers = await User.bulkCreate(usersWithPlainPasswords, {
      individualHooks: true, // Important: triggers hooks for password hashing
    });

    const adminUser = createdUsers[0];

    // Import products
    const sampleProducts = products.map((product) => ({
      ...product,
      userId: adminUser.id,
    }));

    await Product.bulkCreate(sampleProducts);

    console.log('Data Imported!');
    await sequelize.close();
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    await sequelize.close();
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('MySQL connected successfully');

    await OrderItem.destroy({ where: {} });
    await Order.destroy({ where: {} });
    await Review.destroy({ where: {} });
    await Product.destroy({ where: {} });
    await User.destroy({ where: {} });

    console.log('Data Destroyed!');
    await sequelize.close();
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    await sequelize.close();
    process.exit(1);
  }
};

const setupTables = async () => {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('MySQL connected successfully');

    // Create tables if they don't exist
    console.log('Creating tables...');
    await sequelize.sync({ alter: false, force: false });
    console.log('Tables created successfully!');

    await sequelize.close();
    process.exit();
  } catch (error) {
    console.error(`Error setting up tables: ${error}`);
    await sequelize.close();
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else if (process.argv[2] === '--setup') {
  setupTables();
} else {
  importData().then(async () => {
    await sequelize.close();
  }).catch(async (error) => {
    await sequelize.close();
    process.exit(1);
  });
}
