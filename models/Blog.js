import mongoose from "mongoose";

const noteSchema=new mongoose.Schema({
    title:{
        type: String,
    },
    description:{
        type:String,
        required: true
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required: true
    }
}, {timestamps:true})

const Blog=mongoose.model("Blog",noteSchema);

export default Blog;