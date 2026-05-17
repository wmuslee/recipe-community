const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const { protect } = require('../middleware/protect');

// GET /api/comments/:recipeId
router.get('/:recipeId', async (req, res) => {
  try {
    const comments = await Comment.find({ recipe: req.params.recipeId })
      .populate('author', 'username avatar')
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/comments/:recipeId
router.post('/:recipeId', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Comment text is required' });
    const comment = await Comment.create({ text: text.trim(), author: req.user._id, recipe: req.params.recipeId });
    const full = await Comment.findById(comment._id).populate('author', 'username avatar');
    res.status(201).json(full);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/comments/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Not found' });
    if (comment.author.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });
    comment.text = req.body.text.trim();
    comment.isEdited = true;
    await comment.save();
    const full = await Comment.findById(comment._id).populate('author', 'username avatar');
    res.json(full);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE /api/comments/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Not found' });
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });
    await comment.deleteOne();
    res.json({ message: 'Deleted', commentId: req.params.id });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/comments/:id/like
router.post('/:id/like', protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Not found' });
    const uid = req.user._id;
    const liked = comment.likes.includes(uid);
    if (liked) comment.likes.pull(uid);
    else comment.likes.push(uid);
    await comment.save();
    res.json({ likesCount: comment.likes.length, isLiked: !liked });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
