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
    console.log(gg);
    
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const MIN_ITEMS = 20;

    // ====== بناء feedUsers (following + followers-of-me + me) ======
    const user = await userModel.findById(req.user._id).select('following').lean();
    const following = user?.following || [];

    const fOfF = await userModel.find({ following: req.user._id }).select('_id').lean();
    const fOfFIds = (fOfF || []).map(u => u._id);

    const feedUsers = [...new Set([...(following || []).map(String), ...fOfFIds.map(String), String(req.user._id)])];

    // ====== إعدادات trending (آخر 7 أيام) ======
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // هنجيب trending لكن مقيد بالـ feedUsers
    const trending = await postModel.aggregate([
      { $match: { createdBy: { $in: feedUsers.map(id => mongoose.Types.ObjectId(id)) }, createdAt: { $gte: sevenDaysAgo } } },
      { $addFields: { score: { $add: [{ $size: "$likes" }, { $multiply: [{ $size: "$comments" }, 2] }] } } },
      { $sort: { score: -1, createdAt: -1 } },
      { $limit: 50 } // pool أكبر لدمج و pagination
    ]);

    let allItems = [];

    // لو عدد trending قليل، نعمل fallback بجلب الـ recent من نفس الـ feedUsers
    if ((trending || []).length < MIN_ITEMS) {
      // نجيب recent posts + reels من نفس الـ feedUsers
      const fetchCountPerSource = page * limit || limit;

      const [postsRaw, reelsRaw] = await Promise.all([
        postModel.find({ createdBy: { $in: feedUsers } })
          .select('caption postsImgAndVideos createdBy comments likes createdAt url public_id')
          .populate({
            path: 'createdBy',
            select: 'userName profilePic following followers posts',
            populate: { path: 'posts', select: 'postsImgAndVideos' }
          })
          .populate({
            path: 'comments',
            populate: { path: 'userId', select: 'userName profilePic fullName' }
          })
          .sort({ createdAt: -1 })
          .limit(fetchCountPerSource)
          .lean(),

        reelModel.find({ createdBy: { $in: feedUsers } })
          .select('caption url public_id createdBy comments likes createdAt')
          .populate({
            path: 'createdBy',
            select: 'userName profilePic following followers reels posts',
            populate: { path: 'posts', select: 'postsImgAndVideos' }
          })
          .populate({
            path: 'comments',
            populate: { path: 'userId', select: 'userName profilePic' }
          })
          .sort({ createdAt: -1 })
          .limit(fetchCountPerSource)
          .lean()
      ]);

      // ضع علامة type و ادمج بترتيب createdAt
      const postsWithType = (postsRaw || []).map(p => ({ ...p, type: 'post' }));
      const reelsWithType = (reelsRaw || []).map(r => ({ ...r, type: 'reel' }));

      const combined = [...postsWithType, ...reelsWithType].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // ازالة تكرار (بـ _id) مع المحافظة على الترتيب
      const seen = new Set();
      allItems = combined.filter(item => {
        const id = String(item._id);
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
    } else {
      // ====== عند وجود trending كافٍ: نبحث عن هذه الـ trending posts ونملأها ======
      const trendingIds = trending.map(t => t._id);

      // جلب الـ posts المطابقة لـ trendingIds (لكن ضمن الـ feedUsers أصلاً) مع populate
      const populated = await postModel.find({ _id: { $in: trendingIds }, createdBy: { $in: feedUsers } })
        .select('caption postsImgAndVideos createdBy comments likes createdAt url public_id')
        .populate({
          path: 'createdBy',
          select: 'userName profilePic following followers posts',
          populate: { path: 'posts', select: 'postsImgAndVideos' }
        })
        .populate('comments.userId', 'userName profilePic')
        .lean();

      // نرتب الـ populated بنفس ترتيب trendingIds (الترتيب بحسب الـ score من aggregation)
      const idIndex = new Map(trendingIds.map((id, i) => [String(id), i]));
      populated.sort((a, b) => (idIndex.get(String(a._id)) ?? 0) - (idIndex.get(String(b._id)) ?? 0));

      // ضع نوع لكل عنصر
      allItems = populated.map(p => ({ ...p, type: 'post' }));

      // لو عايز تضيف ريلز ضمن الترند برضه: 
      // (اختياري) لو عايز تضيف ريلز حسب createdAt من نفس الـ feedUsers، فكّر في إدراج منطق مماثل للـ reels هنا.
    }

    // ====== pagination بنفس منطق getPostsBasedOnSocialNetwork ======
    const total = allItems.length;
    const start = skip;
    const end = skip + limit;
    const pageItems = allItems.slice(start, end);
    const hasMore = total > end;
    console.log(posts.length);

    return res.json({
      page,
      limit,
      posts: pageItems,
      total,
      hasMore
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


