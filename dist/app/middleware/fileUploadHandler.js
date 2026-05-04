"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const multer_1 = __importDefault(require("multer"));
const sharp_1 = __importDefault(require("sharp"));
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const fileUploadHandler = (maxSizeInMB = 100, options) => {
    const maxSize = maxSizeInMB * 1024 * 1024;
    // Configure storage
    const storage = multer_1.default.memoryStorage();
    // File filter
    const filterFilter = async (req, file, cb) => {
        console.log({ name: file });
        try {
            const allowedImageTypes = [
                'image/jpeg',
                'image/png',
                'image/jpg',
                'image/webp',
            ];
            const allowedMediaTypes = [
                'video/mp4',
                'video/quicktime',
                'video/webm',
                'video/x-m4v',
                'audio/mpeg',
                'audio/wav',
                'audio/mp3',
                'audio/x-wav',
            ];
            const allowedDocTypes = ['application/pdf'];
            if (['image', 'license', 'signature', 'businessProfile'].includes(file.fieldname)) {
                if (allowedImageTypes.includes(file.mimetype)) {
                    cb(null, true);
                }
                else {
                    cb(new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Only .jpeg, .png, .jpg, .webp file supported'));
                }
            }
            else if (file.fieldname === 'media') {
                if (allowedMediaTypes.includes(file.mimetype) ||
                    allowedImageTypes.includes(file.mimetype)) {
                    cb(null, true);
                }
                else {
                    cb(new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Only .mp4, .mp3, .jpeg, .png, .jpg, .webp file supported'));
                }
            }
            else if (file.fieldname === 'clips') {
                if (allowedMediaTypes.includes(file.mimetype) ||
                    allowedImageTypes.includes(file.mimetype)) {
                    cb(null, true);
                }
                else {
                    cb(new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Only .mp4, .mp3, .jpeg, .png, .jpg, .webp file supported'));
                }
            }
            else if (file.fieldname === 'doc') {
                if (allowedDocTypes.includes(file.mimetype)) {
                    cb(null, true);
                }
                else {
                    cb(new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Only pdf supported'));
                }
            }
            else {
                cb(new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'This file is not supported'));
            }
        }
        catch (error) {
            cb(new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'File validation failed'));
        }
    };
    const upload = (0, multer_1.default)({
        storage: storage,
        fileFilter: filterFilter,
        limits: {
            fileSize: maxSize,
            files: 10, // Maximum number of files allowed
        },
    }).fields([
        { name: 'image', maxCount: 5 },
        { name: 'media', maxCount: 5 },
        { name: 'doc', maxCount: 3 },
        { name: 'clips', maxCount: 20 },
    ]);
    // Process uploaded images with Sharp
    const processImages = async (req, res, next) => {
        if (!req.files)
            return next();
        try {
            const imageFields = [
                'image',
                'license',
                'signature',
                'businessProfile',
                'media',
                'clips',
            ];
            const preserveOriginalImages = (options === null || options === void 0 ? void 0 : options.preserveOriginalImages) === true;
            // Process each image field
            for (const field of imageFields) {
                const files = req.files[field];
                if (!files)
                    continue;
                // Process each file in the field
                for (const file of files) {
                    if (!file.mimetype.startsWith('image'))
                        continue;
                    if (preserveOriginalImages)
                        continue;
                    // Resize and optimize the image while maintaining aspect ratio
                    let sharpInstance = (0, sharp_1.default)(file.buffer).resize({
                        width: 1080,
                        withoutEnlargement: true,
                    });
                    if (file.mimetype === 'image/png') {
                        sharpInstance = sharpInstance.png({ quality: 80 });
                    }
                    else if (file.mimetype === 'image/webp') {
                        sharpInstance = sharpInstance.webp({ quality: 80 });
                    }
                    else {
                        sharpInstance = sharpInstance.jpeg({ quality: 80 });
                    }
                    const optimizedBuffer = await sharpInstance.toBuffer();
                    // Replace the original buffer with the optimized one
                    file.buffer = optimizedBuffer;
                }
            }
            next();
        }
        catch (error) {
            next(new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Image processing failed'));
        }
    };
    // Return middleware chain
    return (req, res, next) => {
        upload(req, res, err => {
            if (err) {
                if (err instanceof multer_1.default.MulterError &&
                    err.code === 'LIMIT_FILE_SIZE') {
                    return next(new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `File too large. Maximum allowed size is ${maxSizeInMB} MB.`));
                }
                return next(err);
            }
            processImages(req, res, next);
        });
    };
};
exports.default = fileUploadHandler;
