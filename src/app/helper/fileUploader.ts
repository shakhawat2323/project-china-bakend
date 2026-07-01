import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import config from "../../config";
import path from "path";
import fs from "fs";

// Cloudinary config
cloudinary.config({
    cloud_name: config.cloudinary.cloud_name,
    api_key: config.cloudinary.api_key,
    api_secret: config.cloudinary.api_secret,
});

// Multer storage for local uploads
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// Upload to Cloudinary
const uploadToCloudinary = async (filePath: string, folder: string = "china-project") => {
    const result = await cloudinary.uploader.upload(filePath, {
        folder,
        resource_type: "auto",
    });

    // Remove local file after upload
    fs.unlinkSync(filePath);

    return {
        url: result.secure_url,
        publicId: result.public_id,
    };
};

// Delete from Cloudinary
const deleteFromCloudinary = async (publicId: string) => {
    await cloudinary.uploader.destroy(publicId);
};

export const fileUploader = {
    upload,
    uploadToCloudinary,
    deleteFromCloudinary,
};
