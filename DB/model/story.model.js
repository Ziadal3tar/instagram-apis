import { Schema, model, Types } from "mongoose";


const storySchema = new Schema({
    caption: {
        type: String,
    },
    duration: {
        type: String,
        default:10
    },
    left: {
        type: String,
        default:0
    },
    top: {
        type: String,
        default:0
    },
    color: {
        type: String,
        default:'#fff'
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

    viewer: [
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
        type: {
      type: String,
      required: true,
      enum: ['image', 'video','text']
  },
}, {
    timestamps: true
})


const storyModel = model('Story', storySchema);
export default storyModel