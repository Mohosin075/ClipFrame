"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentTemplate = void 0;
const mongoose_1 = require("mongoose");
// Step schema based on StepsItem interface
const stepSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    mainTip: { type: String, required: true },
    detailedTips: { type: String },
    mediaType: { type: String, enum: ['video', 'image'], required: true },
    url: { type: String },
    shotType: {
        type: String,
        enum: ['wide', 'mid-shot', 'close-up'],
        required: true,
    },
    duration: { type: String },
});
// Main ContentTemplate schema
const contentTemplateSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    description: { type: String },
    type: { type: String, enum: ['reel', 'post', 'story'], default: 'reel' },
    category: { type: String },
    thumbnail: { type: String },
    previewUrl: { type: String },
    steps: { type: [stepSchema], default: [] },
    hashtags: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose_1.Types.ObjectId, ref: 'User' },
    stats: {
        reuseCount: { type: Number, default: 0 },
        loveCount: { type: Number, default: 0 },
        lovedBy: [{ type: mongoose_1.Types.ObjectId, ref: 'User' }],
    },
}, { timestamps: true });
// Export typed model
exports.ContentTemplate = (0, mongoose_1.model)('ContentTemplate', contentTemplateSchema);
