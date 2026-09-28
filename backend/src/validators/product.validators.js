import { body, param, query } from 'express-validator';
import { PRODUCT_CATEGORIES } from '../config/constants.js';

export const productIdValidator = [
  param('id').isMongoId().withMessage('Invalid product ID'),
];

// Used for both create (POST) and full update (PUT), since PUT replaces the product.
export const productBodyValidator = [
  body('name')
    .isString()
    .withMessage('Product name is required')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .bail()
    .isLength({ max: 100 })
    .withMessage('Product name must be 100 characters or fewer'),

  body('description')
    .isString()
    .withMessage('Description is required')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .bail()
    .isLength({ max: 1000 })
    .withMessage('Description must be 1000 characters or fewer'),

  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .bail()
    .isIn(PRODUCT_CATEGORIES)
    .withMessage(`Category must be one of: ${PRODUCT_CATEGORIES.join(', ')}`),

  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .bail()
    .isFloat({ gt: 0, max: 10000000 })
    .withMessage('Price must be a positive number')
    .bail()
    .toFloat(),

  body('stock')
    .notEmpty()
    .withMessage('Stock is required')
    .bail()
    .isInt({ min: 0, max: 1000000 })
    .withMessage('Stock must be a whole number of 0 or more')
    .bail()
    .toInt(),

  // Optional: missing, null or "" all mean "no image".
  body('image')
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('Image URL must be text')
    .bail()
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Image must be a valid http(s) URL'),
];

export const productListValidator = [
  query('search')
    .optional()
    .isString()
    .withMessage('Search must be text')
    .bail()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search must be 100 characters or fewer'),

  query('category')
    .optional()
    .isIn(PRODUCT_CATEGORIES)
    .withMessage('Invalid category'),
];
