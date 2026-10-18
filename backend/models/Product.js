const mongoose = require('mongoose');

const DEFAULT_CATEGORIES = [
  'Paintings', 'Drawings', 'Origami', 'Handmade Cards',
  'Crochet', 'Knitting', 'Pottery', 'Calligraphy',
  'Home Decor', 'Jewelry', 'Gift Items', 'Other'
];

const productSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price:       { type: Number, required: true, min: 0 },
    category:    { type: String, required: true },
    imageUrls:   { type: [String], default: [] },
    imageUrl:    { type: String, default: '' },
    seller:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status:      { type: String, enum: ['available', 'sold', 'unlisted'], default: 'available' },
    isSpam:      { type: Boolean, default: false },

    // Craft shop extensions
    published:       { type: Boolean, default: true },
    featured:        { type: Boolean, default: false },
    madeToOrder:     { type: Boolean, default: false },
    prepTime:        { type: String, default: '' }, // e.g. "3-5 days"
    dimensions:      { type: String, default: '' }, // e.g. "12x16 inches"
    materials:       [{ type: String, trim: true }], // e.g. ["Canvas", "Acrylics"]
    customizationAvailable: { type: Boolean, default: false },
    customizationPrompt:    { type: String, default: '' },
    variants:        [{ type: String, trim: true }], // e.g. ["Small", "Medium", "Large"]
    customization:   { type: String, default: '' }, // Customization info
    stockCount:      { type: Number, default: -1 }, // -1 = unlimited/not tracked
    slug:            { type: String, default: '' },
  },
  { timestamps: true }
);

productSchema.pre('save', function syncPrimaryImage(next) {
  if (this.imageUrls?.length) {
    this.imageUrl = this.imageUrls[0];
  } else {
    this.imageUrl = '';
  }
  // Auto-generate slug from title
  if (this.isModified('title') && this.title) {
    this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  next();
});

productSchema.index({ published: 1, status: 1, createdAt: -1 });
productSchema.index({ featured: 1, published: 1 });
productSchema.index({ category: 1, published: 1 });

module.exports = mongoose.model('Product', productSchema);
module.exports.DEFAULT_CATEGORIES = DEFAULT_CATEGORIES;
