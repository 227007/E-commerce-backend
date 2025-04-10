import express from 'express';
import { listProduct, addProduct, removeProduct, SingleProduct, updateProduct, productsByCompany } from '../controllers/productController.js';
import upload from '../middleware/multer.js';
import adminAuth from '../middleware/adminAuth.js';
import companyAuth from '../middleware/companyAuth.js';

const productRouter = express.Router();

productRouter.post('/add', adminAuth, upload.fields([{ name: 'image1', maxCount: 1 }, { name: 'image2', maxCount: 1 }, { name: 'image3', maxCount: 1 }, { name: 'image4', maxCount: 1 }]), addProduct);
productRouter.post('/remove', adminAuth, removeProduct);
productRouter.post('/single', SingleProduct);
productRouter.get('/list', listProduct);
productRouter.put('/update', adminAuth, upload.fields([{ name: 'image1', maxCount: 1 }, { name: 'image2', maxCount: 1 }, { name: 'image3', maxCount: 1 }, { name: 'image4', maxCount: 1 }]), updateProduct);
productRouter.get('/company/:companyId', productsByCompany);

export default productRouter;
