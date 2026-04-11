import BlogCategory from "../models/BlogCategory.js";
import mongoose from "mongoose";

export async function createCategory(req, res) {
    try {
        const { name, description } = req.body;
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
            description: description,
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
        const { page = 1, limit = 10, search = "", isActive, sortBy = "createdAt", order = "desc" } = req.query;
        const query = {};

        if (search.trim()) {
            query.name = { $regex: search.trim(), $options: "i" };
        }

        if (isActive !== undefined && isActive !== "") {
            query.isActive = isActive === "true";
        }

        const sortOrder = order === "asc" ? 1 : -1;
        const skip = (Number(page) - 1) * Number(limit);

        const [categories, total] = await Promise.all([
            BlogCategory.find(query)
                .sort({ [sortBy]: sortOrder })
                .skip(skip)
                .limit(Number(limit)),
            BlogCategory.countDocuments(query),
        ]);

        return res.status(200).json({ message: "Categories fetched successfully", success: true, categories, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });

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
        const id = req.params.id;
        const { name, description } = req.body;
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

        const existingCategory = await BlogCategory.findOne({ name: { $regex: `^${name}$`, $options: "i" }, _id: { $ne: id } });
        if (existingCategory) {
            return res.status(400).json({ message: "Two categories cannot have same name", success: false });
        }

        const updatedCategory = await BlogCategory.findByIdAndUpdate(id, {
            name: name,
            description: description
        }, { new: true })

        return res.status(200).json({ message: "Blog Category Updated", success: true, updatedCategory })

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

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid ID", success: false });
        }

        const category = await BlogCategory.findById(id);

        if (!category) {
            return res.status(404).json({ message: "Blog Category not found", success: false });
        }

        category.isActive = !category.isActive;
        await category.save();

        return res.status(200).json({ message: "Blog Category deactivated successfully", success: true });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
}