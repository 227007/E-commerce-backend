import Cart from "../models/cartModel.js";
import userModel from "../models/userModel.js";

// Add Products To User Cart
const addToCart = async (req, res) => {
    try {
        const { userId, itemId } = req.body;
        
        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId, items: { [itemId]: 1 } });
        } else {
            cart.items[itemId] = (cart.items[itemId] || 0) + 1;
        }

        await cart.save();
        res.json({ success: true, message: "Added To Cart" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Update User Cart
const updateCart = async (req, res) => {
    try {
        const { userId, itemId, quantity } = req.body;
        const cart = await Cart.findOne({ userId });

        if (!cart || !cart.items[itemId]) {
            return res.json({ success: false, message: "Item not found in cart" });
        }
        cart.items[itemId] = quantity;

        await cart.save();
        res.json({ success: true, message: "Cart Updated" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Get User Cart Data
const getUserCart = async (req, res) => {
    try {
        const { userId } = req.body;
        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.json({ success: false, message: "No cart found" });
        }

        res.json({ success: true, cartData: cart.items });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

export { addToCart, updateCart, getUserCart };
