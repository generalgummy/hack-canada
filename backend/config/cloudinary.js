const cloudinary = require('cloudinary').v2;
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use memory storage — much more reliable with React Native uploads
const memoryStorage = multer.memoryStorage();

const uploadDocument = multer({
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

const uploadListingImages = multer({
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Helper: upload a buffer to Cloudinary
const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        transformation: [{ width: 1200, crop: 'limit' }],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

// Get the right folder based on user type
const getDocumentFolder = (userType) => {
  const folderMap = {
    hunter: 'northern-harvest/hunter-ids',
    community: 'northern-harvest/community-proofs',
    supplier: 'northern-harvest/supplier-docs',
  };
  return folderMap[userType] || 'northern-harvest/documents';
};

module.exports = {
  cloudinary,
  uploadDocument,
  uploadListingImages,
  uploadToCloudinary,
  getDocumentFolder,
};
