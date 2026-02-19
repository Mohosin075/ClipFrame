"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Useronboarding = void 0;
const mongoose_1 = require("mongoose");
const useronboarding_interface_1 = require("./useronboarding.interface");
const SocialHandlesSchema = new mongoose_1.Schema({
    platform: {
        type: String,
        enum: Object.values(useronboarding_interface_1.SocialPlatform),
    },
    username: { type: String },
});
const BrandColorSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    value: { type: String, required: true },
});
const UserOnboardingSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    businessType: { type: String, default: 'General' },
    // customBusinessType: { type: String, default: '' },
    businessDescription: { type: String, default: '' },
    targetAudience: {
        type: [String],
        enum: Object.values(useronboarding_interface_1.TargetAudience),
        default: [],
    },
    preferredLanguages: {
        type: [String],
        enum: Object.values(useronboarding_interface_1.ContentLanguage),
        default: [useronboarding_interface_1.ContentLanguage.EN],
    },
    logo: { type: String },
    brandColors: { type: [BrandColorSchema], default: [] },
    autoTranslateCaptions: { type: Boolean, default: false },
    socialHandles: { type: [SocialHandlesSchema], default: [] },
    deletedAt: { type: Date, default: null },
});
exports.Useronboarding = (0, mongoose_1.model)('Useronboarding', UserOnboardingSchema);
