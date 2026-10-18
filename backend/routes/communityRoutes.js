const router = require('express').Router();
const CommunityPost = require('../models/CommunityPost');
const CommunityComment = require('../models/CommunityComment');
const Like = require('../models/Like');
const Bookmark = require('../models/Bookmark');
const Report = require('../models/Report');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const { createUpload } = require('../middleware/multerUpload');
const { uploadFiles, deleteStoredImage } = require('../utils/imageStorage');
const rateLimit = require('express-rate-limit');

const postLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many posts. Please try again later.' },
});

const commentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'You are commenting too quickly.' },
});

const uploadPostImages = createUpload(5, 5).array('images', 5);

// ── Helpers ──

const YOUTUBE_REGEX = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[?&].*)?$/;

const extractYoutubeId = (url) => {
  if (!url) return null;
  const match = String(url).trim().match(YOUTUBE_REGEX);
  return match ? match[1] : null;
};

const getYoutubeThumbnail = (videoId) =>
  `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

const AUTHOR_FIELDS = 'name avatarUrl bio displayName';

// ── GET /api/community — Public feed (approved only) ──

router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, type, page = 1, limit = 20 } = req.query;
    const query = { status: 'approved' };
    if (category) query.category = category;
    if (type) query.type = type;

    const skip = (Math.max(1, Number(page)) - 1) * Math.min(50, Number(limit));
    const lim = Math.min(50, Number(limit));

    const [posts, total] = await Promise.all([
      CommunityPost.find(query)
        .populate('author', AUTHOR_FIELDS)
        .sort({ featured: -1, createdAt: -1 })
        .skip(skip)
        .limit(lim)
        .lean(),
      CommunityPost.countDocuments(query),
    ]);

    // Attach user-specific like/bookmark status
    if (req.user) {
      const postIds = posts.map((p) => p._id);
      const [likes, bookmarks] = await Promise.all([
        Like.find({ user: req.user.id, post: { $in: postIds } }).lean(),
        Bookmark.find({ user: req.user.id, post: { $in: postIds } }).lean(),
      ]);
      const likedSet = new Set(likes.map((l) => l.post.toString()));
      const bookmarkedSet = new Set(bookmarks.map((b) => b.post.toString()));
      posts.forEach((p) => {
        p.isLiked = likedSet.has(p._id.toString());
        p.isBookmarked = bookmarkedSet.has(p._id.toString());
      });
    }

    res.json({ posts, total, page: Number(page), totalPages: Math.ceil(total / lim) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch community posts' });
  }
});

// ── GET /api/community/my — Current user's posts ──

router.get('/my', auth, async (req, res) => {
  try {
    const posts = await CommunityPost.find({ author: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch your posts' });
  }
});

// ── GET /api/community/bookmarks — User's bookmarked posts ──

router.get('/bookmarks', auth, async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate({
        path: 'post',
        populate: { path: 'author', select: AUTHOR_FIELDS },
      })
      .lean();
    const posts = bookmarks.map((b) => b.post).filter(Boolean);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch bookmarks' });
  }
});

// ── GET /api/community/:id — Single post ──

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id)
      .populate('author', AUTHOR_FIELDS)
      .lean();
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.status !== 'approved' && (!req.user || String(post.author._id || post.author) !== req.user.id)) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (req.user) {
      const [like, bookmark] = await Promise.all([
        Like.findOne({ user: req.user.id, post: post._id }),
        Bookmark.findOne({ user: req.user.id, post: post._id }),
      ]);
      post.isLiked = !!like;
      post.isBookmarked = !!bookmark;
    }

    res.json(post);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch post' });
  }
});

// ── POST /api/community — Create post ──

router.post('/', auth, postLimiter, uploadPostImages, async (req, res) => {
  try {
    const { title, caption, category, tags, type, youtubeUrl } = req.body;

    if (!title?.trim()) return res.status(400).json({ message: 'Title is required' });
    if (!type || !['photo', 'youtube'].includes(type)) {
      return res.status(400).json({ message: 'Post type must be photo or youtube' });
    }

    const postData = {
      author: req.user.id,
      type,
      title: title.trim(),
      caption: caption?.trim() || '',
      category: category || 'Other',
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim())).slice(0, 10) : [],
      status: 'pending',
    };

    if (type === 'photo') {
      const files = req.files || [];
      if (!files.length) return res.status(400).json({ message: 'At least one image is required for photo posts' });
      if (files.length > 5) return res.status(400).json({ message: 'Maximum 5 images per post' });
      postData.imageUrls = await uploadFiles(files, 'community');
    } else if (type === 'youtube') {
      const videoId = extractYoutubeId(youtubeUrl);
      if (!videoId) return res.status(400).json({ message: 'Please provide a valid YouTube URL' });
      postData.youtubeUrl = youtubeUrl.trim();
      postData.youtubeVideoId = videoId;
      postData.youtubeThumbnail = getYoutubeThumbnail(videoId);
    }

    const post = await CommunityPost.create(postData);
    await post.populate('author', AUTHOR_FIELDS);
    res.status(201).json(post);
  } catch (err) {
    console.error('Create community post error:', err);
    res.status(500).json({ message: 'Failed to create post' });
  }
});

// ── DELETE /api/community/:id — Author or admin delete ──

router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (String(post.author) !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Clean up images
    if (post.imageUrls?.length) {
      await Promise.all(post.imageUrls.map(deleteStoredImage));
    }
    // Clean up related data
    await Promise.all([
      CommunityComment.deleteMany({ post: post._id }),
      Like.deleteMany({ post: post._id }),
      Bookmark.deleteMany({ post: post._id }),
      Report.deleteMany({ targetType: 'post', targetId: post._id }),
      post.deleteOne(),
    ]);

    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete post' });
  }
});

// ── POST /api/community/:id/like — Toggle like ──

router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const existing = await Like.findOne({ user: req.user.id, post: post._id });
    if (existing) {
      await existing.deleteOne();
      post.likeCount = Math.max(0, post.likeCount - 1);
      await post.save();
      return res.json({ liked: false, likeCount: post.likeCount });
    }

    await Like.create({ user: req.user.id, post: post._id });
    post.likeCount += 1;
    await post.save();
    res.json({ liked: true, likeCount: post.likeCount });
  } catch (err) {
    if (err.code === 11000) {
      return res.json({ liked: true, likeCount: (await CommunityPost.findById(req.params.id))?.likeCount || 0 });
    }
    res.status(500).json({ message: 'Failed to toggle like' });
  }
});

// ── POST /api/community/:id/bookmark — Toggle bookmark ──

router.post('/:id/bookmark', auth, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const existing = await Bookmark.findOne({ user: req.user.id, post: post._id });
    if (existing) {
      await existing.deleteOne();
      post.bookmarkCount = Math.max(0, post.bookmarkCount - 1);
      await post.save();
      return res.json({ bookmarked: false });
    }

    await Bookmark.create({ user: req.user.id, post: post._id });
    post.bookmarkCount += 1;
    await post.save();
    res.json({ bookmarked: true });
  } catch (err) {
    if (err.code === 11000) return res.json({ bookmarked: true });
    res.status(500).json({ message: 'Failed to toggle bookmark' });
  }
});

// ── GET /api/community/:id/comments — Get comments ──

router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await CommunityComment.find({ post: req.params.id })
      .populate('user', 'name avatarUrl')
      .sort({ createdAt: 1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch comments' });
  }
});

// ── POST /api/community/:id/comments — Add comment ──

router.post('/:id/comments', auth, commentLimiter, async (req, res) => {
  try {
    const { text, replyTo } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Comment text is required' });

    const post = await CommunityPost.findById(req.params.id);
    if (!post || post.status !== 'approved') {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = await CommunityComment.create({
      post: post._id,
      user: req.user.id,
      text: text.trim(),
      replyTo: replyTo || null,
    });

    post.commentCount += 1;
    await post.save();

    await comment.populate('user', 'name avatarUrl');
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: 'Failed to add comment' });
  }
});

// ── DELETE /api/community/comments/:commentId — Delete comment ──

router.delete('/comments/:commentId', auth, async (req, res) => {
  try {
    const comment = await CommunityComment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (String(comment.user) !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const post = await CommunityPost.findById(comment.post);
    // Delete replies too
    await CommunityComment.deleteMany({ replyTo: comment._id });
    await comment.deleteOne();

    if (post) {
      post.commentCount = Math.max(0, await CommunityComment.countDocuments({ post: post._id }));
      await post.save();
    }

    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete comment' });
  }
});

// ── POST /api/community/:id/report — Report post ──

router.post('/:id/report', auth, async (req, res) => {
  try {
    const { reason, details } = req.body;
    if (!reason) return res.status(400).json({ message: 'Reason is required' });

    await Report.create({
      reporter: req.user.id,
      targetType: 'post',
      targetId: req.params.id,
      reason,
      details: details?.trim() || '',
    });

    res.status(201).json({ message: 'Report submitted' });
  } catch (err) {
    if (err.code === 11000) return res.json({ message: 'You have already reported this' });
    res.status(500).json({ message: 'Failed to submit report' });
  }
});

// ── GET /api/community/user/:userId — Public posts by a user ──

router.get('/user/:userId', async (req, res) => {
  try {
    const posts = await CommunityPost.find({ author: req.params.userId, status: 'approved' })
      .populate('author', AUTHOR_FIELDS)
      .sort({ createdAt: -1 })
      .lean();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user posts' });
  }
});

module.exports = router;
