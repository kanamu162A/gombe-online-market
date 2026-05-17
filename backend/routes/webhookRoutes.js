import express from 'express';
import { creditWalletAfterPayment } from '../controllers/wallet.controller.js';

const router = express.Router();

// Paystack webhook – no extra controller needed
router.post('/paystack', 
    express.raw({ type: 'application/json' }), 
    async (req, res) => {
        const event = req.body;
        if (event.event === 'charge.success') {
            const paystackRef = event.data.reference;
            const amountPaid = event.data.amount / 100;
            const result = await creditWalletAfterPayment(paystackRef, amountPaid);
            if (!result.success) {
                console.error('Webhook failed:', result.message);
            }
        }
        res.sendStatus(200);
    }
);

export default router;