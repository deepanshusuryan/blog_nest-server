import BlogCategory from "../models/BlogCategory.js";
import mongoose from "mongoose";

export async function createCategory(req, res) {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ message: "Blog Category name is required", success: false });
        }

        const existingCategory = await BlogCategory.findOne({
            name: { $regex: `^${name}$`, $options: "i" }
        });
        if (existingCategory) {
            return res.status(400).json({ message: "Blog Category already exist", success: false });
        }

        const newCategory = await BlogCategory.create({
            name: name,
            isActive: true
        })

        return res.status(200).json({ message: "Blog Category created successfully", success: true, newCategory });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
}

export async function getCategories(req, res) {
    try {
        const categories = await BlogCategory.find({});
        if (!categories.length === 0) {
            return res.status(400).json({ message: "Categories not found", success: false });
        }

        return res.status(200).json({ message: "Categories fetched successfully", success: true, categories });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
}

export async function getCategory(req, res) {
    try {
        const id = req.params.id;
        const category = await BlogCategory.findById(id);
        if (!category) {
            return res.status(400).json({ message: "Category not found", success: false });
        }

        return res.status(200).json({ message: "Category fetched successfully", success: true, category });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
}

export async function updateCategory(req, res) {
    try {
        const { id, name } = req.body;
        if (!id || !name) {
            return res.status(400).json({ message: "Id and Name is required", success: false })
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid ID", success: false });
        }

        const category = await BlogCategory.findById(id);
        if (!category) {
            return res.status(404).json({ message: "Category not found", success: false });
        }

        const updatedCategory = await BlogCategory.findByIdAndUpdate(id, {
            name: name
        }, { new: true })

        return res.status(200).json({ message: "Blog Category Updated", success: true, updateCategory })

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
}

export async function toggleCategoryStatus(req, res) {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ message: "Blog Category ID is required", success: false });
        }

        const category = await BlogCategory.findById(id);

        if (!category) {
            return res.status(404).json({ message: "Blog Category not found", success: false });
        }

        category.isActive = !category.isActive;
        await category.save();

        return res.status(200).json({ message: "Blog Category deleted successfully", success: true });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
}