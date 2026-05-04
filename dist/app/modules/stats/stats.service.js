"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsService = exports.updateFacebookContentStats = void 0;
const content_model_1 = require("../content/content.model");
const content_constants_1 = require("../content/content.constants");
const mongoose_1 = require("mongoose");
const stats_model_1 = require("./stats.model");
const user_model_1 = require("../user/user.model");
const user_1 = require("../../../enum/user");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const http_status_codes_1 = require("http-status-codes");
const socialintegration_model_1 = require("../socialintegration/socialintegration.model");
const graphAPIHelper_1 = require("../../../helpers/graphAPIHelper");
const subscription_model_1 = require("../subscription/subscription.model");
const contenttemplate_model_1 = require("../contenttemplate/contenttemplate.model");
const createStats = async (content, payload) => {
    const newStats = await stats_model_1.Stats.create(payload);
    return newStats;
};
const getAllPlatformStats = async (user) => {
    const isAdminExist = await user_model_1.User.findOne({
        _id: user.authId,
        role: user_1.USER_ROLES.ADMIN,
    });
    if (!isAdminExist) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'No admin user found for the provided ID. Please check and try again');
    }
    const allStats = await stats_model_1.Stats.find({});
    return allStats;
};
const getAdminDashboardStats = async (user) => {
    const isAdminExist = await user_model_1.User.findOne({
        _id: user.authId,
        role: user_1.USER_ROLES.ADMIN,
    });
    if (!isAdminExist) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'No admin user found for the provided ID. Please check and try again');
    }
    const now = new Date();
    const startOfPeriod = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const [totalUsers, activeUsers, premiumUserIds, newUsers, totalSubscriptions, revenueAggregation, revenueByMonthAggregation, templateCategoryAggregation,] = await Promise.all([
        user_model_1.User.countDocuments({ status: { $nin: [user_1.USER_STATUS.DELETED] } }),
        user_model_1.User.countDocuments({ status: user_1.USER_STATUS.ACTIVE }),
        subscription_model_1.Subscription.distinct('userId', { status: 'active' }),
        user_model_1.User.countDocuments({
            status: { $nin: [user_1.USER_STATUS.DELETED] },
            createdAt: { $gte: startOfMonth },
        }),
        subscription_model_1.Subscription.countDocuments({ status: 'active' }),
        subscription_model_1.Subscription.aggregate([
            { $match: { status: 'active' } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$price' },
                },
            },
        ]),
        subscription_model_1.Subscription.aggregate([
            {
                $match: {
                    status: 'active',
                    createdAt: { $gte: startOfPeriod },
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                    },
                    totalRevenue: { $sum: '$price' },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]),
        contenttemplate_model_1.ContentTemplate.aggregate([
            {
                $match: {
                    isActive: true,
                },
            },
            {
                $group: {
                    _id: '$category',
                    totalTemplates: { $sum: 1 },
                },
            },
            { $sort: { totalTemplates: -1 } },
        ]),
    ]);
    const totalRevenue = revenueAggregation.length > 0 ? revenueAggregation[0].totalRevenue : 0;
    const premiumUsers = Array.isArray(premiumUserIds) ? premiumUserIds.length : 0;
    const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
    ];
    const monthlyRevenue = revenueByMonthAggregation.map(item => {
        const monthIndex = item._id.month - 1;
        const monthLabel = monthNames[monthIndex] || String(item._id.month);
        return {
            year: item._id.year,
            month: item._id.month,
            monthLabel,
            totalRevenue: item.totalRevenue,
        };
    });
    const totalTemplates = templateCategoryAggregation.reduce((sum, item) => sum + item.totalTemplates, 0);
    const templateCategoryBreakdown = templateCategoryAggregation
        .filter(item => item._id)
        .map(item => {
        const percentage = totalTemplates > 0
            ? Number(((item.totalTemplates / totalTemplates) * 100).toFixed(2))
            : 0;
        return {
            category: item._id,
            totalTemplates: item.totalTemplates,
            percentage,
        };
    });
    return {
        totalUsers,
        premiumUsers,
        activeUsers,
        newUsers,
        totalSubscriptions,
        totalRevenue,
        monthlyRevenue,
        templateCategoryBreakdown,
    };
};
const getAdminUserStats = async (user) => {
    const isAdminExist = await user_model_1.User.findOne({
        _id: user.authId,
        role: user_1.USER_ROLES.ADMIN,
    });
    if (!isAdminExist) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'No admin user found for the provided ID. Please check and try again');
    }
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const [totalUsers, activeUsers, premiumUserIds, newUsers] = await Promise.all([
        user_model_1.User.countDocuments({ status: { $nin: [user_1.USER_STATUS.DELETED] } }),
        user_model_1.User.countDocuments({ status: user_1.USER_STATUS.ACTIVE }),
        subscription_model_1.Subscription.distinct('userId', { status: 'active' }),
        user_model_1.User.countDocuments({
            status: { $nin: [user_1.USER_STATUS.DELETED] },
            createdAt: { $gte: startOfMonth },
        }),
    ]);
    const premiumUsers = Array.isArray(premiumUserIds) ? premiumUserIds.length : 0;
    return {
        totalUsers,
        premiumUsers,
        activeUsers,
        newUsers,
    };
};
const getUserMetrics = async (user) => {
    const userId = new mongoose_1.Types.ObjectId(user.authId);
    // 🟦 Step 1: Counts for all content types and statuses
    const counts = await content_model_1.Content.aggregate([
        {
            $match: {
                user: userId,
                status: { $ne: content_constants_1.CONTENT_STATUS.DELETED },
            },
        },
        {
            $group: {
                _id: {
                    contentType: '$contentType',
                    status: '$status',
                },
                count: { $sum: 1 },
            },
        },
    ]);
    // 🟨 Step 2: Performance stats for published content
    const performanceStats = await stats_model_1.Stats.aggregate([
        {
            $match: {
                user: userId,
            },
        },
        {
            $group: {
                _id: null,
                totalLikes: { $sum: '$likes' },
                totalComments: { $sum: '$comments' },
                totalShares: { $sum: '$shares' },
                totalViews: { $sum: '$views' },
                totalReach: { $sum: '$reach' },
            },
        },
    ]);
    // 🟩 Step 3: Format the response
    const result = {
        contentCreation: {
            posts: { total: 0, published: 0, draft: 0, scheduled: 0 },
            reels: { total: 0, published: 0, draft: 0, scheduled: 0 },
            stories: { total: 0, published: 0, draft: 0, scheduled: 0 },
            carousel: { total: 0, published: 0, draft: 0, scheduled: 0 },
        },
        performance: {
            totalViews: 0,
            totalLikes: 0,
            totalComments: 0,
            totalShares: 0,
            totalReach: 0,
            avgEngagementRate: 0,
        },
    };
    // Map counts
    for (const item of counts) {
        const type = item._id.contentType;
        const status = item._id.status;
        const count = item.count;
        if (result.contentCreation[(type + 's')]) {
            const typeKey = (type + 's');
            result.contentCreation[typeKey].total += count;
            if (status === content_constants_1.CONTENT_STATUS.PUBLISHED)
                result.contentCreation[typeKey].published += count;
            if (status === content_constants_1.CONTENT_STATUS.DRAFT)
                result.contentCreation[typeKey].draft += count;
            if (status === content_constants_1.CONTENT_STATUS.SCHEDULED)
                result.contentCreation[typeKey].scheduled += count;
        }
    }
    // Map performance
    if (performanceStats.length > 0) {
        const p = performanceStats[0];
        result.performance.totalViews = p.totalViews || 0;
        result.performance.totalLikes = p.totalLikes || 0;
        result.performance.totalComments = p.totalComments || 0;
        result.performance.totalShares = p.totalShares || 0;
        result.performance.totalReach = p.totalReach || 0;
        const totalEngagement = result.performance.totalLikes +
            result.performance.totalComments +
            result.performance.totalShares;
        if (result.performance.totalViews > 0) {
            result.performance.avgEngagementRate = Number((totalEngagement / result.performance.totalViews).toFixed(2));
        }
    }
    return result;
};
const updateFacebookContentStats = async () => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    let isRunning = false;
    if (isRunning)
        return console.log('⏳ Previous job still running...');
    isRunning = true;
    console.log('🕐 Running Facebook content stats update...');
    try {
        // Fetch all published Facebook contents
        const contents = await content_model_1.Content.find({
            status: content_constants_1.CONTENT_STATUS.PUBLISHED,
            platform: { $in: ['facebook'] },
        });
        for (const item of contents) {
            const containerId = item.facebookContainerId;
            const fbAccount = await socialintegration_model_1.Socialintegration.findOne({
                user: item.user,
                platform: 'facebook',
            });
            if (!((_a = fbAccount === null || fbAccount === void 0 ? void 0 : fbAccount.accounts) === null || _a === void 0 ? void 0 : _a.length))
                continue;
            const { pageAccessToken } = fbAccount.accounts[0];
            if (!pageAccessToken)
                continue;
            try {
                let payload;
                if (item.contentType === 'reel') {
                    // Reels-specific payload
                    const fbData = await (0, graphAPIHelper_1.getFacebookVideoFullDetails)(containerId, pageAccessToken);
                    payload = {
                        user: item.user,
                        contentId: item._id,
                        platform: 'facebook',
                        likes: (_b = fbData.likesCount) !== null && _b !== void 0 ? _b : 0,
                        comments: (_c = fbData.commentsCount) !== null && _c !== void 0 ? _c : 0,
                        shares: (_e = (_d = fbData.insights) === null || _d === void 0 ? void 0 : _d.total_video_shares) !== null && _e !== void 0 ? _e : 0,
                        views: (_g = (_f = fbData.insights) === null || _f === void 0 ? void 0 : _f.total_video_views) !== null && _g !== void 0 ? _g : 0,
                        // You can add reel-specific stats if needed, e.g. completionRate
                    };
                }
                else if (item.contentType === 'post') {
                    // Post-specific payload
                    const fbData = await (0, graphAPIHelper_1.getFacebookPhotoDetails)(containerId, pageAccessToken);
                    payload = {
                        user: item.user,
                        contentId: item._id,
                        platform: 'facebook',
                        likes: (_h = fbData.likesCount) !== null && _h !== void 0 ? _h : 0,
                        comments: (_j = fbData.commentsCount) !== null && _j !== void 0 ? _j : 0,
                        shares: (_k = fbData.sharesCount) !== null && _k !== void 0 ? _k : 0,
                        views: (_l = fbData.impressions) !== null && _l !== void 0 ? _l : 0,
                        // You can add post-specific stats if needed, e.g. saves
                    };
                }
                else {
                    continue; // skip other content types
                }
                // Upsert stats
                await stats_model_1.Stats.findOneAndUpdate({ contentId: item._id, platform: 'facebook', user: item.user }, payload, { upsert: true, new: true });
                console.log(`✅ Updated stats for content: ${item._id}`);
            }
            catch (err) {
                console.error(`❌ Error fetching FB data for ${item._id}:`, err);
            }
        }
        console.log('✨ Facebook stats update completed.');
    }
    catch (err) {
        console.error('❌ Error updating Facebook stats:', err);
    }
    finally {
        isRunning = false;
    }
};
exports.updateFacebookContentStats = updateFacebookContentStats;
exports.StatsService = {
    createStats,
    getUserMetrics,
    getAllPlatformStats,
    getAdminDashboardStats,
    getAdminUserStats,
};
