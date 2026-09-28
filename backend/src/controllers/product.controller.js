import { matchedData } from 'express-validator';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';

// matchedData() returns only fields that passed validation, so extra fields
// sent by a client (e.g. "_id" or "createdAt") are never written to the database.
function getProductFields(req) {
  const data = matchedData(req, { locations: ['body'] });

  return {
    name: data.name,
    description: data.description,
    price: data.price,
    stock: data.stock,
    category: data.category,
    image: data.image || '',
  };
}

async function findProductOrFail(id) {
  const product = await Product.findById(id);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }
  return product;
}

// Search input is used inside a regular expression, so special characters
// like "." or "(" must be escaped to be matched literally.
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function getProducts(req, res) {
  const { search, category } = matchedData(req, { locations: ['query'] });
  const filter = {};

  if (search) {
    const searchPattern = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: searchPattern }, { description: searchPattern }];
  }

  if (category) {
    filter.category = category;
  }

  const products = await Product.find(filter).sort({ createdAt: -1 });
  res.json({ products });
}

export async function getProductById(req, res) {
  const product = await findProductOrFail(req.params.id);
  res.json({ product });
}

export async function createProduct(req, res) {
  const product = await Product.create(getProductFields(req));
  res.status(201).json({ message: 'Product created', product });
}

export async function updateProduct(req, res) {
  const product = await findProductOrFail(req.params.id);

  product.set(getProductFields(req));
  await product.save();

  res.json({ message: 'Product updated', product });
}

export async function deleteProduct(req, res) {
  const product = await findProductOrFail(req.params.id);
  await product.deleteOne();

  res.json({ message: 'Product deleted', product });
}
