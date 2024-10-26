import mongoose from 'mongoose';
import Product from '../models/product-model.js';

const mongoUri = process.env.MONGO_URL || 'mongodb://localhost:27017';
connectToDatabase();

async function connectToDatabase() {
   await mongoose.connect(`${mongoUri}/thecollegestore?`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log('Connected to MongoDB');
}

export async function findOutOfStockProducts() {
  return Product.find({ stock: 0 });
}

export async function updateProductAvailability(products) {
  const updatePromises = products.map(product => {
    if (product.available) {
      product.available = false;
      return product.save();
    }
    return Promise.resolve();
  });
  return Promise.all(updatePromises);
}
