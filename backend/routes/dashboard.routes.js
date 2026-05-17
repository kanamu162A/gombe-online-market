import express from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import {
    getDashboardStats,
    getUserOrders,
    getUserTransactions,
    getSellerProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    getKycStatus,
    submitKyc,
    updateProfile
} from '../controllers/dashboard.controller.js';

const router = express.Router();

router.use(verifyToken);

// Dashboard overview
router.get('/stats', getDashboardStats);
router.get('/orders', getUserOrders);
router.get('/transactions', getUserTransactions);

// Products (upload, manage)
router.get('/products', getSellerProducts);
router.post('/products', addProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

// KYC & Profile
router.get('/kyc', getKycStatus);
router.post('/kyc', submitKyc);
router.put('/profile', updateProfile);

export default router;