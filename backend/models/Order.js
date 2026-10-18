const mongoose = require('mongoose');
const crypto = require('crypto');

const ORDER_STATUSES = [
  'awaiting_payment',
  'awaiting_verification',
  'payment_confirmed',
  'processing',
  'shipped',
  'delivered',
  'completed',
  'cancelled',
];

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  title: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  variant: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
});

const orderSchema = new mongoose.Schema(
  {
    orderRef: { type: String, unique: true, required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    items: [orderItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    shippingCharge: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },

    // Customer details
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },
    customerEmail: { type: String, default: '', trim: true },
    deliveryAddress: { type: String, default: '', trim: true },
    deliveryCity: { type: String, default: '', trim: true },
    deliveryPincode: { type: String, default: '', trim: true },
    orderNotes: { type: String, default: '', trim: true, maxlength: 500 },

    // Payment evidence
    paymentScreenshotUrl: { type: String, default: '' },
    paymentScreenshotUploadedAt: { type: Date, default: null },

    // Status
    status: { type: String, enum: ORDER_STATUSES, default: 'awaiting_payment' },
    statusHistory: [{
      status: { type: String, enum: ORDER_STATUSES },
      changedAt: { type: Date, default: Date.now },
      changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      note: { type: String, default: '' },
    }],

    // Admin notes
    adminNote: { type: String, default: '' },

    // Tracking
    trackingId: { type: String, default: '' },
    courierName: { type: String, default: '' },

    // Email notification tracking
    adminNotifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ orderRef: 1 });

// Generate unique order reference
orderSchema.statics.generateOrderRef = function () {
  const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `PC-${datePart}-${randomPart}`;
};

module.exports = mongoose.model('Order', orderSchema);
module.exports.ORDER_STATUSES = ORDER_STATUSES;
