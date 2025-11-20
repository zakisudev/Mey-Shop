// Central file to set up all model associations
import User from './userModel.js';
import Product from './productModel.js';
import Review from './reviewModel.js';
import Order from './orderModel.js';
import OrderItem from './orderItemModel.js';

// Set up all associations
Product.hasMany(Review, { foreignKey: 'productId', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Review.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'orderItems' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

export { User, Product, Review, Order, OrderItem };

