import dotenv from "dotenv";

dotenv.config();

const config = {
  port: process.env.PORT || 9090,

  db: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
  },

  email: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },

  apiToken: process.env.API_TOKEN,
};

export default config;