import { v2 as cloudinary } from "cloudinary";
import productModel from "../models/productModel.js";

// Function to add a product
const addProduct = async (req, res) => {
    try {
        const productData = {
            name,
            description,
            category,
            price: Number(price),
            bestseller: bestseller === "true",
            image: imagesUrl,
            companyId: req.user._id,
            date: Date.now()
        };

        const product = new productModel(productData);
        await product.save();
        console.log("Product saved to DB:", savedProduct); 

        res.status(201).json({
            success: true,
            message: "Product Added",
            product: savedProduct
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Function to list all products
const listProduct = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const products = await productModel.find({}).skip(skip).limit(limit);
        const total = await productModel.countDocuments();

        res.json({
            success: true,
            products,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
}

// Function to remove a product
const removeProduct = async (req, res) => {
    try {
        await productModel.findByIdAndDelete(req.body.id);
        res.json({ success: true, message: "Product Removed" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Function to get a single product's details
const SingleProduct = async (req, res) => {
    try {
        const { productId } = req.body;
        const product = await productModel.findById(productId);
        res.json({ success: true, product });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Function to update a product
const updateProduct = async (req, res) => {
    try {
        const { productId, name, description, price, category, bestseller } = req.body;
        const product = await productModel.findById(productId);

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Update the product details
        product.name = name || product.name;
        product.description = description || product.description;
        product.price = price ? Number(price) : product.price;
        product.category = category || product.category;
        product.bestseller = bestseller !== undefined ? bestseller === "true" : product.bestseller;

        const images = req.files ? [req.files.image1, req.files.image2, req.files.image3, req.files.image4].filter(Boolean) : [];
        if (images.length > 0) {
            let imagesUrl = await Promise.all(
                images.map(async (item) => {
                    let result = await cloudinary.uploader.upload(item[0].path, { resource_type: 'image' });
                    return result.secure_url;
                })
            );
            product.image = imagesUrl;
        }
        await product.save();

        res.json({ success: true, message: "Product updated successfully" });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Function to get products by company
const productsByCompany = async (req, res) => {
    try {
        const { companyId } = req.params;
        const products = await productModel.find({ companyId });

        if (products.length === 0) {
            return res.status(404).json({ success: false, message: "No products found for this company" });
        }

        res.json({ success: true, products });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export { listProduct, addProduct, removeProduct, SingleProduct, updateProduct, productsByCompany };
