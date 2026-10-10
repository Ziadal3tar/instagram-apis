import cloudinary from 'cloudinary';
import env from '../config/env.js';

cloudinary.v2.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
  secure: true,
});

export default cloudinary.v2;
