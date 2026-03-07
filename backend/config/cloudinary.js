const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for hunter license / ID documents
const hunterDocStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'northern-harvest/hunter-ids',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    transformation: [{ width: 1200, crop: 'limit' }],
  },
});

// Storage for community proof documents
const communityDocStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'northern-harvest/community-proofs',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    transformation: [{ width: 1200, crop: 'limit' }],
  },
});

// Storage for supplier business documents
const supplierDocStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'northern-harvest/supplier-docs',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    transformation: [{ width: 1200, crop: 'limit' }],
  },
});

// Storage for listing product images
const listingImageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'northern-harvest/listings',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [{ width: 1200, crop: 'limit' }],
  },
});

// Dynamic document upload based on user type
const getDocumentUploader = (userType) => {
  let storage;
  switch (userType) {
    case 'hunter':
      storage = hunterDocStorage;
      break;
    case 'community':
      storage = communityDocStorage;
      break;
    case 'supplier':
      storage = supplierDocStorage;
      break;
    default:
      storage = hunterDocStorage;
  }
  return multer({ storage });
};

// General document uploader — determines folder dynamically from req.body.userType
const documentStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const userType = req.body.userType || 'general';
    const folderMap = {
      hunter: 'northern-harvest/hunter-ids',
      community: 'northern-harvest/community-proofs',
      supplier: 'northern-harvest/supplier-docs',
    };
    return {
      folder: folderMap[userType] || 'northern-harvest/documents',
      allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
      transformation: [{ width: 1200, crop: 'limit' }],
    };
  },
});

const uploadDocument = multer({ storage: documentStorage });
const uploadListingImages = multer({ storage: listingImageStorage });

module.exports = {
  cloudinary,
  uploadDocument,
  uploadListingImages,
  getDocumentUploader,
};
