import { Schema, model, Types } from "mongoose";
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

const reelSchema = new Schema({
    caption: {
        type: String,
    },

    public_id: {
        type: String,
        required: true
    },
    url: {
        type: String,
    },
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


const reelModel = model('Reel', reelSchema);
export default reelModel