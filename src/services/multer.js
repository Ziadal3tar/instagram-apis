import multer from 'multer';

export const fileValidation = Object.freeze({
  all: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'video/mp4', 'application/pdf'],
  image: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
  video: ['video/mp4'],
  pdf: ['application/pdf'],
});

const defaultLimits = {
  fileSize: Number(process.env.MAX_UPLOAD_SIZE || 50 * 1024 * 1024),
  files: 10,
};

export function uploadErrorHandler(err, req, res, next) {
  if (!err) return next();
  return res.status(400).json({ success: false, message: err.message || 'Upload failed' });
}

export function myMulter(customValidation = fileValidation.image, limits = defaultLimits) {
  const storage = multer.diskStorage({});
  return multer({
    storage,
    limits,
    fileFilter(req, file, cb) {
      if (customValidation.includes(file.mimetype)) return cb(null, true);
      return cb(new Error('Invalid file format'));
    },
  });
}

export const HME = uploadErrorHandler;
