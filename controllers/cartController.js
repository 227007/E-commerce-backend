import Cart from "../models/cartModel.js";

const MAX_QUANTITY = 10;

// Add Products To User Cart
const addToCart = async (req, res) => {
    try {
        const { userId, itemId, quantity = 1 } = req.body;

        if (quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: "The quantity must be a positive number"
            });
        }

        let cart = await Cart.findOne({ userId });

        if (!cart) {
            cart = new Cart({
                userId,
                items: { [itemId]: quantity }
            });
        } else {

            const newQuantity = (cart.items[itemId] || 0) + quantity;

            if (newQuantity > MAX_QUANTITY) {
                return res.status(400).json({
                    success: false,
                    message: `${MAX_QUANTITY} `
                });
            }

            cart.items[itemId] = newQuantity;
        }

        await cart.save();
        res.json({
            success: true,
            message: "The product has been added to the cart successfully"
        });

    } catch (error) {
        console.error("Error adding product to cart:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while adding the product to the cart"
        });
    }
}

// Update User Cart
const updateCart = async (req, res) => {
    try {
        const { userId, itemId, quantity } = req.body;

        if (quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: " The quantity must be a positive number"
            });
        }

        if (quantity > MAX_QUANTITY) {
            return res.status(400).json({
                success: false,
                message: `${MAX_QUANTITY} `
            });
        }

        const cart = await Cart.findOne({ userId });

        if (!cart || !cart.items[itemId]) {
            return res.status(404).json({
                success: false,
                message: "The product is not in the cart"
            });
        }

        cart.items[itemId] = quantity;
        await cart.save();

        res.json({
            success: true,
            message: "The cart was updated successfully"
        });

    } catch (error) {
        console.error("Error updating cart:", error);
        res.status(500).json({
            success: false,
            message: "Error updating cart"
        });
    }
}

// Get User Cart Data
const getUserCart = async (req, res) => {
    try {
        const { userId } = req.body;
        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.json({
                success: true,
                cartData: {},
                message: "The basket is empty"
            });
        }

        res.json({
            success: true,
            cartData: cart.items,
            message: "Basket data fetched successfully"
        });

    } catch (error) {
        console.error("Error fetching basket data:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching basket data:"
        });
    }
}

export { addToCart, updateCart, getUserCart };