"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Content = void 0;
const mongoose_1 = require("mongoose");
const content_constants_1 = require("./content.constants");
const contentSchema = new mongoose_1.Schema({
    contentId: { type: String },
    templateId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ContentTemplate' },
    caption: { type: String },
    // description: { type: String },
    mediaUrls: { type: [String] },
    contentType: { type: String, enum: ['post', 'reel', 'story', 'carousel'] },
    scheduledAt: {
        type: {
            type: String,
            enum: ['any', 'single', 'range'],
            default: 'any',
        },
        date: { type: Date }, // for "single"
        time: { type: String }, // for "single"
        startTime: { type: String }, // for "range"
        endTime: { type: String }, // for "range"
    },
    remindMe: { type: Boolean, default: false },
    status: {
        type: String,
        enum: Object.values(content_constants_1.CONTENT_STATUS),
        default: content_constants_1.CONTENT_STATUS.DRAFT,
    },
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    platform: {
        type: [String],
        enum: ['facebook', 'instagram', 'tiktok'],
        default: [],
    },
    tags: { type: [String], default: [] },
    reelsInfo: {
        duration: { type: Number }, // seconds
        resolution: { type: String },
    },
    clips: [
        {
            step: { type: Number },
            url: { type: String },
            duration: { type: Number },
            type: { type: String, enum: ['image', 'video'] },
        },
    ],
    storyInfo: {
        expiryTime: { type: Date },
    },
    carouselInfo: {
        slidesCount: { type: Number },
    },
    stats: [{ type: mongoose_1.Schema.Types.Mixed, default: {} }],
    instagramContainerId: { type: String },
    facebookContainerId: { type: String },
    platformStatus: { type: Map, of: String, default: {} },
}, { timestamps: true });
contentSchema.index({ contentType: 1, 'scheduledAt.date': 1, status: 1 });
exports.Content = (0, mongoose_1.model)('Content', contentSchema);
