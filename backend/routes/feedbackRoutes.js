const router = require('express').Router();
const Feedback = require('../models/Feedback');
const auth = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const feedbackLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 feedbacks per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Feedback limit reached. Please try again later.' },
});

router.post('/', auth, feedbackLimiter, async (req, res) => {
  try {
    const { subject, message } = req.body;
    if (!subject?.trim()) return res.status(400).json({ message: 'Subject is required' });
    if (!message?.trim()) return res.status(400).json({ message: 'Message is required' });

    const feedback = await Feedback.create({
      user: req.user.id,
      subject: subject.trim(),
      message: message.trim(),
    });

    res.status(201).json({ message: 'Feedback sent to admins', id: feedback._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
