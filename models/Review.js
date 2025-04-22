import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  images: {
    type: [String],
    default: []
  },
  isApproved: {
    type: Boolean,
    default: false
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

reviewSchema.index({ product: 1, user: 1 }, { unique: true });

reviewSchema.post('save', async function (doc) {
  await this.constructor.calculateAverageRating(doc.product);
});

reviewSchema.post('remove', async function (doc) {
  await this.constructor.calculateAverageRating(doc.product);
});

reviewSchema.statics.calculateAverageRating = async function (productId) {
  const stats = await this.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: '$product',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  if (stats.length > 0) {
    await mongoose.model('Product').findByIdAndUpdate(productId, {
      rating: stats[0].avgRating,
      numReviews: stats[0].nRating
    });
  } else {
    await mongoose.model('Product').findByIdAndUpdate(productId, {
      rating: 0,
      numReviews: 0
    });
  }
};

const Review = mongoose.model('Review', reviewSchema);
export default Review;