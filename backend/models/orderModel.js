import { sequelize } from '../config/db.js';
import { DataTypes } from 'sequelize';
import User from './userModel.js';

const Order = sequelize.define(
  'Order',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    shippingAddress: {
      type: DataTypes.JSON,
      allowNull: false,
      get() {
        const value = this.getDataValue('shippingAddress');
        return typeof value === 'string' ? JSON.parse(value) : value;
      },
      set(value) {
        this.setDataValue('shippingAddress', JSON.stringify(value));
      },
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    paymentResult: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
      get() {
        const value = this.getDataValue('paymentResult');
        return value && typeof value === 'string' ? JSON.parse(value) : value;
      },
      set(value) {
        this.setDataValue('paymentResult', value ? JSON.stringify(value) : null);
      },
    },
    itemsPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    taxPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    shippingPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    isPaid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isDelivered: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    deliveredAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    tableName: 'orders',
  }
);

// Define associations - OrderItem associations will be set up separately
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default Order;
