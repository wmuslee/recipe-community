const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');
const Tag = require('../models/Tag');
const { protect, optionalAuth } = require('../middleware/protect');

const populate = (q) =>
  q.populate('author', 'username avatar')
   .populate('category', 'name slug color icon')
   .populate('tags', 'name color slug');

// GET /api/recipes с поддержкой фильтров, сортировки и пагинации, если в запросе есть токен - добавляем информацию о том, лайкнул ли юзер рецепт и сохранил ли он его
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { search, category, tag, difficulty, maxTime, sort = 'newest', page = 1, limit = 12 } = req.query;

    const q = {};
    if (search) {
      q.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'ingredients.name': { $regex: search, $options: 'i' } },
      ];
    }
    if (category) q.category = category;
    if (difficulty) q.difficulty = difficulty;
    if (maxTime) q.cookingTime = { $lte: Number(maxTime) };
    if (tag) q.tags = { $in: [tag] };

    const sorts = { newest: { createdAt: -1 }, oldest: { createdAt: 1 }, popular: { likesCount: -1 } };
    const skip = (Number(page) - 1) * Number(limit);

    const [recipes, total] = await Promise.all([
      populate(Recipe.find(q)).sort(sorts[sort] || sorts.newest).skip(skip).limit(Number(limit)),
      Recipe.countDocuments(q),
    ]);

    res.json({ recipes, total, totalPages: Math.ceil(total / Number(limit)), currentPage: Number(page) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/recipes/user/:userId отдаем все рецепты пользователя, сортируем по дате создания (новые первыми), добавляем данные авторов рецептов (username и avatar)
router.get('/user/:userId', async (req, res) => {
  try {
    const recipes = await populate(Recipe.find({ author: req.params.userId })).sort({ createdAt: -1 });
    res.json(recipes);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/recipes/:id отдаем рецепт по id, если в запросе есть токен - добавляем информацию о том, лайкнул ли юзер рецепт и сохранил ли он его, +1
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const recipe = await populate(Recipe.findById(req.params.id));
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
    await Recipe.findByIdAndUpdate(req.params.id, { $inc: { viewsCount: 1 } });
    res.json(recipe);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/recipes для авторизованных юзеров, создаем рецепт, отдаем его, если в запросе есть теги - +1
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, ingredients, instructions, cookingTime, servings, difficulty, image, category, tags } = req.body;
    const recipe = await Recipe.create({ title, description, ingredients, instructions, cookingTime, servings, difficulty, image, category, tags, author: req.user._id });
    if (tags?.length) await Tag.updateMany({ _id: { $in: tags } }, { $inc: { usageCount: 1 } });
    const full = await populate(Recipe.findById(recipe._id));
    res.status(201).json(full);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/recipes/:id для авторов рецептов, обновляем рецепт, отдаем обновленный рецепт
router.put('/:id', protect, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
    if (recipe.author.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });

    ['title','description','ingredients','instructions','cookingTime','servings','difficulty','image','category','tags'].forEach(f => {
      if (req.body[f] !== undefined) recipe[f] = req.body[f];
    });
    await recipe.save();
    const full = await populate(Recipe.findById(recipe._id));
    res.json(full);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE /api/recipes/:id для авторов рецептов и админов, удаляем рецепт, отдаем сообщение об удалении, если в запросе есть теги - -1
router.delete('/:id', protect, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
    if (recipe.author.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });
    await recipe.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/recipes/:id/like для авторизованных юзеров, если юзер уже лайкнул рецепт - убираем лайк, если не лайкнул - ставим лайк, отдаем количество лайков и флаг, поставил ли юзер лайк
router.post('/:id/like', protect, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
    const uid = req.user._id;
    const liked = recipe.likedBy.includes(uid);
    if (liked) { recipe.likedBy.pull(uid); recipe.likesCount = Math.max(0, recipe.likesCount - 1); }
    else { recipe.likedBy.push(uid); recipe.likesCount += 1; }
    await recipe.save();
    res.json({ likesCount: recipe.likesCount, isLiked: !liked });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/recipes/:id/save для авторизованных юзеров, если юзер уже сохранил рецепт - убираем из сохраненных, если не сохранил - добавляем в сохраненные, отдаем флаг, сохранил ли юзер рецепт
router.post('/:id/save', protect, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user._id);
    const rid = req.params.id;
    const saved = user.savedRecipes.includes(rid);
    if (saved) user.savedRecipes.pull(rid);
    else user.savedRecipes.push(rid);
    await user.save();
    res.json({ isSaved: !saved });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
