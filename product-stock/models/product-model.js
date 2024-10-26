import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  id: Number,
  name: String,
  description: String,
  image: String,
  category: String,
  new_price: Number,
  old_price: Number,
  available: Boolean,
  date: Date,
  stock: Number,
});

const Product = mongoose.model('Product', productSchema);

export default Product;
