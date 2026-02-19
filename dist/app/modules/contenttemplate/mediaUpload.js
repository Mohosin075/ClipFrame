"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMediaUpload = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const s3helper_1 = require("../../../helpers/image/s3helper");
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
        const thumbnailFiles = (_a = req.files) === null || _a === void 0 ? void 0 : _a.image;
        const previewFiles = (_b = req.files) === null || _b === void 0 ? void 0 : _b.media;
        const stepsFiles = (_c = req.files) === null || _c === void 0 ? void 0 : _c.clips;
        // Existing / Initial values
        let uploadedThumbnailUrl = payload.data.thumbnail;
        let uploadedPreviewUrl = payload.data.previewUrl;
        const steps = payload.data.steps || [];
        // ===============================
        // 1. Upload thumbnail (image field)
        // ===============================
        if ((thumbnailFiles === null || thumbnailFiles === void 0 ? void 0 : thumbnailFiles.length) > 0) {
            const uploadedImages = await s3helper_1.S3Helper.uploadMultipleFilesToS3(thumbnailFiles, 'thumbnails');
            if (uploadedImages.length > 0) {
                uploadedThumbnailUrl = uploadedImages[0];
            }
        }
        // ===============================
        // 2. Upload preview media (media field)
        // ===============================
        if ((previewFiles === null || previewFiles === void 0 ? void 0 : previewFiles.length) > 0) {
            const uploadedPreviews = await s3helper_1.S3Helper.uploadMultipleVideosToS3(previewFiles, 'previews');
            if (uploadedPreviews.length > 0) {
                uploadedPreviewUrl = uploadedPreviews[0];
            }
        }
        // ===============================
        // 3. Upload steps media (clips field)
        // ===============================
        // For Content Templates, we want a tighter mapping.
        // Client should send 'clips' such that clips[i] belongs to steps[i] if media exists for that step.
        if ((stepsFiles === null || stepsFiles === void 0 ? void 0 : stepsFiles.length) > 0) {
            const uploadedClipsUrls = await s3helper_1.S3Helper.uploadMultipleVideosToS3(stepsFiles, 'steps');
            if (uploadedClipsUrls.length > 0) {
                // Mapping logic:
                // We find steps that have 'mediaType' but no URL yet (or marked for upload).
                // For simplicity, we map sequentially to steps.
                let fileIndex = 0;
                for (let i = 0; i < steps.length; i++) {
                    // If this step is expected to have a video/image and we have a file for it
                    if (fileIndex < uploadedClipsUrls.length) {
                        const file = stepsFiles[fileIndex];
                        const url = uploadedClipsUrls[fileIndex];
                        // Only calculate duration if it's a video and the client didn't provide a string duration already
                        // Actually, UI shows "Duration" as something like "4-6 seconds" (user input).
                        // But we can also auto-calculate if needed. Let's stick to user input for the template's 'suggested' duration.
                        steps[i].url = url;
                        fileIndex++;
                    }
                }
            }
        }
        // ===============================
        // Final body construction
        // ===============================
        req.body = {
            ...payload.data,
            thumbnail: uploadedThumbnailUrl,
            previewUrl: uploadedPreviewUrl,
            steps
        };
        next();
    }
    catch (error) {
        console.error('❌ Error in handleMediaUpload:', error);
        next(error);
    }
};
exports.handleMediaUpload = handleMediaUpload;
