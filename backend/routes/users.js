const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Recipe = require('../models/Recipe');
const { protect } = require('../middleware/protect');

router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -savedRecipes');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const recipeCount = await Recipe.countDocuments({ author: req.params.id });
    res.json({ ...user.toObject(), recipeCount });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:id/saved', protect, async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id)
      return res.status(403).json({ message: 'Not authorized' });
    const user = await User.findById(req.params.id).populate({
      path: 'savedRecipes',
      populate: [
        { path: 'author', select: 'username avatar' },
        { path: 'category', select: 'name slug color icon' },
        { path: 'tags', select: 'name color' },
      ],
    });
    res.json(user.savedRecipes);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
