import Blog from "../models/Blog.js";

export async function createBlog(req, res) {
    try {
        const { title, description, userId } = req.body;
        if (!description || !userId) {
            return res.status(400).json({ message: "Please give description and userId" })
        }

        const newBlog = await Blog.create({
            title, description, userId
        })
        return res.status(201).json({ message: "Blog created successfully", success: true, data: newBlog })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", success: false })
    }
}

export async function getBlogs(req, res) {
    try {
        const blogs = await Blog.find({});
        if (!blogs) {
            return res.status(404).json({ message: "No blogs found", success: false })
        }

        return res.status(200).json({ message: "Blog fetched successfully", success: true, data: blogs })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal server error", success: false })
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