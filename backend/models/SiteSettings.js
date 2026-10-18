const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'site_settings' },

    // Creator branding
    siteName: { type: String, default: 'ParthCraft12' },
    siteTagline: { type: String, default: 'Handmade Art & Craft Creations' },
    creatorName: { type: String, default: 'ParthCraft12' },
    creatorBio: { type: String, default: '' },
    youtubeChannelUrl: { type: String, default: 'https://www.youtube.com/@parthcraft12' },
    youtubeChannelName: { type: String, default: 'ParthCraft12' },
    instagramUrl: { type: String, default: '' },
    creatorAvatarUrl: { type: String, default: '' },

    // Contact
    adminEmail: { type: String, default: '' },
    whatsappNumber: { type: String, default: '' }, // International format e.g. 919876543210

    // Payment
    upiQrImageUrl: { type: String, default: '' },
    paymentInstructions: { type: String, default: 'Scan the QR code using any UPI app (Google Pay, PhonePe, Paytm, etc.) and pay the exact amount shown.' },

    // Store settings
    currency: { type: String, default: 'INR' },
    currencySymbol: { type: String, default: '₹' },
    shippingCharge: { type: Number, default: 0 },
    freeShippingAbove: { type: Number, default: 0 }, // 0 = no free shipping threshold
    shippingInfo: { type: String, default: 'Shipping charges may apply. Delivery typically takes 5-7 business days.' },

    // Policies
    returnPolicy: { type: String, default: 'Handmade items are non-returnable unless damaged during shipping. Contact us within 48 hours of delivery with photos of the damage.' },
    privacyPolicy: { type: String, default: '' },
    termsOfService: { type: String, default: '' },

    // Featured YouTube videos (admin-curated)
    featuredVideos: [{
      url: { type: String, required: true },
      videoId: { type: String, required: true },
      title: { type: String, default: '' },
      thumbnail: { type: String, default: '' },
    }],

    // Product categories for the craft shop
    productCategories: {
      type: [String],
      default: [
        'Paintings', 'Drawings', 'Origami', 'Handmade Cards',
        'Crochet', 'Knitting', 'Pottery', 'Calligraphy',
        'Home Decor', 'Jewelry', 'Gift Items', 'Other'
      ],
    },
  },
  { timestamps: true }
);

// Singleton pattern: always use findOneAndUpdate with upsert
siteSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findById('site_settings');
  if (!settings) {
    settings = await this.create({ _id: 'site_settings' });
  }
  return settings;
};

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
