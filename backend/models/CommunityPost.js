const mongoose = require('mongoose');

const COMMUNITY_CATEGORIES = [
  'Painting', 'Drawing', 'Origami', 'Craft', 'DIY',
  'Crochet', 'Knitting', 'Pottery', 'Calligraphy',
  'Mixed Media', 'Tutorial', 'Other'
];

const POST_TYPES = ['photo', 'youtube'];
const POST_STATUSES = ['pending', 'approved', 'rejected', 'hidden'];

const communityPostSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: POST_TYPES, default: 'photo' },
    mediaType: { type: String, enum: ['image', 'photo', 'youtube'], default: 'photo' },

    // Common fields
    title: { type: String, required: true, trim: true, maxlength: 200 },
    caption: { type: String, default: '', trim: true, maxlength: 2000 },
    description: { type: String, default: '', trim: true, maxlength: 2000 },
    category: { type: String, enum: COMMUNITY_CATEGORIES, default: 'Other' },
    tags: [{ type: String, trim: true, maxlength: 50 }],

    // Photo post fields
    imageUrls: [{ type: String }],
    images: [{ type: String }],

    // YouTube link post fields
    youtubeUrl: { type: String, default: '' },
    youtubeVideoId: { type: String, default: '' },
    youtubeThumbnail: { type: String, default: '' },

    // Moderation
    status: { type: String, enum: POST_STATUSES, default: 'pending' },
    moderationNote: { type: String, default: '' },
    moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    moderatedAt: { type: Date, default: null },

    // Engagement counters (denormalized for performance)
    likeCount: { type: Number, default: 0 },
    likesCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    bookmarkCount: { type: Number, default: 0 },
    bookmarksCount: { type: Number, default: 0 },

    // Featured flag (admin can feature posts)
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

communityPostSchema.index({ status: 1, createdAt: -1 });
communityPostSchema.index({ author: 1, createdAt: -1 });
communityPostSchema.index({ category: 1, status: 1 });
communityPostSchema.index({ featured: 1, status: 1 });

module.exports = mongoose.model('CommunityPost', communityPostSchema);
module.exports.COMMUNITY_CATEGORIES = COMMUNITY_CATEGORIES;
module.exports.POST_STATUSES = POST_STATUSES;
