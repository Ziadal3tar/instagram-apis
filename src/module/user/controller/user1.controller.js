import userModel from '../../../../DB/model/user.model.js'
import postModel from '../../../../DB/model/post.model.js'


import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../../../services/asyncHandler.js';
import { findById, findByIdAndDelete, findOneAndUpdate, findOne, find, findByIdAndUpdate, create, findOneAndDelete } from '../../../../DB/DBMethods.js';
import cloudinary from '../../../services/cloudinary.js'
import { populate } from 'dotenv';
import reelModel from '../../../../DB/model/reel.model.js';
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
    }

    , {
        path: "notifications.data",
    }
];
export const newCollection = asyncHandler(async (req, res, next) => {

    let { collectionName } = req.body
    let newCollection = { collectionName }
    let addCollection = await findByIdAndUpdate({
        model: userModel, condition: req.user._id, data: {
            $addToSet: { collections: newCollection },
        },
    })
    if (addCollection) {
        res.status(200).json({
            success: true,
            message: 'collection added',
        });
    } else {
        res.status(400).json({
            success: false,
            message: 'added collection failed',
        });
    }
})

export const savePost = asyncHandler(async (req, res, next) => {
    try {
        const { postId, ref } = req.body;
        if (!postId || !ref) {
            return res.status(400).json({ success: false, message: 'postId and ref are required' });
        }

        const userId = req.user._id;

        const str = (v) => (v == null ? '' : String(v));

        if (ref === 'Post') {
            const isSaved = (req.user.savedPosts || []).some(s => str(s._id ?? s) === str(postId));

            if (isSaved) {
            
                const updatedUser = await findByIdAndUpdate({
                    model: userModel,
                    condition: userId,
                    data: { $pull: { savedPosts: postId } },
                    options: { new: true }
                });

                if (!updatedUser) {
                    return res.status(400).json({ success: false, message: 'Failed to UnSaved post' });
                }

             
                await findByIdAndUpdate({
                    model: userModel,
                    condition: userId,
                    data: { $pull: { "collections.$[].saved": postId } },
                    options: { new: true }
                }).catch(() => null);

                await findByIdAndUpdate({
                    model: userModel,
                    condition: userId,
                    data: { $pull: { "collections.$[].saved": { _id: postId } } },
                    options: { new: true }
                }).catch(() => null);

                return res.status(200).json({ success: true, message: 'Post UnSaved successfully' });

            } else {
                const savedPost = await findByIdAndUpdate({
                    model: userModel,
                    condition: userId,
                    data: { $addToSet: { savedPosts: postId } },
                    options: { new: true }
                });

                if (savedPost) {
                    return res.status(200).json({ success: true, message: 'Post saved successfully' });
                } else {
                    return res.status(400).json({ success: false, message: 'Failed to save post' });
                }
            }
        } else if (ref === 'Reel') {
            const isSaved = (req.user.savedReels || []).some(s => str(s._id ?? s) === str(postId));

            if (isSaved) {
                const updatedUser = await findByIdAndUpdate({
                    model: userModel,
                    condition: userId,
                    data: { $pull: { savedReels: postId } },
                    options: { new: true }
                });

                if (!updatedUser) {
                    return res.status(400).json({ success: false, message: 'Failed to UnSaved reel' });
                }

                await findByIdAndUpdate({
                    model: userModel,
                    condition: userId,
                    data: { $pull: { "collections.$[].saved": postId } },
                    options: { new: true }
                }).catch(() => null);

                await findByIdAndUpdate({
                    model: userModel,
                    condition: userId,
                    data: { $pull: { "collections.$[].saved": { _id: postId } } },
                    options: { new: true }
                }).catch(() => null);

                return res.status(200).json({ success: true, message: 'Reel UnSaved successfully' });
            } else {
                const savedPost = await findByIdAndUpdate({
                    model: userModel,
                    condition: userId,
                    data: { $addToSet: { savedReels: postId } },
                    options: { new: true }
                });

                if (savedPost) {
                    return res.status(200).json({ success: true, message: 'Reel saved successfully' });
                } else {
                    return res.status(400).json({ success: false, message: 'Failed to save reel' });
                }
            }

        } else {
            return res.status(400).json({ success: false, message: 'Invalid ref value' });
        }

    } catch (err) {
        next(err);
    }
});
export const addToCollection = asyncHandler(async (req, res, next) => {
    try {
        const { selected, collectionId } = req.body;

        if (!Array.isArray(selected) || selected.length === 0) {
            return res.status(400).json({ success: false, message: 'selected must be a non-empty array' });
        }
        if (!collectionId) {
            return res.status(400).json({ success: false, message: 'collectionId is required' });
        }

        const userId = req.user && req.user._id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const user = await findById({ model: userModel, condition: userId });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const theCollection = user.collections && user.collections.find(item => String(item._id) === String(collectionId));
        if (!theCollection) {
            return res.status(404).json({ success: false, message: 'Collection not found' });
        }

        if (!Array.isArray(theCollection.saved)) {
            theCollection.saved = [];
        }

        for (const element of selected) {
            if (!theCollection.saved.includes(element)) {
                theCollection.saved.push(element);
            }
        }

        const savedUpdate = await findByIdAndUpdate({
            model: userModel,
            condition: userId,
            data: { collections: user.collections },
            options: { new: true }
        });

        return res.status(200).json({ success: true, message: 'Items added to collection successfully', collection: savedUpdate.collections });
    } catch (err) {
        console.error('addToCollection error ->', err);
        return res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});
export const getPostsBasedOnSocialNetwork = asyncHandler(async (req, res, next) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // احصل على following و followers-of-me (fOfF)
  const user = await userModel.findById(req.user._id).select('following').lean();
  const following = user?.following || [];

  const fOfF = await userModel.find({ following: req.user._id }).select('_id').lean();
  const fOfFIds = (fOfF || []).map(u => u._id);

  const feedUsers = [...new Set([...(following || []), ...fOfFIds.map(String), String(req.user._id)])];

  // لو استخدمنا pagination على الـ combined feed نحتاج نجيب كمية كافية من كل مصدر
  const fetchCountPerSource = page * limit; // نجلب هذا العدد من كل نوع لتأمين دمج كافٍ

  // جلب posts و reels متوازيًا
  const [postsRaw, reelsRaw] = await Promise.all([
    postModel.find({ createdBy: { $in: feedUsers } })
      .select('caption postsImgAndVideos createdBy comments likes createdAt url public_id') // اختصر الحقول
      .populate({
        path: "createdBy",
        select: "userName profilePic", // لا تملأ كل الحقول الثقيلة
      })
      .populate({
        path: "comments",
        populate: { path: "userId", select: "userName profilePic" }
      })
      .sort({ createdAt: -1 })
      .limit(fetchCountPerSource)
      .lean(),

    reelModel.find({ createdBy: { $in: feedUsers } })
      .select('caption url public_id createdBy comments likes createdAt') // اختصر الحقول
      .populate({
        path: "createdBy",
        select: "userName profilePic",
      })
      .populate({
        path: "comments",
        populate: { path: "userId", select: "userName profilePic" }
      })
      .sort({ createdAt: -1 })
      .limit(fetchCountPerSource)
      .lean()
  ]);

  // ضع علامة type على كل عنصر
  const postsWithType = (postsRaw || []).map(p => ({ ...p, type: 'post' }));
  const reelsWithType = (reelsRaw || []).map(r => ({ ...r, type: 'reel' }));

  // دمج و ترتيب
  const combined = [...postsWithType, ...reelsWithType]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // تحقق من وجود المزيد: لو جمعنا أكثر من page*limit في combined => هناك صفحات لاحقة
  const totalFetched = combined.length;
  const start = skip;
  const end = skip + limit;
  const pageItems = combined.slice(start, end);

  const hasMore = totalFetched > end;

  res.json({
    page,
    limit,
    posts: pageItems,
    hasMore
  });
});

export const allNotificationSeen = asyncHandler(async (req, res, next) => {
    let user = req.user;

    user.notifications.forEach(notification => {
        notification.seen = true;
    });

    await user.save();
    res.status(200).json({
        success: true
    });
});
export const bio = asyncHandler(async (req, res, next) => {
    let user = req.user;

    user.bio = req.body.bio

    await user.save();
    res.status(200).json({
        success: true
    });
});
export const getSavedAndPosts = asyncHandler(async (req, res, next) => {

  const user = req.user;

  const savedPostIds = user.savedPosts?.map(p => p._id || p) || [];
  const savedReelIds = user.savedReels?.map(r => r._id || r) || [];

  const savedPosts = await postModel.find({ _id: { $in: savedPostIds } })
    .select("caption postsImgAndVideos createdBy comments likes createdAt")
    .populate([
      { path: "createdBy", select: "userName fullName profilePic" },
      {
        path: "comments",
        populate: { path: "userId", select: "userName fullName profilePic" }
      }
    ])
    .lean();

  const savedReels = await reelModel.find({ _id: { $in: savedReelIds } })
    .select("caption url createdBy comments likes createdAt")
    .populate([
      { path: "createdBy", select: "userName fullName profilePic" },
      {
        path: "comments",
        populate: { path: "userId", select: "userName fullName profilePic" }
      }
    ])
    .lean();


  const saved = [...savedPosts, ...savedReels]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  
  res.status(200).json({
    saved,
  });

});

export const deleteCollection = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ success: false, message: 'id is required' });
    }

    const updatedUser = await findByIdAndUpdate({
        model: userModel,
        condition: userId,
        data: { $pull: { collections: { _id: id } } },
        options: { new: true }
    });

    if (!updatedUser) {
        return res.status(400).json({ success: false, message: 'Failed to delete collection' });
    }

    return res.status(200).json({ success: true, message: 'Collection deleted successfully', collections: updatedUser.collections });
});
