import express from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import {
    getWalletBalance,
    initiateDeposit,
    getWalletTransactions
} from '../controllers/wallet.controller.js';

const router = express.Router();

// All wallet routes require authentication
router.get('/balance', verifyToken, getWalletBalance);
router.post('/deposit', verifyToken, initiateDeposit);
router.get('/transactions', verifyToken, getWalletTransactions);

export default router;