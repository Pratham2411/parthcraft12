const router = require('express').Router();
const SiteSettings = require('../models/SiteSettings');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const { createUpload } = require('../middleware/multerUpload');
const { uploadFile, deleteStoredImage } = require('../utils/imageStorage');

const uploadQr = createUpload(1, 2).single('qrImage');

// ── GET /api/settings — Public settings (safe subset) ──

router.get('/', async (req, res) => {
  try {
    const settings = await SiteSettings.getSettings();
    // Return only public-safe fields
    res.json({
      siteName: settings.siteName,
      siteTagline: settings.siteTagline,
      creatorName: settings.creatorName,
      creatorBio: settings.creatorBio,
      youtubeChannelUrl: settings.youtubeChannelUrl,
      youtubeChannelName: settings.youtubeChannelName,
      instagramUrl: settings.instagramUrl,
      creatorAvatarUrl: settings.creatorAvatarUrl || '/images/owner.png',
      whatsappNumber: settings.whatsappNumber || '',
      upiQrImageUrl: settings.upiQrImageUrl,
      paymentInstructions: settings.paymentInstructions,
      currency: settings.currency,
      currencySymbol: settings.currencySymbol,
      shippingCharge: settings.shippingCharge,
      freeShippingAbove: settings.freeShippingAbove,
      shippingInfo: settings.shippingInfo,
      returnPolicy: settings.returnPolicy,
      privacyPolicy: settings.privacyPolicy,
      termsOfService: settings.termsOfService,
      featuredVideos: settings.featuredVideos,
      productCategories: settings.productCategories,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch settings' });
  }
});

// ── GET /api/settings/admin — Full settings for admin ──

router.get('/admin', auth, admin, async (req, res) => {
  try {
    const settings = await SiteSettings.getSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch settings' });
  }
});

// ── PATCH /api/settings — Update settings (admin only) ──

router.patch('/', auth, admin, async (req, res) => {
  try {
    const allowedFields = [
      'siteName', 'siteTagline', 'creatorName', 'creatorBio',
      'youtubeChannelUrl', 'youtubeChannelName', 'instagramUrl',
      'creatorAvatarUrl',
      'adminEmail', 'whatsappNumber',
      'paymentInstructions', 'currency', 'currencySymbol',
      'shippingCharge', 'freeShippingAbove', 'shippingInfo',
      'returnPolicy', 'privacyPolicy', 'termsOfService',
      'featuredVideos', 'productCategories',
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const settings = await SiteSettings.findByIdAndUpdate(
      'site_settings',
      { $set: updates },
      { new: true, upsert: true }
    );

    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update settings' });
  }
});

// ── POST /api/settings/qr — Upload QR image (admin only) ──

router.post('/qr', auth, admin, uploadQr, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'QR image is required' });

    const settings = await SiteSettings.getSettings();
    // Delete old QR if exists
    if (settings.upiQrImageUrl) {
      await deleteStoredImage(settings.upiQrImageUrl);
    }

    const url = await uploadFile(req.file, 'site');
    settings.upiQrImageUrl = url;
    await settings.save();

    res.json({ upiQrImageUrl: url });
  } catch (err) {
    res.status(500).json({ message: 'Failed to upload QR image' });
  }
});

// ── POST /api/settings/avatar — Upload creator avatar (admin only) ──

router.post('/avatar', auth, admin, createUpload(1, 2).single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Avatar image is required' });

    const settings = await SiteSettings.getSettings();
    if (settings.creatorAvatarUrl) {
      await deleteStoredImage(settings.creatorAvatarUrl);
    }

    const url = await uploadFile(req.file, 'site');
    settings.creatorAvatarUrl = url;
    await settings.save();

    res.json({ creatorAvatarUrl: url });
  } catch (err) {
    res.status(500).json({ message: 'Failed to upload avatar' });
  }
});

module.exports = router;
