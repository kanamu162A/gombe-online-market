import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

console.log('CLOUD NAME:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API KEY:', process.env.CLOUDINARY_API_KEY);
console.log(
  'API SECRET:',
  process.env.CLOUDINARY_API_SECRET ? 'FOUND' : 'MISSING'
);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
  api_key: process.env.CLOUDINARY_API_KEY?.trim(),
  api_secret: process.env.CLOUDINARY_API_SECRET?.trim(),
  secure: true
});

export default cloudinary;