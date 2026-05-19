const express = require('express');
const router = express.Router();
const Tag = require('../models/Tag');
const { protect } = require('../middleware/protect');

// GET /api/tags  отдаем все теги, сортируем по количеству использования (usageCount)
router.get('/', async (req, res) => {
  try { res.json(await Tag.find().sort({ usageCount: -1 })); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/tags/  для авторизованных юзеров, создаем тег, отдаем его, если тег с таким slug уже существует - отдаем существующий тег, если в запросе нет цвета - ставим цвет по умолчанию
router.post('/', protect, async (req, res) => {
  try {
    const { name, color } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const existing = await Tag.findOne({ slug });
    if (existing) return res.json(existing);
    const tag = await Tag.create({ name: name.toLowerCase(), slug, color: color || '#27ae60' });
    res.status(201).json(tag);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
