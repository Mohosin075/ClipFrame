"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFacebookTokenAndIdFromDB = exports.getInstagramTokenAndIdFromDB = void 0;
exports.exchangeForLongLivedToken = exchangeForLongLivedToken;
exports.validateFacebookToken = validateFacebookToken;
exports.getFacebookUser = getFacebookUser;
exports.getFacebookPages = getFacebookPages;
exports.postToFacebookPage = postToFacebookPage;
exports.deleteFacebookPost = deleteFacebookPost;
exports.uploadFacebookPhotoScheduled = uploadFacebookPhotoScheduled;
exports.uploadFacebookReelScheduled = uploadFacebookReelScheduled;
exports.uploadFacebookCarouselScheduled = uploadFacebookCarouselScheduled;
exports.uploadFacebookStory = uploadFacebookStory;
exports.getFacebookPhotoDetails = getFacebookPhotoDetails;
exports.getFacebookVideoFullDetails = getFacebookVideoFullDetails;
exports.getAllPageVideoStats = getAllPageVideoStats;
exports.getInstagramAccounts = getInstagramAccounts;
exports.createInstagramMedia = createInstagramMedia;
exports.uploadAndQueueInstagramContent = uploadAndQueueInstagramContent;
exports.createInstagramCarousel = createInstagramCarousel;
exports.uploadInstagramStory = uploadInstagramStory;
exports.getInstagramPhotoDetails = getInstagramPhotoDetails;
exports.getInstagramVideoDetails = getInstagramVideoDetails;
const node_fetch_1 = __importDefault(require("node-fetch"));
const config_1 = __importDefault(require("../config"));
const ApiError_1 = __importDefault(require("../errors/ApiError"));
const http_status_codes_1 = require("http-status-codes");
const axios_1 = __importDefault(require("axios"));
const socialintegration_model_1 = require("../app/modules/socialintegration/socialintegration.model");
const content_model_1 = require("../app/modules/content/content.model");
const content_constants_1 = require("../app/modules/content/content.constants");
const detectMedia_1 = require("./detectMedia");
// exchange token short to long
async function exchangeForLongLivedToken(shortLivedToken, appId, appSecret) {
    const url = new URL(`https://graph.facebook.com/v23.0/oauth/access_token`);
    url.searchParams.set('grant_type', 'fb_exchange_token');
    url.searchParams.set('client_id', appId);
    url.searchParams.set('client_secret', appSecret);
    url.searchParams.set('fb_exchange_token', shortLivedToken);
    const res = await (0, node_fetch_1.default)(url.toString(), { method: 'GET' });
    const data = await res.json();
    if (data.error) {
        console.error('Facebook Token Exchange Error:', data.error);
        throw new Error(data.error.message);
    }
    return {
        accessToken: data.access_token,
        tokenType: data.token_type,
        expiresIn: data.expires_in, // usually 60 days in seconds
    };
}
// token facebook validation
async function validateFacebookToken(inputToken) {
    const appId = config_1.default.facebook.app_id;
    const appSecret = config_1.default.facebook.app_secret;
    const url = `https://graph.facebook.com/v23.0/debug_token?input_token=${inputToken}&access_token=${appId}|${appSecret}`;
    const res = await (0, node_fetch_1.default)(url);
    const result = await res.json();
    // This is the actual token info object
    const tokenInfo = result.data;
    if (!tokenInfo.is_valid) {
        // return tokenInfo.is_valid
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Facebook token expired');
    }
    return tokenInfo.is_valid; // { is_valid, expires_at, scopes, user_id, ... }
}
// ----------------------
// Facebook Functions
// ----------------------
// get user by token
async function getFacebookUser(accessToken) {
    const res = await (0, node_fetch_1.default)(`https://graph.facebook.com/v23.0/me?fields=id,name,email,picture&access_token=${accessToken}`);
    const data = await res.json();
    if (data.error)
        throw new Error(data.error.message);
    return data;
}
// get page by token
async function getFacebookPages(accessToken) {
    const res = await (0, node_fetch_1.default)(`https://graph.facebook.com/v23.0/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${accessToken}`);
    const data = await res.json();
    if (data.error)
        throw new Error(data.error.message);
    return data.data.map((p) => {
        var _a;
        return ({
            pageId: p.id,
            pageName: p.name,
            pageAccessToken: p.access_token,
            instagramBusinessId: ((_a = p.instagram_business_account) === null || _a === void 0 ? void 0 : _a.id) || null,
        });
    });
}
// not needed in clipframe but it's working for feed post
async function postToFacebookPage(pageId, pageAccessToken, message) {
    console.log({ pageId, pageAccessToken, message });
    const res = await (0, node_fetch_1.default)(`https://graph.facebook.com/v23.0/${pageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, access_token: pageAccessToken }),
    });
    const data = await res.json();
    if (data.error)
        throw new Error(data.error.message);
    return data;
}
// not use this time i user later
async function deleteFacebookPost(postId, pageAccessToken) {
    const res = await (0, node_fetch_1.default)(`https://graph.facebook.com/v23.0/${postId}?access_token=${pageAccessToken}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.error)
        throw new Error(data.error.message);
    return data;
}
// perfect working function for photo
async function uploadFacebookPhotoScheduled(pageId, pageAccessToken, imageUrl, caption, contentId, isPublished, scheduledPublishTime) {
    const type = await (0, detectMedia_1.detectMediaType)(imageUrl);
    if (type === 'video') {
        return await uploadFacebookReelScheduled(pageId, pageAccessToken, imageUrl, caption, contentId, isPublished, scheduledPublishTime);
    }
    if (type === 'photo') {
        const body = {
            caption,
            url: imageUrl,
            access_token: pageAccessToken,
            published: isPublished,
        };
        if (!isPublished && scheduledPublishTime) {
            body.scheduled_publish_time = scheduledPublishTime;
        }
        const res = await (0, node_fetch_1.default)(`https://graph.facebook.com/v23.0/${pageId}/photos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        if (data.error)
            throw new Error(data.error.message);
        const containerId = data.id;
        if (containerId) {
            await content_model_1.Content.findOneAndUpdate({ _id: contentId }, {
                $set: {
                    facebookContainerId: containerId,
                    status: isPublished ? content_constants_1.CONTENT_STATUS.PUBLISHED : content_constants_1.CONTENT_STATUS.SCHEDULED,
                    'platformStatus.facebook': 'published',
                },
            }, { new: true });
        }
        return data.id;
    }
}
// perfect working function for reel
async function uploadFacebookReelScheduled(pageId, pageAccessToken, videoUrl, caption, contentId, isPublished, scheduledPublishTime) {
    const body = {
        description: caption, // Reels use 'description' instead of 'caption'
        file_url: videoUrl, // video URL
        access_token: pageAccessToken,
        published: isPublished,
    };
    if (!isPublished && scheduledPublishTime) {
        body.scheduled_publish_time = scheduledPublishTime;
    }
    const res = await (0, node_fetch_1.default)(`https://graph.facebook.com/v23.0/${pageId}/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.error)
        throw new Error(data.error.message);
    const containerId = data.id;
    if (containerId) {
        await content_model_1.Content.findOneAndUpdate({ _id: contentId }, {
            $set: {
                facebookContainerId: containerId,
                status: isPublished ? content_constants_1.CONTENT_STATUS.PUBLISHED : content_constants_1.CONTENT_STATUS.SCHEDULED,
                'platformStatus.facebook': 'published',
            },
        }, { new: true });
    }
    return data.id;
}
// Perfect working Upload multiple photos as a carousel (scheduled or immediate)
async function uploadFacebookCarouselScheduled(pageId, pageAccessToken, imageUrls, // array of image URLs
caption, contentId, isPublished, scheduledPublishTime) {
    var _a, _b;
    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
        throw new Error('imageUrls must be a non-empty array');
    }
    const mediaFbids = [];
    // Step 1: Upload each photo as unpublished to get media_fbid
    for (const url of imageUrls) {
        const photoBody = {
            url,
            published: false, // important — upload as unpublished
            access_token: pageAccessToken,
        };
        const photoRes = await (0, node_fetch_1.default)(`https://graph.facebook.com/v23.0/${pageId}/photos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(photoBody),
        });
        const photoData = await photoRes.json();
        if (!photoRes.ok || photoData.error) {
            throw new Error(((_a = photoData.error) === null || _a === void 0 ? void 0 : _a.message) || 'Failed to upload image');
        }
        mediaFbids.push(photoData.id);
    }
    // Step 2: Create the carousel post (unpublished container)
    const postBody = {
        message: caption,
        published: isPublished,
        attached_media: mediaFbids.map(id => ({ media_fbid: id })),
        access_token: pageAccessToken,
    };
    if (!isPublished && scheduledPublishTime) {
        postBody.scheduled_publish_time = scheduledPublishTime;
    }
    const postRes = await (0, node_fetch_1.default)(`https://graph.facebook.com/v23.0/${pageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postBody),
    });
    const postData = await postRes.json();
    if (!postRes.ok || postData.error) {
        throw new Error(((_b = postData.error) === null || _b === void 0 ? void 0 : _b.message) || 'Failed to create carousel post');
    }
    const containerId = postData.id;
    if (containerId) {
        await content_model_1.Content.findOneAndUpdate({ _id: contentId }, {
            $set: {
                facebookContainerId: containerId,
                status: isPublished ? content_constants_1.CONTENT_STATUS.PUBLISHED : content_constants_1.CONTENT_STATUS.SCHEDULED,
                'platformStatus.facebook': 'published',
            },
        }, { new: true });
    }
    return containerId;
}
// perfect working for facebook story
async function uploadFacebookStory({ pageId, pageAccessToken, type, mediaUrl, contentId, caption, }) {
    var _a, _b, _c, _d, _e;
    if (type === 'photo') {
        // --- PHOTO STORY ---
        // Step 1: Upload photo as unpublished
        const uploadRes = await (0, node_fetch_1.default)(`https://graph.facebook.com/v24.0/${pageId}/photos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: mediaUrl,
                published: false,
                access_token: pageAccessToken,
            }),
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || uploadData.error) {
            throw new Error(((_a = uploadData.error) === null || _a === void 0 ? void 0 : _a.message) || 'Failed to upload photo');
        }
        const photoId = uploadData.id;
        console.log('✅ Uploaded photo ID:', photoId);
        // Step 2: Publish photo as story
        const storyRes = await (0, node_fetch_1.default)(`https://graph.facebook.com/v24.0/${pageId}/photo_stories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                photo_id: photoId,
                access_token: pageAccessToken,
            }),
        });
        const storyData = await storyRes.json();
        if (!storyRes.ok || storyData.error || !storyData.success) {
            throw new Error(((_b = storyData.error) === null || _b === void 0 ? void 0 : _b.message) || 'Failed to publish photo story');
        }
        const postId = storyData.post_id;
        console.log('✅ Published Facebook photo story:', postId);
        if (contentId) {
            await content_model_1.Content.findOneAndUpdate({ _id: contentId }, {
                $set: {
                    facebookContainerId: postId,
                    status: content_constants_1.CONTENT_STATUS.SCHEDULED,
                    'platformStatus.facebook': 'published',
                },
            }, { new: true });
        }
        return postId;
    }
    // For video , meta not allow published vidoe story
    if (type === 'video') {
        // Step 1: Initialize video story session
        const initRes = await (0, node_fetch_1.default)(`https://graph.facebook.com/v24.0/${pageId}/video_stories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                upload_phase: 'start',
                access_token: pageAccessToken,
            }),
        });
        const initData = await initRes.json();
        if (!initRes.ok || initData.error)
            throw new Error(((_c = initData.error) === null || _c === void 0 ? void 0 : _c.message) || 'Failed to initialize video story');
        const { video_id, upload_url } = initData;
        console.log({ video_id, upload_url });
        // Step 2: Upload hosted video
        const uploadRes = await (0, node_fetch_1.default)(upload_url, {
            method: 'POST',
            headers: { file_url: mediaUrl },
        });
        const uploadData = await uploadRes.json();
        console.log({ uploadError: uploadData });
        if (!uploadRes.ok || uploadData.error || !uploadData.success)
            throw new Error(((_d = uploadData.error) === null || _d === void 0 ? void 0 : _d.message) || 'Failed to upload video');
        console.log({ uploadData });
        // Step 3: Finish upload and publish story
        const finishRes = await (0, node_fetch_1.default)(`https://graph.facebook.com/v24.0/${pageId}/video_stories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                upload_phase: 'finish',
                video_id,
                access_token: pageAccessToken,
                description: caption,
            }),
        });
        const finishData = await finishRes.json();
        console.log({ finishData });
        console.log({ error: finishData.error });
        if (!finishRes.ok || finishData.error || !finishData.success)
            throw new Error(((_e = finishData.error) === null || _e === void 0 ? void 0 : _e.message) || 'Failed to publish video story');
        const postId = finishData.post_id;
        if (contentId) {
            await content_model_1.Content.findByIdAndUpdate(contentId, {
                facebookContainerId: postId,
                status: content_constants_1.CONTENT_STATUS.SCHEDULED,
                'platformStatus.facebook': 'published',
            });
        }
        return postId;
    }
}
async function getFacebookPhotoDetails(photoId, pageAccessToken) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
    const fields = [
        'id',
        'created_time',
        'updated_time',
        'images',
        'likes.summary(true)',
        'comments.summary(true)',
        'insights.metric(post_impressions)',
    ].join(',');
    const url = `https://graph.facebook.com/v24.0/${photoId}?fields=${fields}&access_token=${pageAccessToken}`;
    const res = await (0, node_fetch_1.default)(url);
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`FB API error: ${res.status} – ${errText}`);
    }
    const data = await res.json();
    // Retrieve impressions
    const impressions = (_f = (_e = (_d = (_c = (_b = (_a = data.insights) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.find((i) => i.name === 'post_impressions')) === null || _c === void 0 ? void 0 : _c.values) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.value) !== null && _f !== void 0 ? _f : 0;
    // Retrieve shares count
    const sharesCount = (_h = (_g = data.shares) === null || _g === void 0 ? void 0 : _g.count) !== null && _h !== void 0 ? _h : 0;
    return {
        id: data.id,
        createdAt: data.created_time,
        updatedAt: data.updated_time,
        imageUrl: (_l = (_k = (_j = data.images) === null || _j === void 0 ? void 0 : _j[0]) === null || _k === void 0 ? void 0 : _k.source) !== null && _l !== void 0 ? _l : '',
        likesCount: (_p = (_o = (_m = data.likes) === null || _m === void 0 ? void 0 : _m.summary) === null || _o === void 0 ? void 0 : _o.total_count) !== null && _p !== void 0 ? _p : 0,
        commentsCount: (_s = (_r = (_q = data.comments) === null || _q === void 0 ? void 0 : _q.summary) === null || _r === void 0 ? void 0 : _r.total_count) !== null && _s !== void 0 ? _s : 0,
        sharesCount,
        impressions,
    };
}
// work later for video insights and stats
async function getFacebookVideoFullDetails(videoId, pageAccessToken) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    const fields = [
        // Core video meta
        'id',
        'description',
        'permalink_url',
        'created_time',
        'updated_time',
        'length',
        'content_category',
        'source',
        'embeddable',
        'published',
        'privacy',
        'status',
        'thumbnails',
        // Engagement stats
        'likes.summary(true)',
        'comments.summary(true)',
        'video_insights.metric(total_video_impressions,total_video_views,total_video_10s_views,post_video_avg_time_watched)',
    ].join(',');
    const url = `https://graph.facebook.com/v21.0/${videoId}?fields=${fields}&access_token=${pageAccessToken}`;
    const res = await (0, node_fetch_1.default)(url);
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`FB API error: ${res.status} – ${errText}`);
    }
    const data = await res.json();
    // Optional: flatten some nested objects for easier DB storage
    return {
        id: data.id,
        description: data.description,
        permalink: data.permalink_url,
        createdAt: data.created_time,
        updatedAt: data.updated_time,
        durationSec: data.length,
        category: data.content_category,
        videoUrl: data.source,
        embeddable: data.embeddable,
        published: data.published,
        privacy: (_a = data.privacy) === null || _a === void 0 ? void 0 : _a.value,
        status: (_b = data.status) === null || _b === void 0 ? void 0 : _b.video_status,
        thumbnails: (_d = (_c = data.thumbnails) === null || _c === void 0 ? void 0 : _c.data) !== null && _d !== void 0 ? _d : [],
        likesCount: (_g = (_f = (_e = data.likes) === null || _e === void 0 ? void 0 : _e.summary) === null || _f === void 0 ? void 0 : _f.total_count) !== null && _g !== void 0 ? _g : 0,
        commentsCount: (_k = (_j = (_h = data.comments) === null || _h === void 0 ? void 0 : _h.summary) === null || _j === void 0 ? void 0 : _j.total_count) !== null && _k !== void 0 ? _k : 0,
        // Insights array comes back nested—map it to key/value
        insights: ((_m = (_l = data.video_insights) === null || _l === void 0 ? void 0 : _l.data) !== null && _m !== void 0 ? _m : []).reduce((acc, item) => {
            var _a, _b;
            return ({
                ...acc,
                [item.name]: (_b = (_a = item.values) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value,
            });
        }, {}),
        // raw: data // keep full payload if you need it later
    };
}
// work later for all video stats from page
async function getAllPageVideoStats(pageId, pageAccessToken) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    // 1️⃣ Fetch the page feed
    const feedUrl = `https://graph.facebook.com/v23.0/${pageId}/feed?fields=id,attachments{media_type,target,url},created_time,updated_time&access_token=${pageAccessToken}`;
    const feedRes = await (0, node_fetch_1.default)(feedUrl);
    if (!feedRes.ok)
        throw new Error(`Failed to fetch page feed: ${feedRes.statusText}`);
    const feedData = await feedRes.json();
    const results = [];
    for (const post of feedData.data) {
        const attachment = (_b = (_a = post.attachments) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b[0];
        if (!attachment || attachment.media_type !== 'video')
            continue;
        const videoId = (_c = attachment.target) === null || _c === void 0 ? void 0 : _c.id;
        if (!videoId)
            continue;
        // 2️⃣ Fetch video node for full details (description, videoUrl, duration)
        const videoRes = await (0, node_fetch_1.default)(`https://graph.facebook.com/v23.0/${videoId}?fields=description,source,length&access_token=${pageAccessToken}`);
        const videoData = await videoRes.json();
        const description = (_d = videoData.description) !== null && _d !== void 0 ? _d : null;
        const videoUrl = (_e = videoData.source) !== null && _e !== void 0 ? _e : '';
        const durationSec = (_f = videoData.length) !== null && _f !== void 0 ? _f : 0;
        // 3️⃣ Fetch post-level likes/comments
        const postRes = await (0, node_fetch_1.default)(`https://graph.facebook.com/v23.0/${post.id}?fields=likes.summary(true),comments.summary(true)&access_token=${pageAccessToken}`);
        const postData = await postRes.json();
        const likesCount = (_j = (_h = (_g = postData.likes) === null || _g === void 0 ? void 0 : _g.summary) === null || _h === void 0 ? void 0 : _h.total_count) !== null && _j !== void 0 ? _j : 0;
        const commentsCount = (_m = (_l = (_k = postData.comments) === null || _k === void 0 ? void 0 : _k.summary) === null || _l === void 0 ? void 0 : _l.total_count) !== null && _m !== void 0 ? _m : 0;
        // 4️⃣ Fetch video insights
        const metricsList = [
            'total_video_views',
            'total_video_impressions',
            'total_video_10s_views',
            'total_video_15s_views',
            'total_video_30s_views',
            'total_video_complete_views',
            'post_video_avg_time_watched',
        ].join(',');
        const insightsRes = await (0, node_fetch_1.default)(`https://graph.facebook.com/v23.0/${videoId}/video_insights?metric=${metricsList}&access_token=${pageAccessToken}`);
        const insightsData = await insightsRes.json();
        const metrics = {};
        for (const m of insightsData.data || []) {
            metrics[m.name] = Number((_q = (_p = (_o = m.values) === null || _o === void 0 ? void 0 : _o[0]) === null || _p === void 0 ? void 0 : _p.value) !== null && _q !== void 0 ? _q : 0);
        }
        results.push({
            id: videoId,
            description,
            permalink: `https://www.facebook.com/${pageId}/videos/${videoId}`,
            createdAt: post.created_time,
            updatedAt: post.updated_time,
            durationSec,
            videoUrl,
            likesCount,
            commentsCount,
            insights: metrics,
        });
    }
    return results;
}
// ----------------------
// Instagram Functions
// ----------------------
// Get Instagram Util for get db token
const getInstagramTokenAndIdFromDB = async (user) => {
    var _a;
    const instagramAccount = await socialintegration_model_1.Socialintegration.findOne({
        user,
        platform: 'instagram',
    });
    if (!instagramAccount ||
        !instagramAccount.accessToken ||
        ((_a = instagramAccount.accounts) === null || _a === void 0 ? void 0 : _a.length) === 0) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'No Instagram social account found, please connect your Instagram account first.');
    }
    const instagramId = instagramAccount.accounts && instagramAccount.accounts[0].igUserId;
    const instagramAccessToken = instagramAccount.accounts && instagramAccount.accounts[0].pageAccessToken;
    return { instagramId, instagramAccessToken };
};
exports.getInstagramTokenAndIdFromDB = getInstagramTokenAndIdFromDB;
// get DB token and page id
const getFacebookTokenAndIdFromDB = async (user) => {
    var _a;
    const facebookAccount = await socialintegration_model_1.Socialintegration.findOne({
        user,
        platform: 'facebook',
    });
    if (!facebookAccount ||
        !facebookAccount.accessToken ||
        ((_a = facebookAccount.accounts) === null || _a === void 0 ? void 0 : _a.length) === 0) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'No facebook social account found, please connect your facebook account first.');
    }
    const facebookPageId = facebookAccount.accounts && facebookAccount.accounts[0].pageId;
    const facebookAccessToken = facebookAccount.accounts && facebookAccount.accounts[0].pageAccessToken;
    return { facebookPageId, facebookAccessToken };
};
exports.getFacebookTokenAndIdFromDB = getFacebookTokenAndIdFromDB;
// perfect working function
async function getInstagramAccounts(accessToken) {
    var _a, _b;
    try {
        // 1️⃣ Get all Facebook Pages for this user
        const pagesResp = await axios_1.default.get(`https://graph.facebook.com/v19.0/me/accounts`, {
            params: { access_token: accessToken },
        });
        const pages = ((_a = pagesResp.data) === null || _a === void 0 ? void 0 : _a.data) || [];
        const igAccounts = [];
        // 2️⃣ Loop through each page to find connected IG accounts
        for (const page of pages) {
            if (!page.id || !page.access_token)
                continue;
            try {
                const igResp = await axios_1.default.get(`https://graph.facebook.com/v19.0/${page.id}`, {
                    params: {
                        fields: 'connected_instagram_account',
                        access_token: page.access_token,
                    },
                });
                const igAccount = (_b = igResp.data) === null || _b === void 0 ? void 0 : _b.connected_instagram_account;
                if (igAccount === null || igAccount === void 0 ? void 0 : igAccount.id) {
                    igAccounts.push({
                        pageId: page.id,
                        igUserId: igAccount.id,
                        pageAccessToken: page.access_token,
                    });
                }
            }
            catch (err) {
                console.warn(`Failed to fetch IG account for page ${page.id}`, err.message);
            }
        }
        return igAccounts;
    }
    catch (err) {
        console.error('Failed to get Instagram accounts', err.message);
        return [];
    }
}
const IG_GRAPH_URL = 'https://graph.facebook.com/v21.0';
// Perfect working without scheduling --- Step 1: Create Media Container ---
async function createInstagramMedia({ igUserId, accessToken, mediaUrl, caption, type, }) {
    var _a;
    try {
        let payload = {};
        const mediaTypeByURL = await (0, detectMedia_1.detectMediaType)(mediaUrl);
        if (type === 'post' && mediaTypeByURL !== 'video') {
            payload = { image_url: mediaUrl, caption };
        }
        else if (type === 'reel' ||
            (type === 'post' && mediaTypeByURL == 'video')) {
            payload = { video_url: mediaUrl, caption, media_type: 'REELS' };
        }
        const containerRes = await axios_1.default.post(`${IG_GRAPH_URL}/${igUserId}/media`, payload, { params: { access_token: accessToken } });
        return containerRes.data.id; // return containerId
    }
    catch (err) {
        console.error('Instagram Create Error:', ((_a = err.response) === null || _a === void 0 ? void 0 : _a.data) || err);
        throw err;
    }
}
// perfect working
async function checkContainerStatus(containerId, accessToken, maxRetries = 20) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const res = await axios_1.default.get(`${IG_GRAPH_URL}/${containerId}`, {
            params: { access_token: accessToken, fields: 'status_code,status' },
        });
        const { status_code, status } = res.data;
        if (status_code === 'FINISHED')
            return;
        if (status_code === 'ERROR' || status === 'ERROR') {
            throw new Error(`Container processing failed: ${status}`);
        }
        const waitTime = Math.min(attempt * 5, 30) * 1000;
        console.log(`Container not ready. Retry ${attempt}, wait ${waitTime / 1000}s`);
        await new Promise(res => setTimeout(res, waitTime));
    }
    throw new Error(`Container not ready after ${maxRetries} attempts`);
}
// perfect working
async function tryPublish(igUserId, accessToken, containerId, type, caption, content) {
    var _a, _b, _c, _d;
    const retries = 5;
    for (let i = 0; i < retries; i++) {
        try {
            const res = await axios_1.default.post(`${IG_GRAPH_URL}/${igUserId}/media_publish`, { creation_id: containerId, caption }, { params: { access_token: accessToken } });
            console.log(`✅ Published ${type}:`, containerId);
            console.log({ id: res.data });
            if (res.data) {
                if (res.data) {
                    await content_model_1.Content.updateOne({ _id: content._id }, { $set: { contentId: res.data.id } });
                }
            }
            return res.data;
        }
        catch (err) {
            const code = (_b = (_a = err.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.code;
            const subcode = (_d = (_c = err.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.error_subcode;
            if (code === 9007 && subcode === 2207027) {
                console.log(`⏳ Media not ready, retrying in 5s...`);
                await new Promise(res => setTimeout(res, 5000));
                continue;
            }
            throw err;
        }
    }
    throw new Error(`Failed to publish ${type}: ${containerId} after ${retries} retries`);
}
async function platformPublishWorker() {
    var _a, _b, _c, _d;
    const now = new Date();
    const pendingContents = await content_model_1.Content.find({
        status: content_constants_1.CONTENT_STATUS.SCHEDULED,
        $or: [
            { 'platformStatus.instagram': 'pending' },
            { 'platformStatus.facebook': 'pending' },
        ],
    });
    for (const content of pendingContents) {
        try {
            // Logic for checking scheduled time
            if (content.scheduledAt && content.scheduledAt.type === 'single') {
                const { date, time } = content.scheduledAt;
                if (date && time) {
                    const scheduledDateTime = new Date(date);
                    const [hours, minutes] = time.split(':').map(Number);
                    scheduledDateTime.setHours(hours, minutes, 0, 0);
                    if (scheduledDateTime > now) {
                        continue; // Still in future
                    }
                }
            }
            // 1. Handle Instagram
            if (((_a = content.platformStatus) === null || _a === void 0 ? void 0 : _a.get('instagram')) === 'pending') {
                const { instagramId, instagramAccessToken } = await (0, exports.getInstagramTokenAndIdFromDB)(((_b = content.user) === null || _b === void 0 ? void 0 : _b.toString()) || '');
                if (content.instagramContainerId) {
                    if (content.contentType === 'reel' || content.contentType === 'story') {
                        await checkContainerStatus(content.instagramContainerId, instagramAccessToken);
                    }
                    await tryPublish(instagramId, instagramAccessToken, content.instagramContainerId, content.contentType || 'post', content.caption, content);
                    content.platformStatus.set('instagram', 'published');
                    await content.save();
                    console.log('✅ Instagram content published:', content._id);
                }
            }
            // 2. Handle Facebook (mostly for Story scheduling since FB doesn't support it natively)
            if (((_c = content.platformStatus) === null || _c === void 0 ? void 0 : _c.get('facebook')) === 'pending') {
                const { facebookPageId, facebookAccessToken } = await (0, exports.getFacebookTokenAndIdFromDB)(((_d = content.user) === null || _d === void 0 ? void 0 : _d.toString()) || '');
                if (content.contentType === 'story') {
                    const type = await (0, detectMedia_1.detectMediaType)(content.mediaUrls[0]);
                    await uploadFacebookStory({
                        pageId: facebookPageId,
                        pageAccessToken: facebookAccessToken,
                        mediaUrl: content.mediaUrls[0],
                        type,
                        caption: content.caption,
                        contentId: content._id,
                    });
                    // uploadFacebookStory sets status to published internally
                    console.log('✅ Facebook story published via worker:', content._id);
                }
            }
        }
        catch (err) {
            console.log('Worker retry later:', content._id, err.message);
        }
    }
}
// run every 5s
setInterval(() => {
    platformPublishWorker().catch(console.error);
}, 5000);
async function uploadAndQueueInstagramContent(contentId, igUserId, accessToken) {
    var _a;
    console.log({ contentId });
    const content = await content_model_1.Content.findOne({ _id: contentId }).populate('user');
    if (!content)
        throw new Error('Content not found');
    let contentType = 'post';
    if (content.contentType === 'reel') {
        contentType = 'reel';
    }
    else {
        contentType = 'post';
    }
    const containerId = await createInstagramMedia({
        igUserId,
        accessToken,
        mediaUrl: (content.mediaUrls && content.mediaUrls[0]) || '',
        caption: content.caption || '',
        type: contentType,
    });
    content.instagramContainerId = containerId;
    (_a = content === null || content === void 0 ? void 0 : content.platformStatus) === null || _a === void 0 ? void 0 : _a.set('instagram', 'pending');
    content.status = content_constants_1.CONTENT_STATUS.SCHEDULED;
    await content.save();
    return containerId;
}
/**
 * Create an Instagram carousel container (multiple images)
 * Returns the container ID which can later be published
 */
async function createInstagramCarousel({ igUserId, accessToken, contentId, imageUrls, caption, }) {
    var _a;
    if (!Array.isArray(imageUrls) || imageUrls.length < 2) {
        throw new Error('Instagram carousel requires at least 2 images');
    }
    try {
        const childrenContainerIds = [];
        // Step 1: Create unpublished media containers for each image
        for (const imageUrl of imageUrls) {
            const res = await axios_1.default.post(`${IG_GRAPH_URL}/${igUserId}/media`, {
                image_url: imageUrl,
                published: false, // MUST be false
            }, {
                params: { access_token: accessToken },
            });
            if (!res.data.id) {
                throw new Error('Failed to create media container for image: ' + imageUrl);
            }
            childrenContainerIds.push(res.data.id);
        }
        // Step 2: Create the carousel container
        const carouselRes = await axios_1.default.post(`${IG_GRAPH_URL}/${igUserId}/media`, {
            media_type: 'CAROUSEL', // MUST set media_type
            children: childrenContainerIds, // ARRAY of IDs, NOT string
            caption,
            published: false, // MUST be false
        }, {
            params: { access_token: accessToken },
        });
        if (!carouselRes.data.id) {
            throw new Error('Failed to create carousel container');
        }
        await content_model_1.Content.findOneAndUpdate({ _id: contentId }, {
            $set: {
                instagramContainerId: carouselRes.data.id,
                status: content_constants_1.CONTENT_STATUS.SCHEDULED,
                'platformStatus.instagram': 'pending',
            },
        }, { new: true });
        return carouselRes.data.id;
    }
    catch (err) {
        console.error('Instagram Carousel Creation Error:', ((_a = err.response) === null || _a === void 0 ? void 0 : _a.data) || err.message);
        throw err;
    }
}
async function uploadInstagramStory({ igUserId, accessToken, mediaUrl, type, caption, contentId, }) {
    var _a, _b, _c, _d;
    try {
        console.log(`📱 Starting Instagram ${type} Story Upload...`);
        const payload = {
            media_type: 'STORIES',
        };
        if (type === 'photo') {
            payload.image_url = mediaUrl;
            console.log('🖼️ Uploading photo story...');
        }
        else if (type === 'video') {
            payload.video_url = mediaUrl; // ✅ Just use video_url directly
            console.log('🎥 Uploading video story...');
        }
        if (caption) {
            payload.caption = caption;
        }
        // For videos, use longer timeout and larger payload limits
        const config = {
            params: { access_token: accessToken },
            timeout: type === 'video' ? 60000 : 15000, // 60s for videos
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            headers: {
                'Content-Type': 'application/json',
            },
        };
        console.log('📤 Sending request to Instagram API...');
        const createRes = await axios_1.default.post(`${IG_GRAPH_URL}/${igUserId}/media`, payload, config);
        if (!createRes.data.id) {
            throw new Error(`Failed to create ${type} story container`);
        }
        const containerId = createRes.data.id;
        console.log(`✅ ${type === 'video' ? 'Video' : 'Photo'} Story Container Created: ${containerId}`);
        // Update database
        if (contentId) {
            await content_model_1.Content.findOneAndUpdate({ _id: contentId }, {
                $set: {
                    instagramContainerId: containerId,
                    status: content_constants_1.CONTENT_STATUS.SCHEDULED,
                    'platformStatus.instagram': 'pending',
                },
            }, { new: true });
        }
        return containerId;
    }
    catch (err) {
        console.error(`❌ Instagram ${type} Story Upload Error:`, ((_a = err.response) === null || _a === void 0 ? void 0 : _a.data) || err.message);
        // Provide specific error messages
        if ((_c = (_b = err.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.error) {
            const igError = err.response.data.error;
            if (igError.code === 100) {
                if (type === 'video') {
                    throw new Error('Video URL is invalid or not accessible. Make sure the URL is publicly accessible and the video is in MP4 format.');
                }
                else {
                    throw new Error('Image URL is invalid or not accessible.');
                }
            }
            else if (igError.code === 10) {
                throw new Error('App does not have permission to publish stories.');
            }
            else if ((_d = igError.message) === null || _d === void 0 ? void 0 : _d.includes('permission')) {
                throw new Error('Your Instagram account or app lacks permission to publish stories.');
            }
        }
        throw err;
    }
}
// working fine
async function getInstagramPhotoDetails(mediaId, accessToken) {
    var _a, _b, _c, _d, _e, _f, _g;
    try {
        // Fields for basic photo info and engagement metrics
        const basicFields = [
            'id',
            'media_type',
            'media_url',
            'permalink',
            'timestamp',
            'caption',
            'like_count', // ✅ Number of likes
            'comments_count', // ✅ Number of comments
        ].join(',');
        const basicUrl = `https://graph.facebook.com/v18.0/${mediaId}?fields=${basicFields}&access_token=${accessToken}`;
        const basicRes = await (0, node_fetch_1.default)(basicUrl);
        const basicData = await basicRes.json();
        if (basicData.error) {
            throw new Error(`Failed to get photo: ${basicData.error.message}`);
        }
        // Verify it's a photo
        if (basicData.media_type !== 'IMAGE' &&
            basicData.media_type !== 'CAROUSEL_ALBUM') {
            throw new Error(`Not a photo. Media type: ${basicData.media_type}`);
        }
        // Get insights metrics
        const insightsUrl = `https://graph.facebook.com/v18.0/${mediaId}/insights?metric=impressions,reach,engagement,saved&access_token=${accessToken}`;
        const insightsRes = await (0, node_fetch_1.default)(insightsUrl);
        const insightsData = await insightsRes.json();
        // Process insights
        const insights = ((_a = insightsData.data) !== null && _a !== void 0 ? _a : []).reduce((acc, item) => {
            var _a, _b;
            acc[item.name] = ((_b = (_a = item.values) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value) || 0;
            return acc;
        }, {});
        return {
            // Basic photo info
            id: basicData.id,
            caption: (_b = basicData.caption) !== null && _b !== void 0 ? _b : null,
            type: basicData.media_type,
            mediaUrl: (_c = basicData.media_url) !== null && _c !== void 0 ? _c : null,
            permalink: (_d = basicData.permalink) !== null && _d !== void 0 ? _d : null,
            timestamp: (_e = basicData.timestamp) !== null && _e !== void 0 ? _e : null,
            // ✅ ENGAGEMENT STATS
            engagement: {
                likes: (_f = basicData.like_count) !== null && _f !== void 0 ? _f : 0, // ✅ Like count
                comments: (_g = basicData.comments_count) !== null && _g !== void 0 ? _g : 0, // ✅ Comment count
                saves: insights.saved || 0, // ✅ Save count
                totalEngagement: insights.engagement || 0, // ✅ Total engagement
            },
            // ✅ REACH & IMPRESSION STATS
            reach: {
                impressions: insights.impressions || 0, // ✅ Total impressions
                reach: insights.reach || 0, // ✅ Unique reach
            },
            // Raw data for reference
            rawData: {
                basic: basicData,
                insights: insightsData,
            },
        };
    }
    catch (error) {
        console.error('Error in getInstagramPhotoStats:', error);
        throw error;
    }
}
// working fine
async function getInstagramVideoDetails(mediaId, accessToken) {
    var _a, _b, _c, _d, _e, _f, _g;
    try {
        // ✅ Only include valid Reel fields
        const basicFields = [
            'id',
            'media_type',
            'media_url',
            'permalink',
            'timestamp',
            'caption',
            'like_count',
            'comments_count',
        ].join(',');
        const basicUrl = `https://graph.facebook.com/v18.0/${mediaId}?fields=${basicFields}&access_token=${accessToken}`;
        const basicRes = await (0, node_fetch_1.default)(basicUrl);
        const basicData = await basicRes.json();
        if (basicData.error) {
            throw new Error(`Failed to get reel: ${basicData.error.message}`);
        }
        // ✅ Confirm it’s a video-type reel
        if (basicData.media_type !== 'VIDEO') {
            throw new Error(`Not a reel. Media type: ${basicData.media_type}`);
        }
        // ✅ Fetch insights (Reels support video_views here)
        const insightsUrl = `https://graph.facebook.com/v18.0/${mediaId}/insights?metric=impressions,reach,engagement,saved,video_views&access_token=${accessToken}`;
        const insightsRes = await (0, node_fetch_1.default)(insightsUrl);
        const insightsData = await insightsRes.json();
        const insights = ((_a = insightsData.data) !== null && _a !== void 0 ? _a : []).reduce((acc, item) => {
            var _a, _b;
            acc[item.name] = ((_b = (_a = item.values) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value) || 0;
            return acc;
        }, {});
        return {
            id: basicData.id,
            caption: (_b = basicData.caption) !== null && _b !== void 0 ? _b : null,
            type: basicData.media_type,
            mediaUrl: (_c = basicData.media_url) !== null && _c !== void 0 ? _c : null,
            permalink: (_d = basicData.permalink) !== null && _d !== void 0 ? _d : null,
            timestamp: (_e = basicData.timestamp) !== null && _e !== void 0 ? _e : null,
            // ✅ Engagement stats
            engagement: {
                likes: (_f = basicData.like_count) !== null && _f !== void 0 ? _f : 0,
                comments: (_g = basicData.comments_count) !== null && _g !== void 0 ? _g : 0,
                saves: insights.saved || 0,
                totalEngagement: insights.engagement || 0,
                views: insights.video_views || 0,
            },
            // ✅ Reach stats
            reach: {
                impressions: insights.impressions || 0,
                reach: insights.reach || 0,
            },
            // Optional raw data
            rawData: {
                basic: basicData,
                insights: insightsData,
            },
        };
    }
    catch (error) {
        console.error('Error in getInstagramReelDetails:', error);
        throw error;
    }
}
