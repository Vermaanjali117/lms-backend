const cloudinary = require('../config/cloudinary');

const uploadToCloudinary = (fileBuffer, folder) => {
    console.log("file buffer folder",fileBuffer ,folder)
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            {
                folder: `lms/${folder}`,
                resource_type: 'auto'
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        ).end(fileBuffer);
    });
};

const deleteFromCloudinary = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error('Cloudinary delete error:', error);
    }
};

module.exports = { uploadToCloudinary, deleteFromCloudinary };