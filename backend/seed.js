require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/Category');
const Tag = require('./models/Tag');

const categories = [
  { name: 'Breakfast', description: 'Start your day right', slug: 'breakfast', color: '#f59e0b', icon: '🌅' },
  { name: 'Soups', description: 'Warm and hearty soups', slug: 'soups', color: '#3b82f6', icon: '🍲' },
  { name: 'Salads', description: 'Fresh and healthy salads', slug: 'salads', color: '#22c55e', icon: '🥗' },
  { name: 'Main Dishes', description: 'Satisfying main courses', slug: 'main-dishes', color: '#ef4444', icon: '🍽️' },
  { name: 'Desserts', description: 'Sweet treats and pastries', slug: 'desserts', color: '#ec4899', icon: '🍰' },
  { name: 'Drinks', description: 'Beverages and cocktails', slug: 'drinks', color: '#8b5cf6', icon: '🥤' },
  { name: 'Snacks', description: 'Quick bites and appetizers', slug: 'snacks', color: '#f97316', icon: '🥨' },
  { name: 'Pasta', description: 'Italian pasta dishes', slug: 'pasta', color: '#eab308', icon: '🍝' },
];

const tags = [
  { name: 'vegan', slug: 'vegan', color: '#16a34a' },
  { name: 'vegetarian', slug: 'vegetarian', color: '#15803d' },
  { name: 'gluten-free', slug: 'gluten-free', color: '#ca8a04' },
  { name: 'quick', slug: 'quick', color: '#2563eb' },
  { name: 'spicy', slug: 'spicy', color: '#dc2626' },
  { name: 'healthy', slug: 'healthy', color: '#059669' },
  { name: 'budget', slug: 'budget', color: '#7c3aed' },
  { name: 'meal-prep', slug: 'meal-prep', color: '#0891b2' },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    await Category.deleteMany({});
    await Tag.deleteMany({});

    await Category.insertMany(categories);
    await Tag.insertMany(tags);

    console.log('✅ Seed data inserted successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seed();
