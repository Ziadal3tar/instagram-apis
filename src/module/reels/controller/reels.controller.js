import { asyncHandler } from '../../../services/asyncHandler.js';
import { findById, findByIdAndDelete, findOneAndUpdate, findOne, find, findByIdAndUpdate, create, findOneAndDelete } from '../../../../DB/DBMethods.js';
import cloudinary from '../../../services/cloudinary.js'
import reelModel from '../../../../DB/model/reel.model.js';
import userModel from '../../../../DB/model/user.model.js';

const reelPop = [
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
export const addReel = asyncHandler(async (req, res, next) => {
    const path = req.file;
    if (!path) {
        return res.status(400).json({ success: false, error: 'No files uploaded.' });
    } else {


        const uploadVideoToCloudinary = (path) => {
            return new Promise((resolve, reject) => {
                cloudinary.uploader.upload_large(
                    path,
                    {
                        resource_type: 'video',
                        folder: 'insta/reels',
                    },
                    (error, videoResult) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve({
                                public_id: videoResult.public_id,
                                url: videoResult.url,
                            });
                        }
                    }
                );
            });
        };

        try {
            const video = await uploadVideoToCloudinary(path.path);
            req.body.public_id = video.public_id
            req.body.url = video.url
            req.body.createdBy = req.user._id
            let addReel = new reelModel(req.body);
            let savedReel = await addReel.save();
            if (savedReel) {
                const updateUserReel = await findByIdAndUpdate({
                    model: userModel, condition: req.user._id, data: {
                        $addToSet: { reels: savedReel._id },
                    },
                    options: { new: true },
                });
                res.status(200).json({ success: true, data: savedReel });
            }
        } catch (error) {
            console.error('Error uploading video to Cloudinary:', error);
        }

    }



});
export const getAllReels = asyncHandler(async (req, res, next) => {
let skip= req.body.page
    const reels = await find({model:reelModel,populate:[...reelPop],limit:5,skip:skip*5})
    res.status(200).json({reels})
});
