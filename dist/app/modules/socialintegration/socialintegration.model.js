"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Socialintegration = void 0;
const mongoose_1 = require("mongoose");
const socialintegrationSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId },
    platform: { type: String },
    appId: { type: String },
    accessToken: { type: String },
    refreshToken: { type: String },
    metaProfile: {
        email: { type: String },
        name: { type: String },
        photo: { type: String },
    },
    accounts: [{ type: mongoose_1.Schema.Types.Mixed }],
    expiresAt: { type: Date },
}, {
    timestamps: true,
});
exports.Socialintegration = (0, mongoose_1.model)('Socialintegration', socialintegrationSchema);
