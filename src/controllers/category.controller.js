const Category = require('../models/category.model');
const AppError = require('../utils/error.utils');

// Create category
const createCategory = async (req, res, next) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return next(new AppError('Category name is required', 400));
        }

        const category = await Category.create({ name, description });

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: category
        });

    } catch (error) {
        next(error);
    }
};

// Get all categories
const getAllCategories = async (req, res, next) => {
    try {
        const categories = await Category.find({ isDeleted: false })
            .sort({ name: 1 });

        res.status(200).json({
            success: true,
            total: categories.length,
            data: categories
        });

    } catch (error) {
        next(error);
    }
};

// Update category
const updateCategory = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category || category.isDeleted) {
            return next(new AppError('Category not found', 404));
        }

        const updatedCategory = await Category.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Category updated successfully',
            data: updatedCategory
        });

    } catch (error) {
        next(error);
    }
};

// Delete category (soft delete)
const deleteCategory = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category || category.isDeleted) {
            return next(new AppError('Category not found', 404));
        }

        category.isDeleted = true;
        await category.save();

        res.status(200).json({
            success: true,
            message: 'Category deleted successfully'
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    createCategory,
    getAllCategories,
    updateCategory,
    deleteCategory
};