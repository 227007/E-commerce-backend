import asyncHandler from 'express-async-handler';
import Product from '../models/Product.js';

// Get user cart
const getCart = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('cartData');
    if (!user.cartData || Object.keys(user.cartData).length === 0) {
        return res.json({ items: [], total: 0 });
    }

    const cartItems = await Promise.all(
        Object.entries(user.cartData).map(async ([productId, quantity]) => {
            const product = await Product.findById(productId)
                .select('name price images companyId stock');

            if (!product) return null;

            return {
                product: product._id,
                name: product.name,
                price: product.price,
                image: product.images[0],
                quantity,
                stock: product.stock,
                company: product.companyId
            };
        })
    );

    const validItems = cartItems.filter(item => item !== null);
    const total = validItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    res.json({
        items: validItems,
        total: parseFloat(total.toFixed(2))
    });
});

// Add item to cart

const addToCart = asyncHandler(async (req, res) => {
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }

    if (product.stock < quantity) {
        res.status(400);
        throw new Error('Not enough stock available');
    }

    const user = await User.findById(req.user._id);
    user.cartData = user.cartData || {};

    const currentQty = user.cartData[productId] || 0;
    user.cartData[productId] = currentQty + quantity;

    await user.save();

    res.json({ message: 'Product added to cart', cart: user.cartData });
});

// Update cart item quantity

const updateCartItem = asyncHandler(async (req, res) => {
    const { quantity } = req.body;
    const { productId } = req.params;

    if (quantity <= 0) {
        res.status(400);
        throw new Error('Quantity must be greater than zero');
    }

    const product = await Product.findById(productId);
    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }

    if (product.stock < quantity) {
        res.status(400);
        throw new Error('Not enough stock available');
    }

    const user = await User.findById(req.user._id);
    if (!user.cartData || !user.cartData[productId]) {
        res.status(404);
        throw new Error('Product not found in cart');
    }

    user.cartData[productId] = quantity;
    await user.save();

    res.json({ message: 'Cart updated', cart: user.cartData });
});

// Remove item from cart

const removeFromCart = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user.cartData || !user.cartData[req.params.productId]) {
        res.status(404);
        throw new Error('Product not found in cart');
    }

    delete user.cartData[req.params.productId];
    await user.save();

    res.json({ message: 'Product removed from cart', cart: user.cartData });
});

// Clear cart

const clearCart = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    user.cartData = {};
    await user.save();

    res.json({ message: 'Cart cleared' });
});

export {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
};