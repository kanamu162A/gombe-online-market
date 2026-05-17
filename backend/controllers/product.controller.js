import cloudinary from '../config/cloudinary.js';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PRODUCTS_FILE = path.join(__dirname, '../data/products.json');
const USERS_FILE = path.join(__dirname, '../data/users.json');

// Ensure data folder & product file exist
if (!fs.existsSync(path.dirname(PRODUCTS_FILE))) {
  fs.mkdirSync(path.dirname(PRODUCTS_FILE), { recursive: true });
}
if (!fs.existsSync(PRODUCTS_FILE)) {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify([]));
}
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([]));
}

/* ======================================================
   MULTER CONFIG
====================================================== */
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error('Only JPG, PNG, and WEBP images are allowed'), false);
  }
  cb(null, true);
};
export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 8 },
  fileFilter
});

/* ======================================================
   HELPERS
====================================================== */
const readProducts = () => {
  try {
    const data = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
};

const writeProducts = (products) => {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
};

const readUsers = () => {
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
};

const sendError = (res, code, message) => {
  return res.status(code).json({ success: false, message });
};

const validateProduct = (data, isUpdate = false) => {
  const errors = [];
  if (!isUpdate || data.name !== undefined) {
    const name = data.name?.trim();
    if (!name) errors.push('Product name is required');
    else if (name.length < 3 || name.length > 120) errors.push('Name must be 3-120 characters');
  }
  if (!isUpdate || data.price !== undefined) {
    const price = parseFloat(data.price);
    if (isNaN(price) || price < 0) errors.push('Valid price (>=0) is required');
  }
  if (!isUpdate || data.stock !== undefined) {
    const stock = parseInt(data.stock);
    if (isNaN(stock) || stock < 0) errors.push('Stock must be >= 0');
  }
  if (!isUpdate || data.category !== undefined) {
    const category = data.category?.trim();
    if (category && category.length > 50) errors.push('Category max 50 characters');
  }
  return errors;
};

// Attach seller details (name, email) to a product
const attachSellerDetails = (product) => {
  if (!product?.seller_id) return { ...product, seller: null };
  const users = readUsers();
  const seller = users.find(u => String(u.id) === String(product.seller_id));
  return {
    ...product,
    seller: seller ? {
      id: seller.id,
      name: seller.name || seller.username || 'Unknown',
      email: seller.email || ''
    } : null
  };
};

// Attach seller details to an array of products
const attachSellerToProducts = (products) => {
  const users = readUsers();
  const userMap = new Map(users.map(u => [String(u.id), u]));
  return products.map(product => ({
    ...product,
    seller: userMap.get(String(product.seller_id)) ? {
      id: userMap.get(String(product.seller_id)).id,
      name: userMap.get(String(product.seller_id)).name || userMap.get(String(product.seller_id)).username || 'Unknown',
      email: userMap.get(String(product.seller_id)).email || ''
    } : null
  }));
};

// Cloudinary upload
const uploadImagesToCloudinary = async (files, sellerId) => {
  const results = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const base64 = file.buffer.toString('base64');
    const dataURI = `data:${file.mimetype};base64,${base64}`;
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: `products/${sellerId}`,
      resource_type: 'image',
      type: 'upload',
      public_id: `product_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 6)}`
    });
    results.push({ url: result.secure_url, public_id: result.public_id });
  }
  return results;
};

const deleteImagesFromCloudinary = async (images) => {
  for (const image of images) {
    if (image.public_id) {
      try {
        await cloudinary.uploader.destroy(image.public_id);
      } catch (err) {
        console.error(`Failed to delete ${image.public_id}:`, err);
      }
    }
  }
};

// ✅ FIXED: strict string comparison for ownership
const isOwner = (product, userId) => {
  return String(product.seller_id) === String(userId);
};

/* ======================================================
   CONTROLLERS
====================================================== */

// GET /api/products (public)
export const getAllProducts = async (req, res, next) => {
  try {
    let products = readProducts();
    products = products.filter(p => p.stock > 0);
    const productsWithSeller = attachSellerToProducts(products);

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const start = (page - 1) * limit;
    const paginated = productsWithSeller.slice(start, start + limit);

    res.status(200).json({
      success: true,
      count: products.length,
      page,
      limit,
      totalPages: Math.ceil(products.length / limit),
      data: paginated
    });
  } catch (error) {
    next(error);
  }
};

// ✅ FIXED: getMyProducts with proper filtering
export const getMyProducts = async (req, res, next) => {
  try {
    const sellerId = String(req.user.id); // ensure string
    let products = readProducts();
    
    // Filter products owned by this seller
    let myProducts = products.filter(p => isOwner(p, sellerId));
    
    const myProductsWithSeller = attachSellerToProducts(myProducts);

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const start = (page - 1) * limit;
    const paginated = myProductsWithSeller.slice(start, start + limit);

    res.status(200).json({
      success: true,
      count: myProducts.length,
      page,
      limit,
      totalPages: Math.ceil(myProducts.length / limit),
      data: paginated
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/:id (public)
export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const products = readProducts();
    const product = products.find(p => p.id === id);
    if (!product) return sendError(res, 404, 'Product not found');
    const productWithSeller = attachSellerDetails(product);
    res.status(200).json({ success: true, data: productWithSeller });
  } catch (error) {
    next(error);
  }
};

// ✅ FIXED: createProduct ensures seller_id is string
export const createProduct = [
  upload.array('images', 8),
  async (req, res, next) => {
    try {
      const sellerId = String(req.user.id); // unified as string
      const { name, price, stock = 1, category = 'General', description = '' } = req.body;

      const errors = validateProduct({ name, price, stock, category });
      if (errors.length) return sendError(res, 400, errors.join(', '));
      if (!req.files || req.files.length === 0) return sendError(res, 400, 'At least one image required');
      if (req.files.length > 8) return sendError(res, 400, 'Max 8 images');

      const uploadedImages = await uploadImagesToCloudinary(req.files, sellerId);
      const products = readProducts();

      const newProduct = {
        id: Date.now().toString(),
        seller_id: sellerId,  // already string
        name: name.trim(),
        price: parseFloat(price),
        stock: parseInt(stock),
        category: category.trim(),
        description: description.trim(),
        images: uploadedImages,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      products.push(newProduct);
      writeProducts(products);

      const productWithSeller = attachSellerDetails(newProduct);
      res.status(201).json({ success: true, message: 'Product created', data: productWithSeller });
    } catch (error) {
      console.error('Create error:', error);
      next(error);
    }
  }
];

// UPDATE product
export const updateProduct = [
  upload.array('images', 8),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const sellerId = String(req.user.id);
      const replaceImages = req.query.replaceImages === 'true';

      let products = readProducts();
      const index = products.findIndex(p => p.id === id && isOwner(p, sellerId));
      if (index === -1) return sendError(res, 404, 'Product not found or unauthorized');

      const product = products[index];
      const oldImages = [...product.images];

      if (req.body.name) product.name = req.body.name.trim();
      if (req.body.price) product.price = parseFloat(req.body.price);
      if (req.body.stock) product.stock = parseInt(req.body.stock);
      if (req.body.category) product.category = req.body.category.trim();
      if (req.body.description) product.description = req.body.description.trim();

      if (req.files && req.files.length > 0) {
        const newImages = await uploadImagesToCloudinary(req.files, sellerId);
        if (replaceImages) {
          product.images = newImages;
          await deleteImagesFromCloudinary(oldImages);
        } else {
          product.images = [...oldImages, ...newImages];
        }
      }

      product.updated_at = new Date().toISOString();
      products[index] = product;
      writeProducts(products);

      const updatedWithSeller = attachSellerDetails(product);
      res.status(200).json({ success: true, message: 'Product updated', data: updatedWithSeller });
    } catch (error) {
      console.error('Update error:', error);
      next(error);
    }
  }
];

// DELETE single image
export const deleteProductImage = async (req, res, next) => {
  try {
    const { id, imageIndex } = req.params;
    const sellerId = String(req.user.id);
    let products = readProducts();

    const index = products.findIndex(p => p.id === id && isOwner(p, sellerId));
    if (index === -1) return sendError(res, 404, 'Product not found or unauthorized');

    const product = products[index];
    const idx = parseInt(imageIndex);
    if (isNaN(idx) || idx < 0 || idx >= product.images.length) {
      return sendError(res, 400, 'Invalid image index');
    }

    const imageToDelete = product.images[idx];
    await deleteImagesFromCloudinary([imageToDelete]);
    product.images.splice(idx, 1);
    products[index] = product;
    writeProducts(products);

    res.status(200).json({ success: true, message: 'Image deleted', images: product.images });
  } catch (error) {
    next(error);
  }
};

// DELETE whole product
export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sellerId = String(req.user.id);
    let products = readProducts();

    const index = products.findIndex(p => p.id === id && isOwner(p, sellerId));
    if (index === -1) return sendError(res, 404, 'Product not found or unauthorized');

    const product = products[index];
    if (product.images?.length) await deleteImagesFromCloudinary(product.images);
    products.splice(index, 1);
    writeProducts(products);

    res.status(200).json({ success: true, message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
};