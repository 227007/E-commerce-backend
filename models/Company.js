import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    unique: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  logo: {
    type: String,
    default: ''
  },
  website: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    country: String,
    postalCode: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

companySchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'companyId'
});

companySchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Company = mongoose.model('Company', companySchema);
export default Company;