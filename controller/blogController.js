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
            blogCategory: validCategories,
            isActive: true
        });

        return res.status(201).json({ message: "Blog created successfully", success: true, data: newBlog });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
}

export async function getBlogs(req, res) {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const skip = parseInt(req.query.skip) || 0;
        const search = req.query.search || "";
        const type = req.query.type || "public";

        const filter = {
            blogType: type,
            isActive: true
        };

        const blogs = await Blog.aggregate([
            {
                $match: {
                    blogType: type,
                    $or: [
                        { isActive: true },
                    ]
                }
            },

            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            {
                $unwind: {
                    path: "$userDetails",
                    preserveNullAndEmptyArrays: true
                }
            },

            {
                $lookup: {
                    from: "blogcategories",
                    localField: "blogCategory",
                    foreignField: "_id",
                    as: "categoryDetails"
                }
            },
            {
                $unwind: {
                    path: "$categoryDetails",
                    preserveNullAndEmptyArrays: true
                }
            },

            ...(search
                ? [{
                    $match: {
                        $or: [
                            { title: { $regex: search, $options: "i" } },
                            { "categoryDetails.name": { $regex: search, $options: "i" } }
                        ]
                    }
                }]
                : []),

            {
                $group: {
                    _id: "$_id",
                    title: { $first: "$title" },
                    userName: { $first: "$userDetails.name" },
                    description: { $first: "$description" },
                    blogType: { $first: "$blogType" },
                    userId: { $first: "$userId" },
                    createdAt: { $first: "$createdAt" },
                    updatedAt: { $first: "$updatedAt" },
                    categoryDetails: { $push: "$categoryDetails" }
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
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export async function getBlog(req, res) {
    try {
        const blog = await Blog.findOne({ _id: req.params.id, isActive: true })
            .populate({
                path: "userId",
                select: "name"
            })
            .populate({
                path: "blogCategory",
                select: "name"
            });
        if (!blog) {
            return res.status(404).json({ message: "Blog not found", success: false });
        }

        return res.status(200).json({ message: "Blog fetched successfully", success: true, data: blog });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
}

export async function getBlogsByUser(req, res) {
    try {
        const { userId } = req.params;
        const limit = parseInt(req.query.limit) || 5;
        const skip = parseInt(req.query.skip) || 0;
        const search = req.query.search || "";
        const type = req.query.blogType || "";

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: "Invalid userId" });
        }

        const baseMatch = {
            userId: new mongoose.Types.ObjectId(userId),
            isActive: true,
            ...(type && { blogType: type })
        };

        const searchMatch = search
            ? {
                $or: [
                    { title: { $regex: search, $options: "i" } },
                    { description: { $regex: search, $options: "i" } },
                    { "categoryDetails.name": { $regex: search, $options: "i" } }
                ]
            }
            : null;

        const blogs = await Blog.aggregate([
            {
                $match: baseMatch
            },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            {
                $unwind: {
                    path: "$userDetails",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "blogcategories",
                    localField: "blogCategory",
                    foreignField: "_id",
                    as: "categoryDetails"
                }
            },
            {
                $match: searchMatch || {}
            },
            {
                $group: {
                    _id: "$_id",
                    title: { $first: "$title" },
                    description: { $first: "$description" },
                    blogType: { $first: "$blogType" },
                    userId: { $first: "$userId" },
                    userName: { $first: "$userDetails.name" },
                    createdAt: { $first: "$createdAt" },
                    updatedAt: { $first: "$updatedAt" },
                    categoryDetails: { $first: "$categoryDetails" }
                }
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit }
        ]);

        const totalResult = await Blog.aggregate([
            {
                $match: baseMatch
            },
            {
                $lookup: {
                    from: "blogcategories",
                    localField: "blogCategory",
                    foreignField: "_id",
                    as: "categoryDetails"
                }
            },
            {
                $match: searchMatch || {}
            },
            {
                $count: "total"
            }
        ]);

        const total = totalResult[0]?.total || 0;

        return res.status(200).json({
            success: true,
            message: "User blogs fetched successfully",
            data: blogs,
            hasMore: skip + blogs.length < total,
            total
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export async function updateBlog(req, res) {
    try {
        const { title, description, blogType, blogCategory } = req.body;
        const userId = req.user.id;

        if (!userId) {
            return res.status(400).json({ message: "UserId is required", success: false });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid userId", success: false });
        }

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid blog id", success: false });
        }

        const blog = await Blog.findOne({ _id: req.params.id, isActive: true });

        if (!blog) {
            return res.status(404).json({ message: "Blog not found", success: false });
        }

        if (blog.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "You are not authorized to edit this blog", success: false });
        }

        const hoursSinceCreation =(Date.now() - new Date(blog.createdAt).getTime()) / (1000 * 60 * 60);

        if (hoursSinceCreation > 24) {
            return res.status(403).json({ message: "Blog can only be edited within 24 hours of creation", success: false });
        }

        const validTypes = ["public", "private"];
        const finalBlogType = blogType && validTypes.includes(blogType) ? blogType : blog.blogType;

        let validCategories = blog.blogCategory;
        if (blogCategory && Array.isArray(blogCategory)) {
            validCategories = blogCategory.filter(id =>
                mongoose.Types.ObjectId.isValid(id)
            );
        }

        blog.title = title ?? blog.title;
        blog.description = description ?? blog.description;
        blog.blogType = finalBlogType;
        blog.blogCategory = validCategories;

        await blog.save();

        return res.status(200).json({ message: "Blog updated successfully", success: true, data: blog });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
}

export async function deleteBlog(req, res) {
    try {
        const blog = await Blog.findOne({ _id: req.params.id, isActive: true });
        if (!blog) {
            return res.status(404).json({ message: "Blog not found", success: false });
        }

        blog.isActive = false;
        await blog.save();

        return res.status(200).json({ message: "Blog deleted successfully", success: true });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
}

export async function toggleBlogType(req, res) {
    try {
        const blog = await Blog.findOne({ _id: req.params.blogId, isActive: true });
        if (!blog) {
            return res.status(404).json({ message: "Blog not found", success: false });
        }

        if (!blog.userId.equals(new mongoose.Types.ObjectId(req.user.id))) {
            return res.status(403).json({
                message: "You are not allowed to change this blog status",
                success: false
            });
        }

        blog.blogType = blog.blogType === "public" ? "private" : "public";
        await blog.save();

        return res.status(200).json({
            message: `Blog is now ${blog.blogType}`,
            success: true,
            data: blog
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
}