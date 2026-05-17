import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import {
  getMyProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteProductImage,
  getAllProducts,
  getProductById
} from '../controllers/product.controller.js';

const router = Router();

// Public routes
router.get('/', getAllProducts);

// ✅ Specific routes must come BEFORE parameterised routes
router.get('/my', verifyToken, getMyProducts);   // moved up

// Parameterised route (catch-all) must come LAST
router.get('/:id', getProductById);

// Authenticated routes
router.post('/', verifyToken, createProduct);
router.put('/:id', verifyToken, updateProduct);
router.delete('/:id', verifyToken, deleteProduct);
router.delete('/:id/image/:imageIndex', verifyToken, deleteProductImage);

export default router;