const router = require('express').Router();
const User = require('../models/User');
const Product = require('../models/Product');
const Comment = require('../models/Comment');
const Message = require('../models/Message');
const Announcement = require('../models/Announcement');
const AnnouncementRead = require('../models/AnnouncementRead');
const BroadcastEmail = require('../models/BroadcastEmail');
const Feedback = require('../models/Feedback');
const CommunityPost = require('../models/CommunityPost');
const CommunityComment = require('../models/CommunityComment');
const Like = require('../models/Like');
const Bookmark = require('../models/Bookmark');
const Report = require('../models/Report');
const Order = require('../models/Order');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const { formatUser } = require('../utils/formatUser');
const { unlinkProductImages } = require('../utils/productImages');
const { deleteStoredImage } = require('../utils/imageStorage');
const rateLimit = require('express-rate-limit');

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many admin actions. Please try again later.' },
});

router.use(auth, admin, adminLimiter);

// ── Stats ──

router.get('/stats', async (req, res) => {
  try {
    const [users, products, comments, spam, banned, openFeedback, pendingPosts, pendingReports, totalOrders, awaitingVerification] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Comment.countDocuments(),
      Product.countDocuments({ isSpam: true }),
      User.countDocuments({ isBanned: true }),
      Feedback.countDocuments({ status: 'open' }),
      CommunityPost.countDocuments({ status: 'pending' }),
      Report.countDocuments({ status: 'pending' }),
      Order.countDocuments(),
      Order.countDocuments({ status: 'awaiting_verification' }),
    ]);
    res.json({ users, products, comments, spam, banned, openFeedback, pendingPosts, pendingReports, totalOrders, awaitingVerification });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Users ──

router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users.map(formatUser));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/users/:id/ban', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin')
      return res.status(403).json({ message: 'Cannot ban an admin' });
    user.isBanned = req.body.isBanned !== false;
    await user.save();
    res.json(formatUser(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin')
      return res.status(403).json({ message: 'Cannot delete an admin' });
    await Promise.all([
      Product.deleteMany({ seller: user._id }),
      Comment.deleteMany({ user: user._id }),
      Message.deleteMany({ $or: [{ sender: user._id }, { receiver: user._id }] }),
      CommunityPost.deleteMany({ author: user._id }),
      CommunityComment.deleteMany({ user: user._id }),
      Like.deleteMany({ user: user._id }),
      Bookmark.deleteMany({ user: user._id }),
    ]);
    await user.deleteOne();
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Products ──

router.get('/products', async (req, res) => {
  try {
    const products = await Product.find()
      .populate('seller', 'name email role')
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    await unlinkProductImages(product);
    await product.deleteOne();
    await Promise.all([
      Comment.deleteMany({ product: product._id }),
      Message.deleteMany({ product: product._id }),
    ]);
    res.json({ message: 'Product and related data deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/products/:id/spam', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    product.isSpam = req.body.isSpam !== false;
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Community Moderation ──

router.get('/community/pending', async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const posts = await CommunityPost.find({ status })
      .populate('author', 'name email avatarUrl')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/community/:id/moderate', async (req, res) => {
  try {
    const { action, note } = req.body;
    if (!['approve', 'reject', 'hide'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const post = await CommunityPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const statusMap = { approve: 'approved', reject: 'rejected', hide: 'hidden' };
    post.status = statusMap[action];
    post.moderatedBy = req.user.id;
    post.moderatedAt = new Date();
    if (note) post.moderationNote = note;
    await post.save();

    await post.populate('author', 'name email avatarUrl');
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/community/:id/feature', async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    post.featured = !post.featured;
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/community/:id', async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.imageUrls?.length) {
      await Promise.all(post.imageUrls.map(deleteStoredImage));
    }
    await Promise.all([
      CommunityComment.deleteMany({ post: post._id }),
      Like.deleteMany({ post: post._id }),
      Bookmark.deleteMany({ post: post._id }),
      Report.deleteMany({ targetType: 'post', targetId: post._id }),
      post.deleteOne(),
    ]);
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Comments (admin) ──

router.delete('/comments/:id', async (req, res) => {
  try {
    const comment = await Comment.findByIdAndDelete(req.params.id);
    if (!comment) {
      const cc = await CommunityComment.findByIdAndDelete(req.params.id);
      if (!cc) return res.status(404).json({ message: 'Comment not found' });
      // Update community post comment count
      if (cc.post) {
        const count = await CommunityComment.countDocuments({ post: cc.post });
        await CommunityPost.findByIdAndUpdate(cc.post, { commentCount: count });
      }
    }
    res.json({ message: 'Comment removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Reports ──

router.get('/reports', async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const reports = await Report.find({ status })
      .populate('reporter', 'name email')
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/reports/:id', async (req, res) => {
  try {
    const { status, reviewNote } = req.body;
    if (!['reviewed', 'actioned', 'dismissed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status, reviewedBy: req.user.id, reviewedAt: new Date(), reviewNote: reviewNote || '' },
      { new: true }
    ).populate('reporter', 'name email');
    if (!report) return res.status(404).json({ message: 'Report not found' });
    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Orders ──

router.get('/orders', async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;
    const orders = await Order.find(query)
      .populate('customer', 'name email')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email phone');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/orders/:id/status', async (req, res) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ['awaiting_payment', 'awaiting_verification', 'payment_confirmed', 'processing', 'shipped', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.status = status;
    order.statusHistory.push({
      status,
      changedBy: req.user.id,
      note: note || '',
    });

    if (req.body.trackingId) order.trackingId = req.body.trackingId;
    if (req.body.courierName) order.courierName = req.body.courierName;
    if (req.body.adminNote) order.adminNote = req.body.adminNote;

    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Announcements ──

router.get('/announcements', async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/announcements', async (req, res) => {
  try {
    const { title, message, priority, active, expiresAt } = req.body;
    if (!title?.trim()) return res.status(400).json({ message: 'Title is required' });
    if (!message?.trim()) return res.status(400).json({ message: 'Message is required' });

    const announcement = await Announcement.create({
      title: title.trim(),
      message: message.trim(),
      priority: priority || 'normal',
      active: active !== false,
      createdBy: req.user.id,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });
    
    await announcement.populate('createdBy', 'name email');
    res.status(201).json(announcement);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/announcements/:id', async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' });
    if (req.body.title !== undefined) announcement.title = req.body.title.trim();
    if (req.body.message !== undefined) announcement.message = req.body.message.trim();
    if (req.body.priority !== undefined) announcement.priority = req.body.priority;
    if (req.body.active !== undefined) announcement.active = req.body.active;
    if (req.body.expiresAt !== undefined) {
      announcement.expiresAt = req.body.expiresAt ? new Date(req.body.expiresAt) : null;
    }
    await announcement.save();
    await announcement.populate('createdBy', 'name email');
    res.json(announcement);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/announcements/:id', async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' });
    await AnnouncementRead.deleteMany({ announcement: announcement._id });
    res.json({ message: 'Announcement deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Broadcasts ──

router.get('/broadcasts', async (req, res) => {
  try {
    const broadcasts = await BroadcastEmail.find()
      .populate('sentBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(broadcasts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/broadcasts', async (req, res) => {
  try {
    const { subject, message } = req.body;
    if (!subject?.trim()) return res.status(400).json({ message: 'Subject is required' });
    if (!message?.trim()) return res.status(400).json({ message: 'Message is required' });

    const activeUsers = await User.find({ isBanned: { $ne: true } }).select('name email');
    
    const broadcast = await BroadcastEmail.create({
      subject: subject.trim(),
      message: message.trim(),
      sentBy: req.user.id,
      status: 'sending',
      successCount: 0,
      failedCount: 0,
      failures: []
    });

    await broadcast.populate('sentBy', 'name email');
    res.status(201).json(broadcast);

    const processEmails = async () => {
      const { sendBroadcastEmail } = require('../utils/nodemailerEmail');
      let successCount = 0;
      let failCount = 0;
      let failures = [];

      for (let i = 0; i < activeUsers.length; i++) {
        const u = activeUsers[i];
        if (!u.email) continue;
        const result = await sendBroadcastEmail(u.email, u.name, subject, message);
        if (result.success) {
          successCount++;
        } else {
          failCount++;
          failures.push({ email: u.email, reason: result.error });
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      await BroadcastEmail.findByIdAndUpdate(broadcast._id, {
        status: 'completed',
        successCount,
        failedCount: failCount,
        failures
      });
    };

    processEmails().catch(err => {
      console.error('Background broadcast failed:', err);
      BroadcastEmail.findByIdAndUpdate(broadcast._id, { status: 'failed' }).catch(console.error);
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/broadcasts/:id', async (req, res) => {
  try {
    const broadcast = await BroadcastEmail.findByIdAndDelete(req.params.id);
    if (!broadcast) return res.status(404).json({ message: 'Broadcast not found' });
    res.json({ message: 'Broadcast deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Feedback ──

router.get('/feedback', async (req, res) => {
  try {
    const filter = req.query.status ? { status: req.query.status } : {};
    const feedback = await Feedback.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/feedback/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['open', 'read', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('user', 'name email');
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/feedback/:id', async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
    res.json({ message: 'Feedback deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
