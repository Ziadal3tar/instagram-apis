import { Schema, model, Types } from "mongoose";

let messagesSchema = new Schema({

    message: { required: true, type: String },
    images: {
        type: [String],
    },
    date: { type: String, default: new Date().toLocaleDateString("en") },
    time: {
        type: String, default: new Date().toLocaleTimeString("en-US", {
            hour12: true
        })
    },
    sender: {
        type: Types.ObjectId,
        required: true,
        ref: "User",
    },
    
    
})

const chatsSchema = new Schema({
    userIds: [{
        type: Types.ObjectId,
        ref: "User"
    }],
    messages:[messagesSchema],
    type: {
        type: String,
        enums: ["group", "chat"],
default : 'chat'
    },
})
const chatModel = model('Chat', chatsSchema);
export default chatModel
