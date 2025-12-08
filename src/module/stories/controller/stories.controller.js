import { asyncHandler } from '../../../services/asyncHandler.js';
import { findById, findByIdAndDelete, findOneAndUpdate, findOne, find, findByIdAndUpdate, create, findOneAndDelete } from '../../../../DB/DBMethods.js';
import cloudinary from '../../../services/cloudinary.js'
import storyModel from '../../../../DB/model/story.model.js';
import userModel from '../../../../DB/model/user.model.js';



export const addStory = asyncHandler(async (req, res, next) => {
    const path = req.file;

    const uploadStory = (path) => {
        return new Promise((resolve, reject) => {
            if (path.mimetype.split('/')[0] === 'video') {
                req.body.type = 'video';
                cloudinary.uploader.upload_large(
                    path.path,
                    {
                        resource_type: 'video',
                        folder: 'insta/storied',
                    },
                    (error, videoResult) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve({
                                url: videoResult.secure_url || '',
                                public_id: videoResult.public_id || '',
                                type: path.fieldname,
                            });
                        }
                    }
                );
            } else {
                req.body.type = 'image';
                cloudinary.uploader.upload(
                    path.path,
                    { folder: 'insta/stories' },
                    (error, imageResult) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve({
                                url: imageResult.secure_url || '',
                                public_id: imageResult.public_id || '',
                                type: path.fieldname,
                            });
                        }
                    }
                );
            }
        });
    };

    try {
        const result = await uploadStory(path);
        req.body.public_id = result.public_id;
        req.body.url = result.url;
        req.body.createdBy = req.user._id;

        const addStory = new storyModel(req.body);
        const savedStory = await addStory.save();

        if (savedStory) {
            const updateUserStories = await findByIdAndUpdate({
                model: userModel,
                condition: req.user._id,
                data: {
                    $addToSet: { stories: savedStory._id },
                },
                options: { new: true },
            });

            res.status(200).json({ success: true, data: savedStory });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});
