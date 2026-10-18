require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Product = require('./models/Product');
const CommunityPost = require('./models/CommunityPost');
const SiteSettings = require('./models/SiteSettings');

const sampleProducts = [
  {
    title: 'Sunset over Ganges — Acrylic Canvas Painting',
    description: 'An original 12x16 inch acrylic painting on stretched canvas featuring the vibrant evening hues and gentle water reflections. Finished with a protective varnish coat. Ready to hang.',
    price: 1499,
    category: 'Paintings',
    condition: 'new',
    published: true,
    madeToOrder: false,
    prepTime: 'Ships in 1-2 days',
    dimensions: '12" x 16"',
    materials: ['Stretched Canvas', 'Artist Grade Acrylics', 'Satin Varnish'],
    customizationAvailable: true,
    customizationPrompt: 'Can add custom name/quote in calligraphy on back',
    stock: 1,
    featured: true,
    images: [
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    title: 'Modular Origami 3D Lotus Flower Display',
    description: 'Intricately hand-folded modular origami lotus made from Japanese washi paper in soft peach and gold accents. Protected inside a clear mini display case.',
    price: 499,
    category: 'Origami',
    condition: 'new',
    published: true,
    madeToOrder: true,
    prepTime: '3-4 business days',
    dimensions: '6" x 6" x 4"',
    materials: ['Japanese Washi Paper', 'Metallic Foil Paper'],
    customizationAvailable: true,
    customizationPrompt: 'Choose color palette: Pink, Peach, Lavender, or Gold',
    stock: 5,
    featured: true,
    images: [
      'https://images.unsplash.com/photo-1582562124811-c09040d0a901?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    title: 'Handmade Crochet Daisy Tote Bag',
    description: 'Charming retro daisy granny square tote bag hand-crocheted using 100% breathable organic cotton yarn. Features reinforced sturdy straps and an inner fabric lining.',
    price: 899,
    category: 'Crochet',
    condition: 'new',
    published: true,
    madeToOrder: true,
    prepTime: '5-7 business days',
    dimensions: '14" x 14" with 10" strap drop',
    materials: ['100% Organic Cotton Yarn', 'Linen Lining'],
    customizationAvailable: true,
    customizationPrompt: 'Available with yellow, pink, or sage green daisies',
    stock: 3,
    featured: true,
    images: [
      'https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    title: 'Handcrafted Terracotta Tealight Holders (Set of 4)',
    description: 'Hand-shaped and kiln-fired natural clay tealight diya holders painted with traditional Madhubani geometric motifs. Perfect for festive decor and spiritual spaces.',
    price: 599,
    category: 'Pottery',
    condition: 'new',
    published: true,
    madeToOrder: false,
    prepTime: 'Ships in 1-2 days',
    dimensions: '3.5" diameter each',
    materials: ['Natural Clay', 'Earth Pigments', 'Protective Sealant'],
    customizationAvailable: false,
    stock: 8,
    featured: false,
    images: [
      'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    title: 'Custom Calligraphy Bookmark Set (Pack of 5)',
    description: 'Personalized bookmarks crafted from 300 GSM handmade cotton deckle-edge paper with gold leaf highlights and silk ribbon tassels. Written in modern gothic and italic script.',
    price: 349,
    category: 'Calligraphy',
    condition: 'new',
    published: true,
    madeToOrder: true,
    prepTime: '2-3 business days',
    dimensions: '2" x 7"',
    materials: ['300 GSM Deckle Paper', 'Archival Black Ink', '24k Gold Foil', 'Silk Ribbon'],
    customizationAvailable: true,
    customizationPrompt: 'Provide 5 custom quotes or names for the bookmarks',
    stock: 10,
    featured: true,
    images: [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    title: 'Handmade Botanical Pressed Flower Greeting Cards (Pack of 4)',
    description: 'Delicate greeting cards featuring real pressed wildflowers collected and preserved from the garden. Blank interior on recycled textured paper, includes craft envelopes.',
    price: 449,
    category: 'Handmade Cards',
    condition: 'new',
    published: true,
    madeToOrder: false,
    prepTime: 'Ships in 1-2 days',
    dimensions: '5" x 7"',
    materials: ['Pressed Wildflowers', 'Recycled Cotton Cardstock', 'Kraft Envelopes'],
    customizationAvailable: false,
    stock: 12,
    featured: false,
    images: [
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80'
    ]
  }
];

const samplePosts = [
  {
    title: 'DIY 3D Paper Dahlia Tutorial & Making Process',
    description: 'Just finished creating this paper dahlia! In this post I break down the petals folding technique. Check out my full video on YouTube for the complete step-by-step tutorial!',
    category: 'Origami',
    tags: ['origami', 'papercraft', 'dahlia', 'diy'],
    mediaType: 'youtube',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    youtubeVideoId: 'dQw4w9WgXcQ',
    status: 'approved'
  },
  {
    title: 'My First Hand-Poured Ceramic Mug with Leaves Pattern',
    description: 'Experimenting with stoneware clay and underglaze botanical prints. Loved how the glaze turned out after the 1200°C cone 6 firing!',
    category: 'Pottery',
    tags: ['ceramics', 'pottery', 'handmade', 'stoneware'],
    mediaType: 'image',
    images: ['https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80'],
    status: 'approved'
  },
  {
    title: 'Vintage Bookmark Calligraphy Practice',
    description: 'Practicing flourish calligraphy on handmade deckle edge cotton paper. Gold leaf accents really make the letters pop.',
    category: 'Calligraphy',
    tags: ['calligraphy', 'lettering', 'goldleaf', 'handmadepaper'],
    mediaType: 'image',
    images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'],
    status: 'approved'
  }
];

async function seed() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('❌ MONGO_URI missing from .env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri, { dbName: 'parthcraft12' });
  console.log('Connected! Seeding initial data...');

  // 1. Create or update admin user
  const adminEmail = (process.env.ADMIN_EMAILS || 'prathamraj2411@gmail.com').split(',')[0].trim();
  const plainPassword = '230459';

  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = new User({
      name: 'Pratham Raj',
      displayName: 'ParthCraft12',
      email: adminEmail,
      password: plainPassword,
      role: 'admin',
      isEmailVerified: true,
      bio: 'Creator & Artist at ParthCraft12. Sharing handmade craft ideas, paper origami, and art tutorials on YouTube.'
    });
    await admin.save();
    console.log(`✅ Admin user created: ${adminEmail} (password: 230459)`);
  } else {
    admin.name = 'Pratham Raj';
    admin.displayName = 'ParthCraft12';
    admin.password = plainPassword;
    admin.role = 'admin';
    admin.isEmailVerified = true;
    await admin.save();
    console.log(`✅ Updated existing admin user: ${adminEmail} with password: 230459 and role: admin`);
  }

  // 2. Site settings
  await SiteSettings.findOneAndUpdate(
    { _id: 'site_settings' },
    {
      siteName: 'ParthCraft12',
      siteTagline: 'Handmade Art & Craft Creations',
      creatorName: 'ParthCraft12',
      creatorBio: 'Welcome to ParthCraft12! We make handmade artwork, origami, crochet, and craft gifts with love and attention to detail. Every piece is unique.',
      youtubeChannelUrl: 'https://www.youtube.com/@parthcraft12',
      youtubeChannelName: 'ParthCraft12',
      adminEmail: adminEmail,
      whatsappNumber: '919876543210',
      paymentInstructions: 'Scan the UPI QR code using Google Pay, PhonePe, Paytm, or BHIM. Pay the exact order amount and upload a screenshot with your transaction reference number.',
      shippingCharge: 49,
      freeShippingAbove: 999,
      shippingInfo: 'Handcrafted items are carefully packed and dispatched via speed post / courier. Delivery typically takes 4-7 business days across India.'
    },
    { upsert: true, new: true }
  );
  console.log('✅ Site settings configured');

  // 3. Clear and insert sample products
  await Product.deleteMany({ seller: admin._id });
  for (const p of sampleProducts) {
    await Product.create({
      ...p,
      seller: admin._id
    });
  }
  console.log(`✅ Seeded ${sampleProducts.length} craft products`);

  // 4. Clear and insert community posts
  await CommunityPost.deleteMany({ author: admin._id });
  for (const post of samplePosts) {
    await CommunityPost.create({
      ...post,
      author: admin._id
    });
  }
  console.log(`✅ Seeded ${samplePosts.length} community posts`);

  console.log('\n🎉 Database successfully seeded with ParthCraft12 catalog & community posts!\n');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
