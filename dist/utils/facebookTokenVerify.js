"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFacebookUser = getFacebookUser;
exports.getFacebookPages = getFacebookPages;
exports.postToFacebookPage = postToFacebookPage;
exports.getFacebookPostDetails = getFacebookPostDetails;
exports.deleteFacebookPost = deleteFacebookPost;
exports.postVideoToFacebookPage = postVideoToFacebookPage;
exports.getFacebookVideoFullDetails = getFacebookVideoFullDetails;
exports.getAllPageVideoStats = getAllPageVideoStats;
exports.uploadFacebookPhoto = uploadFacebookPhoto;
exports.createFacebookMultiPhotoPost = createFacebookMultiPhotoPost;
exports.editFacebookPostCaption = editFacebookPostCaption;
exports.getInstagramAccountDetails = getInstagramAccountDetails;
exports.postInstagramPhoto = postInstagramPhoto;
exports.createInstagramReel = createInstagramReel;
exports.publishInstagramReel = publishInstagramReel;
exports.createInstagramImageStory = createInstagramImageStory;
exports.publishInstagramStory = publishInstagramStory;
const node_fetch_1 = __importDefault(require("node-fetch"));
/**
 * 1️⃣ Get basic Facebook user info
 * @param accessToken - Facebook user access token from mobile SDK
 */
async function getFacebookUser(accessToken) {
    try {
        const url = `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`;
        const res = await (0, node_fetch_1.default)(url);
        const data = await res.json();
        console.log({ data });
        if (data.error) {
            console.error('FB User Error:', data.error);
            throw new Error('Invalid Facebook user token');
        }
        return data; // { id, name, email, picture }
    }
    catch (err) {
        console.error(err);
        throw err;
    }
}
/**
 * 2️⃣ Get Facebook Pages and linked Instagram Business accounts
//  * @param accessToken - Facebook user access token
 */
async function getFacebookPages(accessToken) {
    try {
        const url = `https://graph.facebook.com/v17.0/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${accessToken}`;
        const res = await (0, node_fetch_1.default)(url);
        const data = await res.json();
        // console.log(data )
        if (data.error) {
            console.error('FB Pages Error:', data.error);
            throw new Error('Cannot fetch Facebook pages');
        }
        // Map to include Instagram Business ID if linked
        const pages = data.data.map((page) => {
            var _a;
            return ({
                pageId: page.id,
                pageName: page.name,
                pageAccessToken: page.access_token,
                instagramBusinessId: ((_a = page.instagram_business_account) === null || _a === void 0 ? void 0 : _a.id) || null,
            });
        });
        console.log(pages);
        return pages;
    }
    catch (err) {
        console.error(err);
        throw err;
    }
}
async function postToFacebookPage(pageId, pageAccessToken, message) {
    const url = `https://graph.facebook.com/${pageId}/feed`;
    const res = await (0, node_fetch_1.default)(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message,
            access_token: pageAccessToken,
        }),
    });
    const data = await res.json();
    console.log({ post: data });
    if (data.error) {
        throw new Error(`FB Post Error: ${data.error.message}`);
    }
    return data; // { id: "post_id" }
}
async function getFacebookPostDetails(objectId, pageAccessToken) {
    console.log('hit');
    try {
        // Step 1: Detect type of object
        const typeUrl = `https://graph.facebook.com/v23.0/${objectId}?fields=id,object_type&access_token=${pageAccessToken}`;
        const typeRes = await (0, node_fetch_1.default)(typeUrl);
        const typeData = await typeRes.json();
        if (typeData.error) {
            throw new Error(typeData.error.message);
        }
        // Step 2: Fetch fields based on type
        let detailsUrl = '';
        if (typeData.object_type === 'video') {
            // For videos
            detailsUrl = `https://graph.facebook.com/v23.0/${objectId}?fields=id,title,description,permalink_url,created_time,length&access_token=${pageAccessToken}`;
        }
        else {
            // Default: post
            detailsUrl = `https://graph.facebook.com/v23.0/${objectId}?fields=id,message,created_time,likes.summary(true),comments.summary(true)&access_token=${pageAccessToken}`;
        }
        const detailsRes = await (0, node_fetch_1.default)(detailsUrl);
        const detailsData = await detailsRes.json();
        if (detailsData.error) {
            throw new Error(detailsData.error.message);
        }
        return {
            type: typeData.object_type || 'post',
            details: detailsData,
        };
    }
    catch (err) {
        console.error('FB Fetch Error:', err);
        throw err;
    }
}
/**
 * 2️⃣ Delete a Facebook Page post
 * @param postId - Facebook Page post ID
 * @param pageAccessToken - Page access token
 */
async function deleteFacebookPost(postId, pageAccessToken) {
    try {
        const url = `https://graph.facebook.com/${postId}?access_token=${pageAccessToken}`;
        const res = await (0, node_fetch_1.default)(url, { method: 'DELETE' });
        const data = await res.json();
        console.log({ deletePost: data });
        if (data.error) {
            console.error('FB Delete Post Error:', data.error);
            throw new Error(data.error.message);
        }
        return data; // Usually { success: true }
    }
    catch (err) {
        console.error(err);
        throw err;
    }
}
async function postVideoToFacebookPage(pageId, pageAccessToken, videoUrl, description) {
    var _a;
    const url = `https://graph.facebook.com/v17.0/${pageId}/videos`;
    const res = await (0, node_fetch_1.default)(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            file_url: videoUrl,
            description,
            published: true,
            access_token: pageAccessToken,
        }),
    });
    const data = await res.json();
    if (!res.ok || data.error) {
        throw new Error(`FB Video Post Error: ${((_a = data.error) === null || _a === void 0 ? void 0 : _a.message) || res.statusText}`);
    }
    // Get permalink
    const metaRes = await (0, node_fetch_1.default)(`https://graph.facebook.com/v17.0/${data.id}?fields=permalink_url&access_token=${pageAccessToken}`);
    const meta = await metaRes.json();
    return { videoId: data.id, permalink: meta.permalink_url };
}
// it's not permission from meta. just amni add korsi
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
async function uploadFacebookPhoto(pageId, pageAccessToken, imageUrl) {
    const url = `https://graph.facebook.com/v17.0/${pageId}/photos`;
    const res = await (0, node_fetch_1.default)(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            url: imageUrl,
            published: false, // Important! Don’t publish yet
            access_token: pageAccessToken,
        }),
    });
    const data = await res.json();
    console.log({ photos: data });
    if (data.error)
        throw new Error(`FB Photo Upload Error: ${data.error.message}`);
    return data.id; // photo ID
}
async function createFacebookMultiPhotoPost(pageId, pageAccessToken, photoIds, message) {
    const attached_media = photoIds.map(id => ({ media_fbid: id }));
    const url = `https://graph.facebook.com/v17.0/${pageId}/feed`;
    const res = await (0, node_fetch_1.default)(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message,
            attached_media,
            access_token: pageAccessToken,
        }),
    });
    const data = await res.json();
    console.log({ posts: data });
    console.log({ postWithPhotos: data });
    if (data.error)
        throw new Error(`FB Multi-Photo Post Error: ${data.error.message}`);
    return data.id; // post ID
}
async function editFacebookPostCaption(postId, pageAccessToken, newCaption) {
    const url = `https://graph.facebook.com/v17.0/${postId}`;
    const res = await (0, node_fetch_1.default)(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: newCaption,
            access_token: pageAccessToken,
        }),
    });
    const data = await res.json();
    console.log({ updated: data });
    if (data.error)
        throw new Error(data.error.message);
    return data.id;
}
// Instagram part
async function getInstagramAccountDetails(igUserId, // Instagram Business Account ID
pageAccessToken) {
    try {
        const url = `https://graph.facebook.com/v23.0/${igUserId}?fields=id,username,followers_count,follows_count,media_count&access_token=${pageAccessToken}`;
        const res = await (0, node_fetch_1.default)(url);
        const data = await res.json();
        console.log({ instagramDetails: data });
        if (data.error) {
            console.error('Instagram Details Error:', data.error);
            throw new Error(data.error.message);
        }
        return data; // Contains id, username, followers_count, follows_count, media_count
    }
    catch (err) {
        console.error(err);
        throw err;
    }
}
// need update for create two different function
async function postInstagramPhoto(igBusinessId, pageAccessToken, imageUrl, caption) {
    // Step 1: create the media container
    const creationRes = await (0, node_fetch_1.default)(`https://graph.facebook.com/v21.0/${igBusinessId}/media`, {
        method: 'POST',
        body: new URLSearchParams({
            image_url: imageUrl, // must be a public HTTPS URL
            caption,
            access_token: pageAccessToken,
        }),
    });
    const creationData = await creationRes.json();
    if (creationData.error)
        throw new Error(creationData.error.message);
    // Step 2: publish it
    const publishRes = await (0, node_fetch_1.default)(`https://graph.facebook.com/v21.0/${igBusinessId}/media_publish`, {
        method: 'POST',
        body: new URLSearchParams({
            creation_id: creationData.id,
            access_token: pageAccessToken,
        }),
    });
    const publishData = await publishRes.json();
    if (publishData.error)
        throw new Error(publishData.error.message);
    return publishData; // returns the IG media ID
}
// instagram reel
async function createInstagramReel(igBusinessId, pageAccessToken, videoUrl, caption) {
    const res = await (0, node_fetch_1.default)(`https://graph.facebook.com/v21.0/${igBusinessId}/media`, {
        method: 'POST',
        body: new URLSearchParams({
            media_type: 'REELS', // indicates a reel
            video_url: videoUrl,
            caption,
            access_token: pageAccessToken,
        }),
    });
    const data = await res.json();
    if (data.error)
        throw new Error(data.error.message);
    return data.id; // creation_id
}
async function publishInstagramReel(igBusinessId, pageAccessToken, creationId) {
    const res = await (0, node_fetch_1.default)(`https://graph.facebook.com/v21.0/${igBusinessId}/media_publish`, {
        method: 'POST',
        body: new URLSearchParams({
            creation_id: creationId,
            access_token: pageAccessToken,
        }),
    });
    const data = await res.json();
    console.log({ published_Reels: data });
    if (data.error)
        throw new Error(data.error.message);
    return data.id; // final IG post ID
}
// for IG story posting
async function createInstagramImageStory(igBusinessId, pageAccessToken, imageUrl, caption) {
    try {
        // Construct request body for image only
        const body = {
            access_token: pageAccessToken,
            media_type: 'IMAGE',
            image_url: imageUrl,
            caption: caption || '',
        };
        // Call Graph API to create media container
        const res = await (0, node_fetch_1.default)(`https://graph.facebook.com/v23.0/${igBusinessId}/media`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        if (data.error) {
            console.error('Instagram Image Story Error Response:', data.error);
            throw new Error(data.error.message);
        }
        console.log('Instagram Image Story Created:', data);
        return data.id; // creation_id
    }
    catch (err) {
        console.error('Instagram Image Story Error:', err);
        throw err;
    }
}
async function publishInstagramStory(igBusinessId, pageAccessToken, creationId) {
    const res = await (0, node_fetch_1.default)(`https://graph.facebook.com/v21.0/${igBusinessId}/media_publish`, {
        method: 'POST',
        body: new URLSearchParams({
            creation_id: creationId,
            access_token: pageAccessToken,
        }),
    });
    const data = await res.json();
    console.log({ data });
    if (data.error)
        throw new Error(data.error.message);
    return data.id; // live Story ID
}
