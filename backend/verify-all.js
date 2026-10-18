/**
 * ParthCraft12 Verification Suite
 * Validates models, schemas, express routes, middleware, utilities, and assets.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

console.log('🧪 Starting ParthCraft12 Verification Suite...\n');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}:`, err.message);
  }
}

// ==========================================
// 1. Model Schema Tests
// ==========================================
console.log('📦 1. Verifying Mongoose Model Schemas:');

const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
const CommunityPost = require('./models/CommunityPost');
const SiteSettings = require('./models/SiteSettings');
const Report = require('./models/Report');
const Like = require('./models/Like');
const Bookmark = require('./models/Bookmark');

test('Product model has all craft-specific fields', () => {
  const schema = Product.schema.paths;
  assert(schema.title, 'title path missing');
  assert(schema.price, 'price path missing');
  assert(schema.category, 'category path missing');
  assert(schema.published, 'published path missing');
  assert(schema.madeToOrder, 'madeToOrder path missing');
  assert(schema.prepTime, 'prepTime path missing');
  assert(schema.dimensions, 'dimensions path missing');
  assert(schema.materials, 'materials path missing');
  assert(schema.customizationAvailable, 'customizationAvailable path missing');
});

test('User model has bio and displayName', () => {
  const schema = User.schema.paths;
  assert(schema.bio, 'bio path missing');
  assert(schema.displayName, 'displayName path missing');
  assert(schema.role, 'role path missing');
});

test('Order model validates status enum and orderRef', () => {
  const schema = Order.schema.paths;
  assert(schema.orderRef, 'orderRef path missing');
  assert(schema.status, 'status path missing');
  assert(schema.subtotal, 'subtotal path missing');
  assert(schema.shippingCharge, 'shippingCharge path missing');
  assert(schema.totalAmount, 'totalAmount path missing');
  assert(schema.customerPhone, 'customerPhone path missing');
  assert(schema.paymentScreenshotUrl, 'paymentScreenshotUrl path missing');

  const validStatuses = ['awaiting_payment', 'awaiting_verification', 'payment_confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  const enumValues = schema.status.enumValues;
  validStatuses.forEach(s => assert(enumValues.includes(s), `Status ${s} missing from enum`));
});

test('CommunityPost model supports image & youtube mediaTypes', () => {
  const schema = CommunityPost.schema.paths;
  assert(schema.mediaType, 'mediaType missing');
  assert(schema.youtubeUrl, 'youtubeUrl missing');
  assert(schema.youtubeVideoId, 'youtubeVideoId missing');
  assert(schema.likesCount, 'likesCount missing');
  assert(schema.bookmarksCount, 'bookmarksCount missing');
  const types = schema.mediaType.enumValues;
  assert(types.includes('image') && types.includes('youtube'), 'Invalid mediaType enums');
});

test('SiteSettings model defines store defaults and singleton method', () => {
  const schema = SiteSettings.schema.paths;
  assert(schema.siteName, 'siteName missing');
  assert(schema.youtubeChannelUrl, 'youtubeChannelUrl missing');
  assert(schema.whatsappNumber, 'whatsappNumber missing');
  assert(schema.upiQrImageUrl, 'upiQrImageUrl missing');
  assert(schema.shippingCharge, 'shippingCharge missing');
  assert(typeof SiteSettings.getSettings === 'function', 'getSettings static method missing');
});

test('Report, Like, and Bookmark models exist and are valid', () => {
  assert(Report.schema.paths.targetType, 'Report targetType missing');
  assert(Like.schema.paths.post, 'Like post missing');
  assert(Bookmark.schema.paths.post, 'Bookmark post missing');
});

// ==========================================
// 2. Express Server & Route Stack Verification
// ==========================================
console.log('\n🌐 2. Verifying Express Routes:');

const express = require('express');
const app = express();

test('Mount all route modules cleanly without throwing', () => {
  app.use('/api/auth', require('./routes/authRoutes'));
  app.use('/api/products', require('./routes/productRoutes'));
  app.use('/api/community', require('./routes/communityRoutes'));
  app.use('/api/orders', require('./routes/orderRoutes'));
  app.use('/api/settings', require('./routes/settingsRoutes'));
  app.use('/api/admin', require('./routes/adminRoutes'));
  app.use('/api/comments', require('./routes/commentRoutes'));
  app.use('/api/feedback', require('./routes/feedbackRoutes'));
  app.use('/api/messages', require('./routes/messageRoutes'));
  app.use('/api/requests', require('./routes/requestRoutes'));
  app.use('/api/announcements', require('./routes/announcementRoutes'));
});

// ==========================================
// 3. Auth, Admin & Middleware Logic
// ==========================================
console.log('\n🔒 3. Verifying Middleware & Auth Logic:');

const { isAdminEmail } = require('./config/admins');
const jwt = require('jsonwebtoken');

test('isAdminEmail identifies configured admin emails correctly', () => {
  assert.strictEqual(isAdminEmail('prathamraj2411@gmail.com'), true);
  assert.strictEqual(isAdminEmail('PRATHAMRAJ2411@GMAIL.COM'), true);
  assert.strictEqual(isAdminEmail('randomuser@example.com'), false);
});

test('JWT signing and decoding works', () => {
  const secret = 'test-secret-key-12345';
  const token = jwt.sign({ id: 'user123', email: 'test@example.com', role: 'admin' }, secret, { expiresIn: '1h' });
  const decoded = jwt.verify(token, secret);
  assert.strictEqual(decoded.id, 'user123');
  assert.strictEqual(decoded.role, 'admin');
});

// ==========================================
// 4. Utility Functions & Order Notification
// ==========================================
console.log('\n📧 4. Verifying Utilities:');

const { sendOrderNotificationEmail } = require('./utils/orderEmail');

test('sendOrderNotificationEmail gracefully handles missing API key in dev', async () => {
  const dummyOrder = {
    orderRef: 'PC-TEST1234',
    totalAmount: 999,
    subtotal: 950,
    shippingCharge: 49,
    status: 'awaiting_verification',
    customerName: 'Test Buyer',
    customerPhone: '9876543210',
    customerEmail: 'buyer@example.com',
    items: [{ title: 'Handmade Origami Lotus', quantity: 1, price: 950 }]
  };
  const res = await sendOrderNotificationEmail('admin@example.com', dummyOrder);
  assert(res && res.success === true, 'Failed dev order notification');
});

// ==========================================
// 5. Frontend & PWA Files Verification
// ==========================================
console.log('\n📱 5. Verifying Frontend & PWA Assets:');

test('Frontend production build artifacts exist', () => {
  const distHtml = path.join(__dirname, '../frontend/dist/index.html');
  assert(fs.existsSync(distHtml), 'dist/index.html missing');
  const htmlContent = fs.readFileSync(distHtml, 'utf-8');
  assert(htmlContent.includes('ParthCraft12'), 'HTML missing ParthCraft12 title');
});

test('PWA manifest.json has valid structure', () => {
  const manifestPath = path.join(__dirname, '../frontend/public/manifest.json');
  assert(fs.existsSync(manifestPath), 'manifest.json missing');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  assert.strictEqual(manifest.short_name, 'ParthCraft12');
  assert(Array.isArray(manifest.icons) && manifest.icons.length >= 2, 'manifest missing icons');
});

test('PWA service worker (sw.js) exists and contains cache handlers', () => {
  const swPath = path.join(__dirname, '../frontend/public/sw.js');
  assert(fs.existsSync(swPath), 'sw.js missing');
  const swCode = fs.readFileSync(swPath, 'utf-8');
  assert(swCode.includes('CACHE_NAME'), 'sw.js missing CACHE_NAME');
  assert(swCode.includes('addEventListener'), 'sw.js missing eventListener');
});

test('PWA icon files exist and are non-empty', () => {
  const icon192 = path.join(__dirname, '../frontend/public/icon-192.png');
  const icon512 = path.join(__dirname, '../frontend/public/icon-512.png');
  assert(fs.existsSync(icon192) && fs.statSync(icon192).size > 1000, 'icon-192.png invalid');
  assert(fs.existsSync(icon512) && fs.statSync(icon512).size > 1000, 'icon-512.png invalid');
});

// ==========================================
// Summary
// ==========================================
console.log('\n' + '='.repeat(60));
console.log(`🏁 Verification Finished: ${passedTests}/${totalTests} tests passed (${Math.round((passedTests/totalTests)*100)}%)`);
console.log('='.repeat(60) + '\n');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
