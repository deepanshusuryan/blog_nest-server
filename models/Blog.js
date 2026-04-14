import mongoose from "mongoose";

const blogSchema=new mongoose.Schema({
    title:{
        type: String,
        required: true
    },
    description:{
        type:String,
        required: true
    },
    blogType:{
        type:String,
        enum:["public", "private"],
        default: "public"
    },
    blogCategory:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"BlogCategory"
    }],
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required: true
    },
    isActive:{
        type:Boolean,
        required:true,
    }
}, {timestamps:true})

const Blog=mongoose.model("Blog",blogSchema);

export default Blog;