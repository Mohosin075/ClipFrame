"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTiktokToken = getTiktokToken;
exports.getTikTokAccounts = getTikTokAccounts;
const axios_1 = __importDefault(require("axios"));
const config_1 = __importDefault(require("../config"));
async function getTiktokToken(code) {
    try {
        const tokenRes = await axios_1.default.post('https://open.tiktokapis.com/v2/oauth/token/', new URLSearchParams({
            client_key: config_1.default.tikok.client_id,
            client_secret: config_1.default.tikok.client_secret,
            code,
            grant_type: 'authorization_code',
            redirect_uri: config_1.default.tikok.callback_url,
        }).toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
        const shortTokenData = tokenRes.data.access_token;
        if (shortTokenData) {
            return shortTokenData;
        }
        throw new Error('TikTok token or userId missing');
    }
    catch (err) {
        console.error('Error getting TikTok token:', err);
        throw err;
    }
}
async function getTikTokAccounts(accessToken) {
    var _a;
    try {
        const fields = 'open_id,display_name,avatar_url,union_id'; // specify required fields
        const url = `https://open.tiktokapis.com/v2/user/info/?fields=${fields}`;
        const response = await axios_1.default.get(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });
        const data = response.data.data.user; // user object is inside data.user
        return [
            {
                id: data.open_id,
                username: data.display_name,
                profilePicture: data.avatar_url,
                unionId: data.union_id,
                accessToken,
            },
        ];
    }
    catch (error) {
        console.error('Error fetching TikTok accounts:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        return [];
    }
}
