import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        maxlength: [100, 'Product name cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Product description is required'],
        trim: true,
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    price: {
        type: Number,
        required: [true, 'Product price is required'],
        min: [0, 'Price must be at least 0']
    },
    images: {
        type: [String],
        required: [true, 'At least one product image is required'],
        validate: {
            validator: function(v) {
                return v.length > 0 && v.length <= 5;
            },
            message: 'Product must have between 1 and 5 images'
        }
    },
    category: {
        type: String,
        required: [true, 'Product category is required'],
        enum: {
            values: ["Electronics", "Clothing", "Home", "Beauty", "Sports", "Other"],
            message: 'Please select a valid category'
        },
        index: true
    },
    bestseller: {
        type: Boolean,
        default: false,
        index: true
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: [true, 'Company reference is required'],
        index: true
    },
    stock: {
        type: Number,
        required: [true, 'Stock quantity is required'],
        default: 0,
        min: [0, 'Stock cannot be negative']
    },
    rating: {
        type: Number,
        default: 0,
        min: [0, 'Rating must be at least 0'],
        max: [5, 'Rating cannot exceed 5']
    },
    numReviews: {
        type: Number,
        default: 0
    },
    discount: {
        type: Number,
        default: 0,
        min: [0, 'Discount cannot be negative'],
        max: [100, 'Discount cannot exceed 100%']
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

productSchema.virtual('discountedPrice').get(function() {
    return this.price * (1 - (this.discount / 100));
});

productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ companyId: 1, bestseller: 1 });
productSchema.index({ category: 1, rating: -1 });

const Product = mongoose.model('Product', productSchema);
export default Product;