import userModel from '../../../../DB/model/user.model.js'

import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../../../services/asyncHandler.js';
import { findById, findByIdAndDelete, findOneAndUpdate, findOne, find, findByIdAndUpdate, create, findOneAndDelete } from '../../../../DB/DBMethods.js';
import cloudinary from '../../../services/cloudinary.js'
import { populate } from 'dotenv';
import { notification } from '../../../../common/notification.js';
const userPop = [
  {
      path: "posts",
   

      populate: [
          {
              path: "createdBy",
          },
          {
              path: "comments",
              populate: [
                  {
                      path: "userId",
                  },
              ]
          },
      ]
  },
  {
    path: "reels",

    populate: [
        {
            path: "createdBy",
        },
        {
            path: "comments",
            populate: [
                {
                    path: "userId",
                },
            ]
        },
    ]
}, 
  {
      path: "visited",
  },
  {
      path: "chats",
  },
  {
      path: "stories",
  },
  {
      path: "savedPosts",
       populate: [
        {
            path: "createdBy",
        },
        {
            path: "comments",
            populate: [
                {
                    path: "userId",
                },
            ]
        },
    ]
  },
  {
      path: "savedReels",
       populate: [
        {
            path: "createdBy",
        },
        {
            path: "comments",
            populate: [
                {
                    path: "userId",
                },
            ]
        },
    ]
  },
  {
      path: "following",
      populate: [
          {
              path: "stories",
          },]
  },
  {
      path: "chats",
      populate: [
          {
              path: "userIds",
          },

      ]
  },
{
      path: "collections",
      populate: [
          {
              path: "saved",
               populate: [
        {
            path: "createdBy",
        },
        {
            path: "comments",
            populate: [
                {
                    path: "userId",
                },
            ]
        },
    ]
          },

      ]
  }
  , {
      path: "notifications.data",
  }
];
export const getUserData = asyncHandler(async (req, res, next) => {
const userPop1 = [

  
    {
        path: "visited",
    },
    {
        path: "stories",
    },

 {
      path: "chats",
      populate: [
          {
              path: "userIds",
          },

      ]
  },
    {
        path: "following",
        populate: [
            {
                path: "stories",
            },]
    }
    , {
        path: "notifications.data",
    }
];
  
    const userData = await userModel
                    .findById(req.user._id)
                    .populate([...userPop1])
                    .exec()

                    
  res.status(200).json({ userData })

})
export const getProfilesData = asyncHandler(async (req, res, next) => {

  let { _id } = req.body
console.log(_id);

  let profile = await findById({ model: userModel, condition: { _id }, populate: [...userPop] })
    const allPosts = [...profile.posts, ...profile.reels]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.status(200).json({ profile,allPosts })

})
export const changeUserImage = asyncHandler(async (req, res, next) => {
  let _id = req.user._id
  let mainImgid = req.user.public_id

  cloudinary.uploader.upload(req.file.path, { folder: "insta/usersImages" }, async function (error, result) {
    const { public_id, secure_url } = result;
    req.user.public_id = public_id;
    req.user.profilePic = secure_url;

    if (result) {
      if (req.user.profilePicType == 'UserImage') {

        await cloudinary.uploader.destroy(mainImgid)
      }

      const updateResult = await findByIdAndUpdate({ model: userModel, condition: _id, data: { public_id, profilePic: secure_url, profilePicType: 'UserImage' } });
      res.json({ success: true, message: 'User image updated successfully', user: req.user });
    } else {
      res.status(500).json({ success: false, message: 'Image upload failed' });
    }
  });
});
export const searchUser = asyncHandler(async (req, res, next) => {
  let _id = req.user._id

  let { text } = req.body
  const regex = new RegExp(text, 'i');  
  const fullNames = await userModel.find({ fullName: { $regex: regex } }).select("fullName userName email profilePic followers");
  const newArray = fullNames.filter(item => item._id.toString() !== _id.toString());

  if (newArray.length > 0) {
    res.json(newArray);
  } else {
    res.status(404).json({ message: 'No users found containing the specified character' });
  }

})
export const getUserById = asyncHandler(async (req, res, next) => {
  const { _id } = req.params

  const user = await findById({ model: userModel, condition: _id, populate: [...userPop] })
  if (!user) {
    res.status(404).json({ message: "User not found" })

  } else {
    res.status(200).json({ message: "user", user })
  }
})
export const visited = asyncHandler(async (req, res, next) => {
  let _id = req.params._id
  if (req.user.visited.includes(_id)) {
    let removed = await findByIdAndUpdate({
      model: userModel, condition: req.user._id, data: {
        $pull: { visited: _id },
      }, options: { new: true }
    })
    let added = await findByIdAndUpdate({
      model: userModel, condition: req.user._id, data: {
        $addToSet: { visited: _id },
      }, options: { new: true }
    })
    res.status(200).json({
      success: true,
    });
  } else {
    let updateUser = await findByIdAndUpdate({
      model: userModel, condition: req.user._id, data: {
        $addToSet: { visited: _id }
      }, options: { new: true }
    })


    res.status(200).json({
      success: true,
    });
  }
})
export const follow = asyncHandler(async (req, res, next) => {
  const _id = req.params._id;
  const meId = req.user._id;

  const targetUser = await userModel.findById(_id);
  if (!targetUser) return res.status(404).json({ success: false, message: "User not found" });

  if (targetUser.followers.includes(meId)) {
    await userModel.findByIdAndUpdate(meId, { $pull: { following: _id } });
    const updatedTarget = await userModel.findByIdAndUpdate(_id, { $pull: { followers: meId } }, { new: true }).select('-password');
    return res.json({ success: true, action: 'unfollow', user: updatedTarget });
  } else {
    await userModel.findByIdAndUpdate(meId, { $addToSet: { following: _id } });
    const updatedTarget = await userModel.findByIdAndUpdate(_id, { $addToSet: { followers: meId } }, { new: true }).select('-password');


    return res.json({ success: true, action: 'follow', user: updatedTarget });
  }
});
