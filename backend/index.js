import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
//import rateLimit from 'express-rate-limit';
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from './routes/auth.routes.js';
import walletRoutes from './routes/wallet.routes.js';
import webhookRoutes from './routes/webhookRoutes.js';           
import dashboardRoutes from './routes/dashboard.routes.js';
import productRoutes from './routes/product.routes.js';

// Load environment variables FIRST
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.join(__dirname, "../frontend");

app.use(helmet({
    contentSecurityPolicy: false, 
}));
app.use(cors());
app.use(express.json());
app.use(express.static(frontendPath));

// Apply rate limiting

// Routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/webhook', webhookRoutes);

// Public HTML routes
app.get("/", (req, res) => {
    res.sendFile(path.join(frontendPath, "home.html"));
});
app.get("/login", (req, res) => {
    res.sendFile(path.join(frontendPath, "login.html"));
});
app.get("/register", (req, res) => {
    res.sendFile(path.join(frontendPath, "register.html"));
});
app.get("/dashboard", (req, res) => {
    res.sendFile(path.join(frontendPath, "dashboard.html"));
});

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        status: 'OK',
        time: new Date(),
        service: 'Gombe Online Market API'
    });
});

// ---------- ERROR HANDLING ----------
// 404 handler – place BEFORE the final error handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Cannot ${req.method} ${req.originalUrl} – endpoint not found`
    });
});

// SINGLE global error handler (replaces both previous ones)
app.use((err, req, res, next) => {
    console.error('🔥 Global error:', err);
    if (err?.stack) console.error(err.stack);

    const status = err?.status || 500;
    // If err is a string, use it; if undefined, fallback
    const message = err?.message || (typeof err === 'string' ? err : 'Internal server error');

    res.status(status).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err?.stack })
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 ${process.env.APP_NAME || 'Gombe Online Market'} backend running`);
    console.log(`📍 Port: ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📍 Database: PostgreSQL (extensions schema)`);
});