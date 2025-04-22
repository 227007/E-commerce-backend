import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    image: {
        type: String,
        required: true
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    }
});

const shippingAddressSchema = new mongoose.Schema({
    address: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true }
});

const paymentResultSchema = new mongoose.Schema({
    id: String,
    status: String,
    update_time: String,
    email_address: String
});

const orderNoteSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    note: {
        type: String,
        required: true
    },
    isAdminNote: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderItems: [orderItemSchema],
    shippingAddress: shippingAddressSchema,
    paymentMethod: {
        type: String,
        required: true,
        enum: ['COD', 'CreditCard', 'PayPal'],
        default: 'COD'
    },
    paymentResult: paymentResultSchema,
    itemsPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    taxPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    shippingPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    totalPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    isPaid: {
        type: Boolean,
        required: true,
        default: false
    },
    paidAt: {
        type: Date
    },
    isDelivered: {
        type: Boolean,
        required: true,
        default: false
    },
    deliveredAt: {
        type: Date
    },
    status: {
        type: String,
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Pending'
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    notes: [orderNoteSchema]
}, {
    timestamps: true
});

orderSchema.pre('save', async function (next) {
    if (this.isNew) {
        await Promise.all(this.orderItems.map(async item => {
            await mongoose.model('Product').updateOne(
                { _id: item.product },
                { $inc: { stock: -item.quantity } }
            );
        }));
    }
    next();
});

orderSchema.post('findOneAndUpdate', async function (doc) {
    if (doc.status === 'Cancelled' && this._update.status === 'Cancelled') {
        await Promise.all(doc.orderItems.map(async item => {
            await mongoose.model('Product').updateOne(
                { _id: item.product },
                { $inc: { stock: item.quantity } }
            );
        }));
    }
});

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
export default Order;