import Blog from "../models/Blog.js";
import mongoose from "mongoose";
import User from "../models/User.js";

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
        const type = req.query.type || null;
        const userId = req.query.userId || null;

        const filter = {
            isActive: true,
            ...(type && { blogType: type }),
            ...(userId && mongoose.Types.ObjectId.isValid(userId) && {
                userId: new mongoose.Types.ObjectId(userId)
            })
        };

        let savedBlogIds = [];
        if (req.user?.id) {
            const currentUser = await User.findById(req.user.id).select("savedBlogs");
            savedBlogIds = currentUser?.savedBlogs || [];
        }

        const blogs = await Blog.aggregate([
            { $match: filter },

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
                    categoryDetails: { $push: "$categoryDetails" },
                    likes: { $first: "$likes" },
                }
            },

            {
                $addFields: {
                    likesCount: { $size: { $ifNull: ["$likes", []] } },
                    isLiked: {
                        $in: [
                            new mongoose.Types.ObjectId(req.user?.id || "000000000000000000000000"),
                            { $ifNull: ["$likes", []] }
                        ]
                    },
                    isSaved: {
                        $in: [
                            "$_id",
                            savedBlogIds.map(id => new mongoose.Types.ObjectId(id))
                        ]
                    }
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
            .populate({ path: "userId", select: "name" })
            .populate({ path: "blogCategory", select: "name" });

        if (!blog) {
            return res.status(404).json({ message: "Blog not found", success: false });
        }

        let isLiked = false;
        let isSaved = false;

        if (req.user?.id) {
            isLiked = blog.likes?.some(
                (id) => id.toString() === req.user.id.toString()
            );

            const currentUser = await User.findById(req.user.id).select("savedBlogs");
            isSaved = currentUser?.savedBlogs?.some(
                (id) => id.toString() === blog._id.toString()
            ) || false;
        }

        const blogData = blog.toObject();

        return res.status(200).json({
            message: "Blog fetched successfully",
            success: true,
            data: {
                ...blogData,
                isLiked,
                isSaved,
                likesCount: blog.likes?.length || 0,
            }
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", success: false });
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
            return res.status(403).json({ message: "You are not allowed to change this blog status", success: false });
        }

        blog.blogType = blog.blogType === "public" ? "private" : "public";
        await blog.save();

        return res.status(200).json({ message: `Blog is now ${blog.blogType}`, success: true, data: blog });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
}

export async function toggleLike(req, res) {
    try {
        const blogId = req.params.id;
        const userId = req.user.id;

        if (!mongoose.Types.ObjectId.isValid(blogId)) {
            return res.status(400).json({ message: "Invalid blog id", success: false });
        }

        const blog = await Blog.findOne({ _id: blogId, isActive: true });
        if (!blog) {
            return res.status(404).json({ message: "Blog not found", success: false });
        }

        const alreadyLiked = blog.likes.some(id => id.toString() === userId.toString());

        if (alreadyLiked) {
            blog.likes = blog.likes.filter(id => id.toString() !== userId.toString());
        } else {
            blog.likes.push(userId);
        }

        await blog.save();

        return res.status(200).json({
            success: true,
            message: alreadyLiked ? "Blog unliked" : "Blog liked",
            liked: !alreadyLiked,
            likesCount: blog.likes.length,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
}

export async function toggleSaveBlog(req, res) {
    try {
        const userId = req.user.id;
        const { blogId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(blogId)) {
            return res.status(400).json({ message: "Invalid blog id", success: false });
        }

        const blog = await Blog.findOne({ _id: blogId, isActive: true });
        if (!blog) {
            return res.status(404).json({ message: "Blog not found", success: false });
        }

        if (blog.userId.toString() === userId.toString()) {
            return res.status(400).json({ success: false, message: "You cannot save your own blog" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found", success: false });
        }

        const alreadySaved = user.savedBlogs.some(id => id.toString() === blogId.toString());

        if (alreadySaved) {
            user.savedBlogs = user.savedBlogs.filter(id => id.toString() !== blogId.toString());
        } else {
            user.savedBlogs.push(blogId);
        }

        await user.save();

        return res.status(200).json({
            success: true,
            message: alreadySaved ? "Blog unsaved" : "Blog saved",
            saved: !alreadySaved,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
}

export async function getSavedBlogs(req, res) {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 5;
        const skip = parseInt(req.query.skip) || 0;
        const search = req.query.search || "";

        const user = await User.findById(userId).select("savedBlogs");
        if (!user) {
            return res.status(404).json({ message: "User not found", success: false });
        }

        if (!user.savedBlogs.length) {
            return res.status(200).json({ success: true, message: "No saved blogs", });
        }

        const savedIds = user.savedBlogs.map(id => new mongoose.Types.ObjectId(id));

        const filter = {
            _id: { $in: savedIds },
        };

        const blogs = await Blog.aggregate([
            { $match: filter },

            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "blogcategories",
                    localField: "blogCategory",
                    foreignField: "_id",
                    as: "categoryDetails"
                }
            },
            { $unwind: { path: "$categoryDetails", preserveNullAndEmptyArrays: true } },

            ...(search ? [{
                $match: {
                    $or: [
                        { title: { $regex: search, $options: "i" } },
                        { "categoryDetails.name": { $regex: search, $options: "i" } }
                    ]
                }
            }] : []),

            {
                $group: {
                    _id: "$_id",
                    title: { $first: "$title" },
                    userName: { $first: "$userDetails.name" },
                    description: { $first: "$description" },
                    blogType: { $first: "$blogType" },
                    isActive: { $first: "$isActive" },
                    userId: { $first: "$userId" },
                    createdAt: { $first: "$createdAt" },
                    updatedAt: { $first: "$updatedAt" },
                    categoryDetails: { $push: "$categoryDetails" },
                    likes: { $first: "$likes" },
                }
            },

            {
                $addFields: {
                    likesCount: { $size: { $ifNull: ["$likes", []] } },
                    isLiked: {
                        $in: [
                            new mongoose.Types.ObjectId(userId),
                            { $ifNull: ["$likes", []] }
                        ]
                    },
                    isSaved: true,
                    isAvailable: {
                        $and: [
                            { $eq: ["$isActive", true] },
                            { $eq: ["$blogType", "public"] }
                        ]
                    }
                }
            },

            { $sort: { isAvailable: -1, createdAt: -1 } },
            { $skip: skip },
            { $limit: limit }
        ]);

        const total = await Blog.countDocuments(filter);

        return res.status(200).json({
            success: true,
            message: "Saved blogs fetched successfully",
            data: blogs,
            hasMore: skip + limit < total,
            total
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}