const path = require('path');
const fs = require('fs');
const { cloudinary, isCloudinaryEnabled, initCloudinary } = require('../config/cloudinary');

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');
const CLOUD_FOLDER = process.env.CLOUDINARY_FOLDER || 'parthcraft12';

const useCloudinary = () => {
  if (!isCloudinaryEnabled()) return false;
  return initCloudinary();
};

const isCloudinaryUrl = (url) =>
  typeof url === 'string' && url.includes('res.cloudinary.com');

const isLocalUploadUrl = (url) =>
  typeof url === 'string' && url.startsWith('/uploads/');

const isValidStoredImageUrl = (url) => isCloudinaryUrl(url) || isLocalUploadUrl(url);

const getPublicIdFromUrl = (url) => {
  if (!isCloudinaryUrl(url)) return null;
  try {
    const afterUpload = url.split('/upload/')[1];
    if (!afterUpload) return null;
    const withoutVersion = afterUpload.replace(/^v\d+\//, '');
    const lastDot = withoutVersion.lastIndexOf('.');
    return lastDot > 0 ? withoutVersion.slice(0, lastDot) : withoutVersion;
  } catch {
    return null;
  }
};

const crypto = require('crypto');

const saveToLocalDisk = (file) => {
  if (!fs.existsSync(UPLOAD_ROOT)) fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
  // Force a safe filename and strict extension to prevent Path Traversal and Stored XSS
  const ext = file.mimetype === 'image/png' ? '.png' : '.jpg';
  const randomId = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
  const filename = `${Date.now()}-${randomId}${ext}`;
  fs.writeFileSync(path.join(UPLOAD_ROOT, filename), file.buffer);
  return `/uploads/${filename}`;
};

const uploadToCloudinary = (file, subfolder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `${CLOUD_FOLDER}/${subfolder}`,
        resource_type: 'image',
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result.secure_url);
      }
    );
    stream.end(file.buffer);
  });

/**
 * Upload one multer memory file. Uses Cloudinary when configured, else local disk.
 */
const uploadFile = async (file, subfolder = 'products') => {
  if (!file?.buffer) throw new Error('Invalid file');
  if (useCloudinary()) return uploadToCloudinary(file, subfolder);
  return saveToLocalDisk(file);
};

const uploadFiles = async (files, subfolder = 'products') => {
  const list = files || [];
  return Promise.all(list.map((f) => uploadFile(f, subfolder)));
};

const deleteLocalFile = (url) => {
  if (!isLocalUploadUrl(url)) return;
  // Use path.basename to strip any path traversal sequences like '../' from the URL
  const filename = path.basename(url);
  if (!filename) return;
  const filePath = path.join(UPLOAD_ROOT, filename);
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    // ignore
  }
};

const deleteFromCloudinary = async (url) => {
  const publicId = getPublicIdFromUrl(url);
  if (!publicId || !useCloudinary()) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  } catch (err) {
    console.warn('Cloudinary delete warning:', err.message);
  }
};

const deleteStoredImage = async (url) => {
  if (!url) return;
  if (isCloudinaryUrl(url)) return deleteFromCloudinary(url);
  if (isLocalUploadUrl(url)) return deleteLocalFile(url);
};

const getStorageMode = () => (useCloudinary() ? 'cloudinary' : 'local');

module.exports = {
  uploadFile,
  uploadFiles,
  deleteStoredImage,
  isValidStoredImageUrl,
  getStorageMode,
};
