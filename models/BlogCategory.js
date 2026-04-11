import mongoose from "mongoose";

const blogCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description:{
        type:String,
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true })

const BlogCategory = mongoose.model("BlogCategory", blogCategorySchema);

export default BlogCategory;