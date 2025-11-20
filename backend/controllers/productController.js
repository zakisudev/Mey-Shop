import asyncHandler from '../middleware/asyncHandler.js';
import Product from '../models/productModel.js';
import Review from '../models/reviewModel.js';
import User from '../models/userModel.js';
import { Op, Sequelize } from 'sequelize';

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const pageSize = parseInt(process.env.PAGINATION_LIMIT) || 10;
  const page = Number(req.query.pageNumber) || 1;
  
  const whereClause = {};
  if (req.query.keyword) {
    whereClause.name = {
      [Op.like]: `%${req.query.keyword}%`,
    };
  }
  
  const count = await Product.count({ where: whereClause });
  const products = await Product.findAll({
    where: whereClause,
    limit: pageSize,
    offset: pageSize * (page - 1),
    include: [
      {
        model: Review,
        as: 'reviews',
        required: false,
      },
    ],
  });
  
  // Format products to include _id for frontend compatibility
  const formattedProducts = products.map((product) => ({
    ...product.toJSON(),
    _id: product.id,
    reviews: product.reviews ? product.reviews.map((review) => ({
      ...review.toJSON(),
      _id: review.id,
      user: review.userId,
    })) : [],
  }));
  
  res.status(200).json({ products: formattedProducts, page, pages: Math.ceil(count / pageSize) });
});

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id, {
    include: [
      {
        model: Review,
        as: 'reviews',
        required: false,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name'],
            required: false,
          },
        ],
      },
    ],
  });
  
  if (product) {
    const formattedProduct = {
      ...product.toJSON(),
      _id: product.id,
      reviews: product.reviews ? product.reviews.map((review) => ({
        ...review.toJSON(),
        _id: review.id,
        user: review.user ? review.user.id : review.userId,
      })) : [],
    };
    res.status(200).json(formattedProduct);
  } else {
    throw new Error('Resource not found');
  }
});

// @desc    Create new product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create({
    name: 'Sample product name',
    price: 0,
    userId: req.user.id,
    image: '/images/sample.jpg',
    brand: 'Sample brand',
    category: 'Sample category',
    countInStock: 0,
    numReviews: 0,
    description: 'Sample description',
  });

  const formattedProduct = {
    ...product.toJSON(),
    _id: product.id,
  };

  res.status(201).json(formattedProduct);
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
  const { name, price, description, image, brand, category, countInStock } =
    req.body;
  const product = await Product.findByPk(req.params.id);
  
  if (product) {
    product.name = name;
    product.price = price;
    product.description = description;
    product.image = image;
    product.brand = brand;
    product.category = category;
    product.countInStock = countInStock;

    const updatedProduct = await product.save();
    const formattedProduct = {
      ...updatedProduct.toJSON(),
      _id: updatedProduct.id,
    };
    res.status(200).json(formattedProduct);
  } else {
    res.status(404);
    throw new Error('Resource not found');
  }
});

// @desc   Delete a product
// @route  DELETE /api/products/:id
// @access Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id);

  if (product) {
    await product.destroy();
    res.status(200).json({ message: 'Product removed' });
  } else {
    res.status(404);
    throw new Error('Resource not found');
  }
});

// @dec    Create a review
// @route  POST /api/products/:id/reviews
// @access Private
const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const product = await Product.findByPk(req.params.id, {
    include: [
      {
        model: Review,
        as: 'reviews',
        required: false,
      },
    ],
  });
  
  if (product) {
    // Check if user already reviewed this product
    const existingReviews = await Review.findAll({
      where: {
        productId: product.id,
        userId: req.user.id,
      },
    });
    
    if (existingReviews.length > 0) {
      res.status(400);
      throw new Error('Product already reviewed');
    }
    
    // Create new review
    await Review.create({
      name: req.user.name,
      rating: Number(rating),
      comment,
      userId: req.user.id,
      productId: product.id,
    });
    
    // Recalculate rating and numReviews
    const allReviews = await Review.findAll({
      where: { productId: product.id },
    });
    
    product.numReviews = allReviews.length;
    product.rating =
      allReviews.reduce((acc, review) => acc + Number(review.rating), 0) /
      allReviews.length;
    
    await product.save();

    res.status(201).json({ message: 'Review added' });
  } else {
    res.status(404);
    throw new Error('Resource not found');
  }
});

// @desc    Get top rated products
// @route   GET /api/products/top
// @access  Public
const getTopProducts = asyncHandler(async (req, res) => {
  const products = await Product.findAll({
    order: [['rating', 'DESC']],
    limit: 3,
    include: [
      {
        model: Review,
        as: 'reviews',
        required: false,
      },
    ],
  });
  
  // Format products to include _id for frontend compatibility
  const formattedProducts = products.map((product) => ({
    ...product.toJSON(),
    _id: product.id,
    reviews: product.reviews ? product.reviews.map((review) => ({
      ...review.toJSON(),
      _id: review.id,
      user: review.userId,
    })) : [],
  }));
  
  res.status(200).json(formattedProducts);
});

export {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  getTopProducts,
};
