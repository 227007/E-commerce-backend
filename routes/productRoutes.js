import express from 'express';
import { 
    createProduct, 
    getProducts, 
    getProductById, 
    updateProduct, 
    deleteProduct,
    advancedProductSearch
} from '../controllers/productController.js';
import { protect, companyAdmin } from '../middleware/auth.js';
import { uploadMultiple } from '../utils/upload.js';

const router = express.Router();

router.route('/')
    .get(getProducts)
    .post(protect, companyAdmin, uploadMultiple('images', 5), createProduct);

router.route('/search').get(advancedProductSearch);

router.route('/:id')
    .get(getProductById)
    .put(protect, companyAdmin, uploadMultiple('images', 5), updateProduct)
    .delete(protect, companyAdmin, deleteProduct);

export default router;