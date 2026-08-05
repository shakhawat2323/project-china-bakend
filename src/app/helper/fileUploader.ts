import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import config from "../../config";
import path from "path";
import fs from "fs";
import os from "os";

// Cloudinary config
cloudinary.config({
    cloud_name: config.cloudinary.cloud_name,
    api_key: config.cloudinary.api_key,
    api_secret: config.cloudinary.api_secret,
});

// Multer storage for local uploads
let uploadsDir = path.join(process.cwd(), "uploads");

try {
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }
} catch (error) {
    // If it fails (e.g., read-only filesystem on Vercel), fallback to /tmp
    uploadsDir = path.join(os.tmpdir(), "uploads");
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }
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

const hasCloudinaryConfig = Boolean(
    config.cloudinary.cloud_name && config.cloudinary.api_key && config.cloudinary.api_secret,
);

const getLocalUploadUrl = (filePath: string) => `/uploads/${path.basename(filePath)}`;

// Upload to Cloudinary. In local/dev without Cloudinary env, keep the file in /uploads.
const uploadToCloudinary = async (filePath: string, folder: string = "china-project") => {
    if (!hasCloudinaryConfig) {
        return {
            url: getLocalUploadUrl(filePath),
            publicId: `local/${path.basename(filePath)}`,
        };
    }

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
    if (publicId.startsWith("local/")) {
        const localPath = path.join(uploadsDir, path.basename(publicId));
        if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
        return;
    }

    await cloudinary.uploader.destroy(publicId);
};

export const fileUploader = {
    upload,
    uploadToCloudinary,
    deleteFromCloudinary,
};