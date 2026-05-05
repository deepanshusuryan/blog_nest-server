import Comment from "../models/Comment.js";
import Blog from "../models/Blog.js";
import mongoose from "mongoose";

export async function addComment(req, res) {
    try {
        const { content, parentId } = req.body;
        const blogId = req.params.blogId;
        const userId = req.user.id;

        if (!content?.trim()) {
            return res.status(400).json({ message: "Comment cannot be empty", success: false });
        }

        if (content.length > 500) {
            return res.status(400).json({ message: "Comment cannot exceed 500 characters", success: false });
        }

        if (!mongoose.Types.ObjectId.isValid(blogId)) {
            return res.status(400).json({ message: "Invalid blog id", success: false });
        }

        const blog = await Blog.findOne({ _id: blogId, isActive: true });
        if (!blog) {
            return res.status(404).json({ message: "Blog not found", success: false });
        }

        if (parentId) {
            if (!mongoose.Types.ObjectId.isValid(parentId)) {
                return res.status(400).json({ message: "Invalid parent comment id", success: false });
            }
            const parentComment = await Comment.findOne({ _id: parentId, isActive: true });
            if (!parentComment) {
                return res.status(404).json({ message: "Parent comment not found", success: false });
            }
        }

        const comment = await Comment.create({
            blogId,
            userId,
            content: content.trim(),
            parentId: parentId || null,
        });

        await comment.populate("userId", "name username");

        return res.status(201).json({
            success: true,
            message: "Comment added successfully",
            data: comment
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
}

export async function getComments(req, res) {
    try {
        const { blogId } = req.params;
        const limit  = parseInt(req.query.limit) || 10;
        const skip   = parseInt(req.query.skip)  || 0;

        if (!mongoose.Types.ObjectId.isValid(blogId)) {
            return res.status(400).json({ message: "Invalid blog id", success: false });
        }

        const comments = await Comment.aggregate([
            {
                $match: {
                    blogId:   new mongoose.Types.ObjectId(blogId),
                    parentId: null,
                    isActive: true,
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
            { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },

            {
                $lookup: {
                    from: "comments",
                    let: { commentId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$parentId", "$$commentId"] },
                                        { $eq: ["$isActive", true] }
                                    ]
                                }
                            }
                        },
                        { $count: "total" }
                    ],
                    as: "repliesCount"
                }
            },

            {
                $addFields: {
                    userName:     "$userDetails.name",
                    username:     "$userDetails.username",
                    likesCount:   { $size: { $ifNull: ["$likes", []] } },
                    isLiked: {
                        $in: [
                            new mongoose.Types.ObjectId(req.user?.id || "000000000000000000000000"),
                            { $ifNull: ["$likes", []] }
                        ]
                    },
                    repliesCount: { $ifNull: [{ $arrayElemAt: ["$repliesCount.total", 0] }, 0] },
                    isOwner: {
                        $eq: [
                            "$userId",
                            new mongoose.Types.ObjectId(req.user?.id || "000000000000000000000000")
                        ]
                    }
                }
            },

            {
                $project: {
                    userDetails: 0,
                    likes: 0,
                }
            },

            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit }
        ]);

        const total = await Comment.countDocuments({
            blogId:   new mongoose.Types.ObjectId(blogId),
            parentId: null,
            isActive: true,
        });

        return res.status(200).json({
            success: true,
            message: "Comments fetched successfully",
            data: comments,
            hasMore: skip + limit < total,
            total
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
}

export async function getReplies(req, res) {
    try {
        const { commentId } = req.params;
        const limit = parseInt(req.query.limit) || 5;
        const skip  = parseInt(req.query.skip)  || 0;

        if (!mongoose.Types.ObjectId.isValid(commentId)) {
            return res.status(400).json({ message: "Invalid comment id", success: false });
        }

        const replies = await Comment.aggregate([
            {
                $match: {
                    parentId: new mongoose.Types.ObjectId(commentId),
                    isActive: true,
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
            { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
            {
                $addFields: {
                    userName:   "$userDetails.name",
                    username:   "$userDetails.username",
                    likesCount: { $size: { $ifNull: ["$likes", []] } },
                    isLiked: {
                        $in: [
                            new mongoose.Types.ObjectId(req.user?.id || "000000000000000000000000"),
                            { $ifNull: ["$likes", []] }
                        ]
                    },
                    isOwner: {
                        $eq: [
                            "$userId",
                            new mongoose.Types.ObjectId(req.user?.id || "000000000000000000000000")
                        ]
                    }
                }
            },
            { $project: { userDetails: 0, likes: 0 } },
            { $sort: { createdAt: 1 } },
            { $skip: skip },
            { $limit: limit }
        ]);

        const total = await Comment.countDocuments({
            parentId: new mongoose.Types.ObjectId(commentId),
            isActive: true,
        });

        return res.status(200).json({
            success: true,
            data: replies,
            hasMore: skip + limit < total,
            total
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
}

export async function deleteComment(req, res) {
    try {
        const { commentId } = req.params;
        const userId = req.user.id;

        const comment = await Comment.findOne({ _id: commentId, isActive: true });
        if (!comment) {
            return res.status(404).json({ message: "Comment not found", success: false });
        }

        if (comment.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Not authorized to delete this comment", success: false });
        }

        await Comment.updateMany(
            { $or: [{ _id: commentId }, { parentId: commentId }] },
            { isActive: false }
        );

        return res.status(200).json({ success: true, message: "Comment deleted successfully" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
}

export async function toggleCommentLike(req, res) {
    try {
        const { commentId } = req.params;
        const userId = req.user.id;

        const comment = await Comment.findOne({ _id: commentId, isActive: true });
        if (!comment) {
            return res.status(404).json({ message: "Comment not found", success: false });
        }

        const alreadyLiked = comment.likes.some(id => id.toString() === userId.toString());

        if (alreadyLiked) {
            comment.likes = comment.likes.filter(id => id.toString() !== userId.toString());
        } else {
            comment.likes.push(userId);
        }

        await comment.save();

        return res.status(200).json({
            success: true,
            message: alreadyLiked ? "Comment unliked" : "Comment liked",
            liked: !alreadyLiked,
            likesCount: comment.likes.length,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
}