import express from 'express'
import { listProduct, addProduct, removeProduct, SingleProduct } from '../controllers/productController.js'
import upload from '../middleware/multer.js';
import adminAuth from '../middleware/adminAuth.js';
import companyAuth from '../middleware/companyAuth.js';

const productRouter = express.Router();

productRouter.post('/add', adminAuth, upload.fields([{ name: 'image1', maxCount: 1 }, { name: 'image2', maxCount: 1 }, { name: 'image3', maxCount: 1 }, { name: 'image4', maxCount: 1 }]), addProduct);
productRouter.post('/remove', adminAuth, removeProduct);
productRouter.post('/single', SingleProduct);
productRouter.get('/list', listProduct);
productRouterrouter.post("/products", auth, companyAuth, productController.addProduct);

export default productRouter