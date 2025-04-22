import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const filetypes = /jpe?g|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(file.originalname.toLowerCase());

    if (mimetype && extname) {
        return cb(null, true);
    }
    cb(new Error('Only images (jpeg, png, webp) are allowed!'), false);
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 5
    }
});

const uploadToCloudinary = async (buffer) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            { resource_type: 'auto' },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        ).end(buffer);
    });
};

const deleteFromCloudinary = async (url) => {
    const publicId = url.split('/').pop().split('.')[0];
    return cloudinary.uploader.destroy(publicId);
};

export const uploadMultiple = (fieldName, maxCount) => 
    upload.array(fieldName, maxCount);

export { uploadToCloudinary, deleteFromCloudinary };