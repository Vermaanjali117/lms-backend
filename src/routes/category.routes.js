const express = require('express');
const router = express.Router();
const {
    createCategory,
    getAllCategories,
    updateCategory,
    deleteCategory
} = require('../controllers/category.controller');
const { protect, authorizeRoles } = require('../middlewares/auth.middleware');

// Public - anyone can see categories
router.get('/', getAllCategories);

// Admin only
router.post('/', protect, authorizeRoles('admin'), createCategory);
router.put('/:id', protect, authorizeRoles('admin'), updateCategory);
router.delete('/:id', protect, authorizeRoles('admin'), deleteCategory);

module.exports = router;