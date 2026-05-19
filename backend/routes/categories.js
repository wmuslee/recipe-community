const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { protect } = require('../middleware/protect');

// GET /api/categories  отдаем все категории, сортируем по алфавиту
router.get('/', async (req, res) => {
  try { res.json(await Category.find().sort({ name: 1 })); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/categories/:slug  отдаем категорию по slug, or 404
router.get('/:slug', async (req, res) => {
  try {
    const cat = await Category.findOne({ slug: req.params.slug });
    if (!cat) return res.status(404).json({ message: 'Category not found' });
    res.json(cat);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/categories/  только для админов, создаем категорию, отдаем ее, если юзер не админ - 403
router.post('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
    const cat = await Category.create(req.body);
    res.status(201).json(cat);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
