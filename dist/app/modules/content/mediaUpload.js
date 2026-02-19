"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMediaUpload = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const s3helper_1 = require("../../../helpers/image/s3helper");
const stream_1 = require("stream");
const get_video_duration_1 = __importDefault(require("get-video-duration"));
const handleMediaUpload = async (req, res, next) => {
    var _a, _b, _c;
    try {
        const payload = req.body;
        if (!payload.data) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Data is required');
        }
        // Parse JSON payload
        payload.data = JSON.parse(payload.data);
        // Files
        const imageFiles = (_a = req.files) === null || _a === void 0 ? void 0 : _a.image;
        const videoFiles = (_b = req.files) === null || _b === void 0 ? void 0 : _b.media;
        const clipsFiles = (_c = req.files) === null || _c === void 0 ? void 0 : _c.clips;
        // Uploaded URLs
        let uploadedImageUrls = [];
        let uploadedVideoUrls = [];
        let uploadedClipsUrls = [];
        // ===============================
        // Upload videos
        // ===============================
        if ((videoFiles === null || videoFiles === void 0 ? void 0 : videoFiles.length) > 0) {
            if (payload.data.contentType === 'carousel') {
                throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Carousel posts support images only. Videos are not allowed. Please upload images instead.');
            }
            uploadedVideoUrls = await s3helper_1.S3Helper.uploadMultipleVideosToS3(videoFiles, 'videos');
            if (uploadedVideoUrls.length === 0) {
                throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to upload video files. Please try again.');
            }
        }
        // ===============================
        // Upload clips
        // ===============================
        const clips = [];
        if ((clipsFiles === null || clipsFiles === void 0 ? void 0 : clipsFiles.length) > 0) {
            uploadedClipsUrls = await s3helper_1.S3Helper.uploadMultipleVideosToS3(clipsFiles, 'clips');
            if (uploadedClipsUrls.length === 0) {
                throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to upload clips. Please try again.');
            }
            // Build clip metadata
            for (let i = 0; i < clipsFiles.length; i++) {
                const file = clipsFiles[i];
                const url = uploadedClipsUrls[i];
                let duration = 0;
                try {
                    const fileStream = stream_1.Readable.from(file.buffer);
                    duration = await (0, get_video_duration_1.default)(fileStream);
                }
                catch (err) {
                    console.error('Failed to get video duration:', err);
                }
                clips.push({
                    step: i + 1,
                    url,
                    duration,
                    type: 'video',
                    size: file.size, // in bytes
                });
            }
        }
        // ===============================
        // Upload images
        // ===============================
        if ((imageFiles === null || imageFiles === void 0 ? void 0 : imageFiles.length) > 0) {
            uploadedImageUrls = await s3helper_1.S3Helper.uploadMultipleFilesToS3(imageFiles, 'image');
            if (uploadedImageUrls.length === 0) {
                throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to upload image files. Please try again.');
            }
        }
        // ===============================
        // Collect all media URLs
        // ===============================
        const mediaUrls = [];
        if (uploadedVideoUrls.length > 0)
            mediaUrls.push(...uploadedVideoUrls);
        if (uploadedImageUrls.length > 0)
            mediaUrls.push(...uploadedImageUrls);
        // ===============================
        // Final body
        // ===============================
        req.body = { ...payload.data, mediaUrls, clips };
        next();
    }
    catch (error) {
        console.error('❌ Error in handleMediaUpload:', error);
        next(error); // Pass error to your globalErrorHandler
    }
};
exports.handleMediaUpload = handleMediaUpload;
