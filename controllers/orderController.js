import asyncHandler from 'express-async-handler';
import Order from '../models/Order.js';
import Product from '../models/Product.js';

// Create new order
const createOrder = asyncHandler(async (req, res) => {
    const {
        orderItems,
        shippingAddress,
        paymentMethod
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
        res.status(400);
        throw new Error('No order items');
    }

    let itemsPrice = 0;
    const verifiedItems = await Promise.all(orderItems.map(async item => {
        const product = await Product.findById(item.product);
        if (!product) {
            res.status(404);
            throw new Error(`Product not found: ${item.product}`);
        }

        if (item.company !== product.companyId.toString()) {
            res.status(400);
            throw new Error(`Product ${product.name} does not belong to the selected company`);
        }

        if (product.stock < item.quantity) {
            res.status(400);
            throw new Error(`Not enough stock for ${product.name}`);
        }

        itemsPrice += product.price * item.quantity;

        return {
            product: product._id,
            name: product.name,
            quantity: item.quantity,
            price: product.price,
            image: product.images[0],
            company: product.companyId
        };
    }));

    const taxPrice = itemsPrice * 0.15;
    const shippingPrice = itemsPrice > 100 ? 0 : 10;
    const totalPrice = itemsPrice + taxPrice + shippingPrice;

    const ordersByCompany = {};
    verifiedItems.forEach(item => {
        if (!ordersByCompany[item.company]) {
            ordersByCompany[item.company] = {
                company: item.company,
                items: [],
                itemsPrice: 0
            };
        }
        ordersByCompany[item.company].items.push(item);
        ordersByCompany[item.company].itemsPrice += item.price * item.quantity;
    });

    const createdOrders = await Promise.all(
        Object.values(ordersByCompany).map(async companyOrder => {
            const order = new Order({
                user: req.user._id,
                orderItems: companyOrder.items,
                shippingAddress,
                paymentMethod,
                itemsPrice: companyOrder.itemsPrice,
                taxPrice: companyOrder.itemsPrice * 0.15,
                shippingPrice: companyOrder.itemsPrice > 100 ? 0 : 10,
                totalPrice: companyOrder.itemsPrice * 1.15 + (companyOrder.itemsPrice > 100 ? 0 : 10),
                company: companyOrder.company
            });

            await Promise.all(companyOrder.items.map(async item => {
                await Product.updateOne(
                    { _id: item.product },
                    { $inc: { stock: -item.quantity } }
                );
            }));

            return await order.save();
        })
    );

    res.status(201).json(createdOrders);
});

// Get order by ID
const getOrderById = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate('user', 'username email')
        .populate('company', 'name')
        .populate('orderItems.product', 'name images');

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    if (
        order.user._id.toString() !== req.user._id.toString() &&
        req.user.userType !== 'admin' &&
        (req.user.userType !== 'company' ||
            order.company._id.toString() !== req.user.companyId.toString())
    ) {
        res.status(403);
        throw new Error('Not authorized to view this order');
    }

    res.json(order);
});

// Update order to paid
const updateOrderToPaid = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    if (
        req.user.userType !== 'admin' &&
        (req.user.userType !== 'company' ||
            order.company.toString() !== req.user.companyId.toString())
    ) {
        res.status(403);
        throw new Error('Not authorized to update this order');
    }

    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
        id: req.body.id,
        status: req.body.status,
        update_time: req.body.update_time,
        email_address: req.body.payer.email_address
    };

    const updatedOrder = await order.save();
    res.json(updatedOrder);
});

// Update order status
const updateOrderStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    if (
        req.user.userType !== 'admin' &&
        (req.user.userType !== 'company' ||
            order.company.toString() !== req.user.companyId.toString())
    ) {
        res.status(403);
        throw new Error('Not authorized to update this order');
    }

    order.status = status;
    if (status === 'Delivered') {
        order.isDelivered = true;
        order.deliveredAt = Date.now();
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);
});

// Get logged in user orders
const getMyOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id })
        .populate('company', 'name')
        .sort({ createdAt: -1 });
    res.json(orders);
});

// Get company orders
const getCompanyOrders = asyncHandler(async (req, res) => {
    if (req.user.userType !== 'company') {
        res.status(403);
        throw new Error('Not authorized as a company');
    }

    const { status, page = 1, limit = 10 } = req.query;
    const query = { company: req.user.companyId };
    if (status) query.status = status;

    const orders = await Order.find(query)
        .populate('user', 'username email')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });

    const count = await Order.countDocuments(query);

    res.json({
        orders,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalOrders: count
    });
});

// Get all orders
const getOrders = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, company, status } = req.query;
    const query = {};
    if (company) query.company = company;
    if (status) query.status = status;

    const orders = await Order.find(query)
        .populate('user', 'username email')
        .populate('company', 'name')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });

    const count = await Order.countDocuments(query);

    res.json({
        orders,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalOrders: count
    });
});

// Add note to order
const addOrderNote = asyncHandler(async (req, res) => {
    const { note } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    if (
        req.user.userType !== 'admin' &&
        (req.user.userType !== 'company' ||
            order.company.toString() !== req.user.companyId.toString())
    ) {
        res.status(403);
        throw new Error('Not authorized to add note to this order');
    }

    order.notes = order.notes || [];
    order.notes.push({
        user: req.user._id,
        note,
        isAdminNote: req.user.userType === 'admin'
    });

    const updatedOrder = await order.save();
    res.json(updatedOrder);
});

export {
    createOrder,
    getOrderById,
    updateOrderToPaid,
    updateOrderStatus,
    getMyOrders,
    getCompanyOrders,
    getOrders,
    addOrderNote
};