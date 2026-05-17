import express from 'express';
import {
    registerUser,
    loginUser,
    forgotPassword,
    resetPassword,
    getUserById,
    changePassword
} from '../controllers/auth.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);                 // instant login (email + password)
router.post('/forgot-password', forgotPassword);   // sends OTP for reset
router.post('/reset-password', resetPassword);     // uses OTP to reset
router.get('/user/:userId', verifyToken, getUserById);
router.post('/change-password', verifyToken, changePassword);

export default router;