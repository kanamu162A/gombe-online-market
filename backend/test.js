import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const secret = process.env.JWT_SECRET || "secretkey";
const token = jwt.sign(
  { id: "5", email: "muabubakar715@gmail.com", role: "user" },
  secret,
  { expiresIn: "1d" }
);
console.log("New token:", token);