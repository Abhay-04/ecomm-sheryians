// Optional: fills an empty catalog with sample products so the UI has
// something to show. Run with `npm run seed`. Existing products are never touched.
import mongoose from 'mongoose';
import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { Product } from './models/Product.js';

const unsplash = (photoId) =>
  `https://images.unsplash.com/photo-${photoId}?w=800&q=80&auto=format&fit=crop`;

const sampleProducts = [
  {
    name: 'Wireless Over-Ear Headphones',
    description: 'Closed-back headphones with active noise cancellation and 30-hour battery life.',
    price: 7999,
    stock: 25,
    category: 'Electronics',
    image: unsplash('1505740420928-5e560c06d30e'),
  },
  {
    name: 'Minimal Smartwatch',
    description: 'Lightweight aluminium case, heart-rate tracking and a soft silicone strap.',
    price: 12499,
    stock: 4,
    category: 'Electronics',
    image: unsplash('1523275335684-37898b6baf30'),
  },
  {
    name: 'Instant Film Camera',
    description: 'Point-and-shoot instant camera with a built-in flash and self-timer.',
    price: 8999,
    stock: 0,
    category: 'Electronics',
    image: unsplash('1526170375885-4d8ecf77b99f'),
  },
  {
    name: 'Portable Bluetooth Speaker',
    description: 'Waterproof speaker with deep bass and up to 20 hours of playback.',
    price: 5499,
    stock: 38,
    category: 'Electronics',
    image: unsplash('1608043152269-423dbba4e7e1'),
  },
  {
    name: 'Round Metal Sunglasses',
    description: 'Thin gold-tone frame with polarised green lenses and UV400 protection.',
    price: 2499,
    stock: 60,
    category: 'Accessories',
    image: unsplash('1511499767150-a48a237f0083'),
  },
  {
    name: 'Everyday Canvas Backpack',
    description: 'Water-resistant 20L backpack with a padded 15" laptop sleeve.',
    price: 3299,
    stock: 7,
    category: 'Accessories',
    image: unsplash('1553062407-98eeb64c6a62'),
  },
  {
    name: 'Essential Cotton T-Shirt',
    description: 'Heavyweight 100% organic cotton tee with a relaxed fit.',
    price: 999,
    stock: 120,
    category: 'Clothing',
    image: unsplash('1618354691373-d851c5c3a990'),
  },
  {
    name: 'Lightweight Running Shoes',
    description: 'Breathable knit upper with a responsive foam midsole for daily runs.',
    price: 5999,
    stock: 15,
    category: 'Sports',
    image: unsplash('1491553895911-0055eca6402d'),
  },
  {
    name: 'Stoneware Coffee Mug',
    description: 'Hand-glazed 350ml mug. Dishwasher and microwave safe.',
    price: 649,
    stock: 3,
    category: 'Home & Kitchen',
    image: unsplash('1514228742587-6b1558fcca3d'),
  },
  {
    name: 'Recycled Kraft Tote',
    description: 'Sturdy reusable tote made from recycled kraft paper fibre.',
    price: 499,
    stock: 80,
    category: 'Accessories',
    image: unsplash('1544816155-12df9643f363'),
  },
];

try {
  await connectDatabase(env.mongoUri);

  const existingCount = await Product.countDocuments();
  if (existingCount > 0) {
    console.log(`Skipped: the catalog already has ${existingCount} products.`);
  } else {
    await Product.insertMany(sampleProducts);
    console.log(`Inserted ${sampleProducts.length} sample products.`);
  }
} catch (error) {
  console.error('Seeding failed:', error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
