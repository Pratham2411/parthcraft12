const mongoose = require('mongoose');

const communityCommentSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityPost', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityComment', default: null },
  },
  { timestamps: true }
);

communityCommentSchema.index({ post: 1, createdAt: -1 });

module.exports = mongoose.model('CommunityComment', communityCommentSchema);
