import { Schema, model, Types } from "mongoose";
import bcrypt from 'bcrypt'
let replySchema = new Schema({
    userId: {
        type: Types.ObjectId,
        ref: "User"
    },
    reply: {
        type: String,
        required: true
    },
    hide: {
        type: Boolean,
        default: false
    },
    
})
let commentsSchema = new Schema({
    userId: {
        type: Types.ObjectId,
        ref: "User"
    },
    comment: {
        type: String,
        required: true
    },
    
    replies: [replySchema]

})
let postsImgAndVideosSchema = new Schema({
    url: {
        type: String,
    },
    public_id: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enums: ["videos", "image"]

    },

})
const postSchema = new Schema({
    caption: {
        type: String,
    },

    postsImgAndVideos: [postsImgAndVideosSchema],

    createdBy:
    {
        type: Types.ObjectId,
        ref: "User",
    },

    tags: [
        {
            type: Types.ObjectId,
            ref: "User",
        },
    ],
    likes: [
        {
            type: Types.ObjectId,
            ref: "User",
        },
    ],
    comments: [commentsSchema]
}, {
    timestamps: true
})


const postModel = model('Post', postSchema);
export default postModel