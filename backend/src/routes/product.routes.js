import { Router } from 'express';
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  updateProduct,
} from '../controllers/product.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import {
  productBodyValidator,
  productIdValidator,
  productListValidator,
} from '../validators/product.validators.js';

const router = Router();

router.get('/', productListValidator, validate, getProducts);
router.get('/:id', productIdValidator, validate, getProductById);

router.post('/', authenticate, productBodyValidator, validate, createProduct);
router.put(
  '/:id',
  authenticate,
  productIdValidator,
  productBodyValidator,
  validate,
  updateProduct
);
router.delete('/:id', authenticate, productIdValidator, validate, deleteProduct);

export default router;
