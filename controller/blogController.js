import Blog from "../models/Blog.js";
import mongoose from "mongoose";

export async function createBlog(req, res) {
    try {
        const { title, description, blogType, blogCategory } = req.body;
        const userId = req.user.id;

        if (!title || !description || !userId || !blogType) {
            return res.status(400).json({ message: "Title, description and userId are required", success: false });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid userId", success: false });
        }

        const validTypes = ["public", "private"];
        const finalBlogType = blogType && validTypes.includes(blogType) ? blogType : "public";

        let validCategories = [];
        if (blogCategory && Array.isArray(blogCategory)) {
            validCategories = blogCategory.filter(id => mongoose.Types.ObjectId.isValid(id));
        }

        const newBlog = await Blog.create({
            title,
            description,
            userId,
            blogType: finalBlogType,
            blogCategory: validCategories
        });

        return res.status(201).json({ message: "Blog created successfully", success: true, data: newBlog });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
}

export async function getBlogs(req, res) {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const skip = parseInt(req.query.skip) || 0;
        const search = req.query.search || "";
        const type = req.query.type || "public";

        let filter = {
            blogType: type
        };

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } }
            ];
        }

        const blogs = await Blog.aggregate([
            {
                $lookup: {
                    from: "blogcategories",
                    localField: "blogCategory",
                    foreignField: "_id",
                    as: "categoryDetails"
                }
            },
            {
                $match: {
                    ...filter,
                    ...(search && {
                        $or: [
                            { title: { $regex: search, $options: "i" } },
                            { "categoryDetails.name": { $regex: search, $options: "i" } }
                        ]
                    })
                }
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit }
        ]);

        const total = await Blog.countDocuments(filter);

        return res.status(200).json({
            success: true,
            message: "Blogs fetched successfully",
            data: blogs,
            hasMore: skip + limit < total
        });

    } catch (error) {
        console.error(error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

export async function getBlog(req, res) {
    try {
        const blog = await Blog.findById(req.params.id)
        if (!blog) {
            return res.status(404).json({ message: "Blog not found", success: false })
        }

        return res.status(200).json({ message: "Blog fetched successfully", success: true, data: blog })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal server error", success: false })
    }
}

export async function updateBlog(req, res) {
    try {
        const { title, description, id } = req.body;
        const updatedBlog = await Blog.findByIdAndUpdate(id, { title, description }, { new: true });

        if (!updatedBlog) {
            return res.status(404).json({ message: "Blog not found", success: false })
        }

        return res.status(200).json({ message: "Blog updated successfully", success: true, updatedBlog: updatedBlog })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", succsess: false })
    }
}

export async function deleteBlog(req, res) {
    try {
        const deletedBlog = await Blog.findByIdAndDelete(req.params.id);
        if (!deletedBlog) {
            return res.status(404).json({ message: "Blog not found", success: false })
        }

        return res.status(200).json({ message: "Blog Deleted successfully", success: true, deletedBlog: deletedBlog })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", success: false })
    }
}