import dotenv from "dotenv";
import pkg from "pg";

// Load environment variables
dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST,           
  port: parseInt(process.env.DB_PORT), 
  database: process.env.DB_NAME,       
  user: process.env.DB_USER,           
  password: process.env.DB_PASSWORD,   
  ssl: {
    rejectUnauthorized: false,
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Test connection on startup
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as time, current_database() as db_name');
    console.log("✅ Database connected successfully!");
    console.log("📍 Database:", result.rows[0].db_name);
    console.log("📍 Time:", result.rows[0].time);
    client.release();
    return true;
  } catch (err) {
    console.error("❌ Database connection error:", err.message);
    console.error("📋 Check your .env file credentials");
    return false;
  }
};

testConnection();

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

export default pool;