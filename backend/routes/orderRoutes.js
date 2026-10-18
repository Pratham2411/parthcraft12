const router = require('express').Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const SiteSettings = require('../models/SiteSettings');
const auth = require('../middleware/auth');
const { createUpload } = require('../middleware/multerUpload');
const { uploadFile } = require('../utils/imageStorage');
const rateLimit = require('express-rate-limit');

const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many orders. Please try again later.' },
});

const uploadScreenshot = createUpload(1, 5).single('screenshot');

// ── Helpers ──

const buildWhatsAppUrl = (phone, message) => {
  if (!phone) return '';
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};

const buildOrderWhatsAppMessage = (order) => {
  const items = order.items.map((i) => `• ${i.title} × ${i.quantity} = ₹${i.price * i.quantity}`).join('\n');
  return `Hi! I've placed order *${order.orderRef}* on ParthCraft12.\n\n` +
    `${items}\n\n` +
    `Total: ₹${order.totalAmount}\n\n` +
    `I'll be attaching the payment screenshot shortly. Please confirm!`;
};

// ── POST /api/orders — Create order ──

router.post('/', auth, orderLimiter, async (req, res) => {
  try {
    const { items, customerName, customerPhone, customerEmail, deliveryAddress, deliveryCity, deliveryPincode, orderNotes, variant } = req.body;

    if (!items?.length) return res.status(400).json({ message: 'At least one item is required' });
    if (!customerName?.trim()) return res.status(400).json({ message: 'Name is required' });
    if (!customerPhone?.trim()) return res.status(400).json({ message: 'Phone number is required' });

    const settings = await SiteSettings.getSettings();
    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(400).json({ message: `Product not found: ${item.productId}` });
      if (!product.published || product.status !== 'available') {
        return res.status(400).json({ message: `${product.title} is not available` });
      }
      if (product.stockCount !== -1 && product.stockCount < (item.quantity || 1)) {
        return res.status(400).json({ message: `${product.title} has insufficient stock` });
      }

      const qty = Math.max(1, Math.min(10, Number(item.quantity) || 1));
      orderItems.push({
        product: product._id,
        title: product.title,
        price: product.price,
        quantity: qty,
        variant: item.variant || variant || '',
        imageUrl: product.imageUrl || '',
      });
      subtotal += product.price * qty;
    }

    const shippingCharge = (settings.freeShippingAbove > 0 && subtotal >= settings.freeShippingAbove)
      ? 0
      : settings.shippingCharge || 0;
    const totalAmount = subtotal + shippingCharge;

    const orderRef = Order.generateOrderRef();

    const order = await Order.create({
      orderRef,
      customer: req.user.id,
      items: orderItems,
      subtotal,
      shippingCharge,
      totalAmount,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail?.trim() || req.user.email || '',
      deliveryAddress: deliveryAddress?.trim() || '',
      deliveryCity: deliveryCity?.trim() || '',
      deliveryPincode: deliveryPincode?.trim() || '',
      orderNotes: orderNotes?.trim() || '',
      status: 'awaiting_payment',
      statusHistory: [{ status: 'awaiting_payment', changedBy: req.user.id }],
    });

    // Build WhatsApp URL
    const whatsappUrl = buildWhatsAppUrl(settings.whatsappNumber, buildOrderWhatsAppMessage(order));

    res.status(201).json({
      order,
      whatsappUrl,
      paymentInstructions: settings.paymentInstructions,
      upiQrImageUrl: settings.upiQrImageUrl,
    });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ message: 'Failed to create order' });
  }
});

// ── GET /api/orders/my — Customer's orders ──

router.get('/my', auth, async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// ── GET /api/orders/:id — Order detail ──

router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (String(order.customer) !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const settings = await SiteSettings.getSettings();
    const whatsappUrl = buildWhatsAppUrl(settings.whatsappNumber, buildOrderWhatsAppMessage(order));

    res.json({ order, whatsappUrl });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch order' });
  }
});

// ── POST /api/orders/:id/screenshot — Upload payment screenshot ──

router.post('/:id/screenshot', auth, uploadScreenshot, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (String(order.customer) !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (!['awaiting_payment', 'awaiting_verification'].includes(order.status)) {
      return res.status(400).json({ message: 'Cannot upload screenshot for this order status' });
    }

    if (!req.file) return res.status(400).json({ message: 'Screenshot image is required' });

    const screenshotUrl = await uploadFile(req.file, 'payment-screenshots');
    order.paymentScreenshotUrl = screenshotUrl;
    order.paymentScreenshotUploadedAt = new Date();
    order.status = 'awaiting_verification';
    order.statusHistory.push({
      status: 'awaiting_verification',
      changedBy: req.user.id,
      note: 'Payment screenshot uploaded',
    });
    await order.save();

    // Send admin notification email
    try {
      const { sendOrderNotificationEmail } = require('../utils/orderEmail');
      const settings = await SiteSettings.getSettings();
      if (settings.adminEmail) {
        await sendOrderNotificationEmail(settings.adminEmail, order);
        order.adminNotifiedAt = new Date();
        await order.save();
      }
    } catch (emailErr) {
      console.error('Failed to send order notification email:', emailErr);
      // Don't fail the request because of email
    }

    res.json({ message: 'Payment screenshot uploaded', order });
  } catch (err) {
    console.error('Upload screenshot error:', err);
    res.status(500).json({ message: 'Failed to upload screenshot' });
  }
});

// ── GET /api/orders/:id/whatsapp — Get WhatsApp link ──

router.get('/:id/whatsapp', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (String(order.customer) !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const settings = await SiteSettings.getSettings();
    const whatsappUrl = buildWhatsAppUrl(settings.whatsappNumber, buildOrderWhatsAppMessage(order));
    res.json({ whatsappUrl });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate WhatsApp link' });
  }
});

module.exports = router;
