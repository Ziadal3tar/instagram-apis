import { asyncHandler } from '../../../services/asyncHandler.js';
import { findById, findByIdAndDelete, findOneAndUpdate, findOne, find, findByIdAndUpdate, create, findOneAndDelete } from '../../../../DB/DBMethods.js';
import cloudinary from '../../../services/cloudinary.js'
import postModel from '../../../../DB/model/post.model.js';
import userModel from '../../../../DB/model/user.model.js';
import reelModel from '../../../../DB/model/reel.model.js';
const postPop = [
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

    }

];
export const addPost = asyncHandler(async (req, res, next) => {
    const paths = req.files;
    if (!paths || paths.length === 0) {
        return res.status(400).json({ success: false, error: 'No files uploaded.' });
    }
    const postsImgAndVideos = await Promise.all(paths.map(async (element) => {
        if (element.fieldname === 'video') {
            return new Promise((resolve, reject) => {
                cloudinary.uploader.upload_large(
                    element.path,
                    {
                        resource_type: 'video',
                        folder: 'insta/posts',
                    },
                    (error, videoResult) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve({
                                url: videoResult.secure_url || '',
                                public_id: videoResult.public_id || '',
                                type: element.fieldname,
                            });
                        }
                    }
                );
            });
        } else {
            return new Promise((resolve, reject) => {
                cloudinary.uploader.upload(
                    element.path,
                    { folder: 'insta/posts' },
                    (error, imageResult) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve({
                                url: imageResult.secure_url || '',
                                public_id: imageResult.public_id || '',
                                type: element.fieldname,
                            });
                        }
                    }
                );
            });
        }
    }));
    req.body.createdBy = req.user._id
    req.body.postsImgAndVideos = postsImgAndVideos
    let addPost = new postModel(req.body);
    let savedPost = await addPost.save();

    if (savedPost) {
        const updateUserPosts = await findByIdAndUpdate({
            model: userModel, condition: req.user._id, data: {
                $addToSet: { posts: savedPost._id },
            },
            options: { new: true },
        });
        res.status(200).json({ success: true, data: savedPost });
    }
});

export const like = asyncHandler(async (req, res, next) => {
    let { _id, type } = req.body
    let userId = req.user._id




    const like = async (model) => {

        let post = await findById({ model, condition: _id })
        let ifLike = post.likes.includes(userId)
        if (!ifLike) {
            let addLikeForPost = await findByIdAndUpdate({
                model, condition: _id, data: {
                    $addToSet: { likes: userId },
                },
                options: { new: true },

            })
            if (addLikeForPost) {
                let newItem = await findById({ model, condition: _id, populate: [...postPop] })

                res.status(200).json({ success: true, message: 'added', newItem });
            }
        } else {
            let removeLikeForPost = await findByIdAndUpdate({
                model, condition: _id, data: {
                    $pull: { likes: userId },
                },
                options: { new: true },
            })
            if (removeLikeForPost) {
                let newItem = await findById({ model, condition: _id, populate: [...postPop] })

                res.status(200).json({ success: true, message: 'removed', newItem });
            }
        }
    }


    if (type == 'post') {
        like(postModel)
    } else if (type == 'reel') {
        like(reelModel)
    }
});

export const addComment = asyncHandler(async (req, res, next) => {
    let { _id, type, comment } = req.body
    let userId = req.user._id




    const addComment = async (model) => {
        let newComment = {
            comment, userId
        }


        let update = await findByIdAndUpdate({
            model: model, condition: _id, data: { $push: { comments: newComment } },
            options: { new: true },
        })
        let post = await findById({ model, condition: _id, populate: [...postPop] })
        if (update) {
            res.status(200).json({
                success: true,
                message: 'Comment added successfully',
                post
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Post not found',
            });

        }
    }
    if (type == 'post') {

        addComment(postModel)

    } else if (type == 'reel') {
        addComment(reelModel)

    }
});
export const getPostById = asyncHandler(async (req, res, next) => {
    const { _id } = req.body
    let post = await findById({ model: postModel, condition: _id, populate: [...postPop] })
    if (post) {
        res.status(200).json({
            post
        });
    } else {
        let post = await findById({ model: reelModel, condition: _id, populate: [...postPop] })
        if (post) {
            res.status(200).json({
                post
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Post not found',
            });
        }


    }
});


export const explore = asyncHandler(async (req, res, next) => {

    try {
      
        console.log('ff');

        const MIN_ITEMS = 20;

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        let trending = await postModel.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            { $addFields: { score: { $add: [{ $size: "$likes" }, { $multiply: [{ $size: "$comments" }, 2] }] } } },
            { $sort: { score: -1, createdAt: -1 } },
            { $limit: 50 }
        ]);

        if (trending.length < MIN_ITEMS) {
            const recent = await postModel.find({})
                .sort({ createdAt: -1 })
                .limit(100)
                .populate({
                    path: 'createdBy',
                    select: 'userName fullName profilePic followers following posts',
                    populate: {
                        path: 'posts',
                        select: 'caption postsImgAndVideos createdAt'
                    }
                }).populate('comments.userId', 'userName profilePic')
                .lean();

            const map = new Map();
            for (const p of [...trending, ...recent]) {
                map.set(String(p._id), p);
            }
            const items = Array.from(map.values()).slice(0, 50);
            return res.json({ items, count: items.length, fallback: true });
        }
        const trendingIds = trending.map(t => t._id);
        const populated = await postModel.find({ _id: { $in: trendingIds } })
            .populate({
                path: 'createdBy',
                select: 'userName fullName profilePic followers following posts',
                populate: {
                    path: 'posts',
                    select: 'caption postsImgAndVideos createdAt'
                }
            }).populate('comments.userId', 'userName profilePic')
            .lean();

        return res.json({ items: populated, count: populated.length, fallback: false });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});
