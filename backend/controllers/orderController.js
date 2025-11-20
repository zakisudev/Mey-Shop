import asyncHandler from '../middleware/asyncHandler.js';
import Order from '../models/orderModel.js';
import OrderItem from '../models/orderItemModel.js';
import Product from '../models/productModel.js';
import User from '../models/userModel.js';
import { calcPrices } from '../utils/calcPrices.js';
import { Op } from 'sequelize';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = asyncHandler(async (req, res) => {
  const { orderItems, shippingAddress, paymentMethod } = req.body;

  if (orderItems && orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items');
  } else {
    // get the ordered items from our database
    const productIds = orderItems.map((x) => parseInt(x._id || x.id));
    const itemsFromDB = await Product.findAll({
      where: {
        id: {
          [Op.in]: productIds,
        },
      },
    });

    // map over the order items and use the price from our items from database
    const dbOrderItems = orderItems.map((itemFromClient) => {
      const matchingItemFromDB = itemsFromDB.find(
        (itemFromDB) => itemFromDB.id === parseInt(itemFromClient._id || itemFromClient.id)
      );
      return {
        name: itemFromClient.name,
        qty: itemFromClient.qty,
        image: itemFromClient.image,
        price: matchingItemFromDB.price,
        productId: matchingItemFromDB.id,
      };
    });

    // calculate prices
    const { itemsPrice, taxPrice, shippingPrice, totalPrice } =
      calcPrices(dbOrderItems);

    // Create order
    const order = await Order.create({
      userId: req.user.id,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    });

    // Create order items separately
    await OrderItem.bulkCreate(
      dbOrderItems.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        name: item.name,
        qty: item.qty,
        image: item.image,
        price: item.price,
      }))
    );

    // Reload order with orderItems
    const createdOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
          as: 'orderItems',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name'],
            },
          ],
        },
      ],
    });

    // Format orderItems to match frontend expectations (include product as id)
    const formattedOrder = {
      ...createdOrder.toJSON(),
      orderItems: createdOrder.orderItems.map((item) => ({
        ...item.toJSON(),
        product: item.productId, // Frontend expects 'product' field
        _id: item.id, // Also include _id for compatibility
      })),
      _id: createdOrder.id, // Include _id for compatibility
    };

    res.status(201).json(formattedOrder);
  }
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.findAll({
    where: { userId: req.user.id },
    include: [
      {
        model: OrderItem,
        as: 'orderItems',
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name'],
          },
        ],
      },
    ],
    order: [['createdAt', 'DESC']],
  });
  
  if (orders) {
    // Format orders to match frontend expectations
    const formattedOrders = orders.map((order) => ({
      ...order.toJSON(),
      _id: order.id,
      orderItems: order.orderItems.map((item) => ({
        ...item.toJSON(),
        product: item.productId,
        _id: item.id,
      })),
    }));
    res.status(200).json(formattedOrders);
  } else {
    res.status(404);
    throw new Error('Resources not found');
  }
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findByPk(req.params.id, {
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email'],
      },
      {
        model: OrderItem,
        as: 'orderItems',
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name'],
          },
        ],
      },
    ],
  });
  
  if (order) {
    // Format order to match frontend expectations
    const formattedOrder = {
      ...order.toJSON(),
      _id: order.id,
      user: order.user ? { ...order.user.toJSON(), _id: order.user.id } : null,
      orderItems: order.orderItems.map((item) => ({
        ...item.toJSON(),
        product: item.productId,
        _id: item.id,
      })),
    };
    res.status(200).json(formattedOrder);
  } else {
    res.status(404);
    throw new Error('Resource not found');
  }
});

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findByPk(req.params.id, {
    include: [
      {
        model: OrderItem,
        as: 'orderItems',
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name'],
          },
        ],
      },
    ],
  });
  
  if (order) {
    order.isPaid = true;
    order.paidAt = new Date();
    order.paymentResult = req.body;
    const updatedOrder = await order.save();
    
    const formattedOrder = {
      ...updatedOrder.toJSON(),
      _id: updatedOrder.id,
      orderItems: order.orderItems.map((item) => ({
        ...item.toJSON(),
        product: item.productId,
        _id: item.id,
      })),
    };
    
    res.status(200).json(formattedOrder);
  } else {
    res.status(404);
    throw new Error('Resource not found');
  }
});

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
const updateOrderToDelivered = asyncHandler(async (req, res) => {
  const order = await Order.findByPk(req.params.id, {
    include: [
      {
        model: OrderItem,
        as: 'orderItems',
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name'],
          },
        ],
      },
    ],
  });
  
  if (order) {
    order.isDelivered = true;
    order.deliveredAt = new Date();
    const updatedOrder = await order.save();
    
    const formattedOrder = {
      ...updatedOrder.toJSON(),
      _id: updatedOrder.id,
      orderItems: order.orderItems.map((item) => ({
        ...item.toJSON(),
        product: item.productId,
        _id: item.id,
      })),
    };
    
    res.status(200).json(formattedOrder);
  } else {
    res.status(404);
    throw new Error('Resource not found');
  }
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.findAll({
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'name'],
      },
      {
        model: OrderItem,
        as: 'orderItems',
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name'],
          },
        ],
      },
    ],
    order: [['createdAt', 'DESC']],
  });
  
  if (orders) {
    // Format orders to match frontend expectations
    const formattedOrders = orders.map((order) => ({
      ...order.toJSON(),
      _id: order.id,
      user: order.user ? { ...order.user.toJSON(), _id: order.user.id } : null,
      orderItems: order.orderItems.map((item) => ({
        ...item.toJSON(),
        product: item.productId,
        _id: item.id,
      })),
    }));
    res.status(200).json(formattedOrders);
  } else {
    res.status(404);
    throw new Error('Resources not found');
  }
});

export {
  addOrderItems,
  getMyOrders,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  getOrders,
};
