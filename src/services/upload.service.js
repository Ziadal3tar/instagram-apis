import fs from 'node:fs/promises';
import cloudinary from './cloudinary.js';

async function safeUnlink(filePath) {
  if (!filePath) return;
  try {
    await fs.unlink(filePath);
  } catch {
    // Temporary upload files may already be removed by the runtime.
  }
}

function upload(path, options, large = false) {
  return new Promise((resolve, reject) => {
    const method = large ? cloudinary.uploader.upload_large : cloudinary.uploader.upload;
    method.call(cloudinary.uploader, path, options, (error, result) => {
      if (error) return reject(error);
      return resolve({
        url: result.secure_url,
        public_id: result.public_id,
        resource_type: result.resource_type,
      });
    });
  });
}

export async function uploadFile(file, { folder, resourceType = 'auto' } = {}) {
  if (!file?.path) throw new Error('File is required');
  try {
    const isVideo = resourceType === 'video' || file.mimetype?.startsWith('video/');
    return await upload(
      file.path,
      { folder, resource_type: isVideo ? 'video' : 'image' },
      isVideo
    );
  } finally {
    await safeUnlink(file.path);
  }
}

export async function deleteFile(publicId, resourceType = 'image') {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}
