"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.usageTrackingService = void 0;
const mongoose_1 = require("mongoose");
const subscription_model_1 = require("./subscription.model");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const http_status_codes_1 = require("http-status-codes");
const socialintegration_model_1 = require("../socialintegration/socialintegration.model");
class UsageTrackingService {
    // Check if user can manage more businesses
    async canManageBusiness(userId) {
        var _a;
        try {
            const { subscriptionService } = await Promise.resolve().then(() => __importStar(require('./subscription.service')));
            await subscriptionService.handleFreeSubscriptionCreate(userId);
            const subscription = await subscription_model_1.Subscription.findOne({
                userId: new mongoose_1.Types.ObjectId(userId),
                status: { $in: ['active', 'trialing'] },
            }).populate('planId');
            if (!subscription) {
                return { allowed: false, reason: 'No active subscription' };
            }
            let plan;
            if (subscription.planId &&
                typeof subscription.planId === 'object' &&
                'businessesManageable' in subscription.planId) {
                plan = subscription.planId;
            }
            else {
                plan = await subscriptionService.getPlanById(subscription.planId.toString());
            }
            const businessUsed = await socialintegration_model_1.Socialintegration.countDocuments({
                user: new mongoose_1.Types.ObjectId(userId),
            });
            const businessLimit = (_a = plan.businessesManageable) !== null && _a !== void 0 ? _a : 0;
            if (businessUsed >= businessLimit) {
                return {
                    allowed: false,
                    reason: `You have reached the maximum businesses you can manage (${businessLimit}). Please upgrade your plan to manage more.`,
                };
            }
            return { allowed: true };
        }
        catch (error) {
            console.error('Error checking business management limit:', error);
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to check business limit');
        }
    }
    // Reset weekly usage if 7 days have passed
    async resetWeeklyUsageIfNeeded(subscription) {
        var _a, _b;
        const now = new Date();
        const lastReset = subscription.lastReset
            ? new Date(subscription.lastReset)
            : now;
        const diffInMs = now.getTime() - lastReset.getTime();
        const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
        if (diffInDays >= 7) {
            subscription.usage = {
                reelsUsed: 0,
                postsUsed: 0,
                storiesUsed: 0,
                businessesUsed: (_b = (_a = subscription.usage) === null || _a === void 0 ? void 0 : _a.businessesUsed) !== null && _b !== void 0 ? _b : 0, // Businesses manageable usually doesn't reset weekly
                carouselUsed: 0,
            };
            subscription.lastReset = now;
            await subscription.save();
        }
    }
    // Check and increment usage for a specific content type
    async checkAndIncrementUsage(userId, type) {
        try {
            const { subscriptionService } = await Promise.resolve().then(() => __importStar(require('./subscription.service')));
            const subscription = await subscriptionService.handleFreeSubscriptionCreate(userId);
            if (!subscription) {
                throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'No active subscription found!');
            }
            // Reset weekly usage if 1 week passed
            await this.resetWeeklyUsageIfNeeded(subscription);
            let plan;
            if (subscription.planId &&
                typeof subscription.planId === 'object' &&
                'reelsPerWeek' in subscription.planId) {
                plan = subscription.planId;
            }
            else {
                plan = await subscriptionService.getPlanById(subscription.planId.toString());
            }
            const usageMap = {
                reel: 'reelsUsed',
                post: 'postsUsed',
                story: 'storiesUsed',
                carousel: 'carouselUsed',
            };
            const limitMap = {
                reel: 'reelsPerWeek',
                post: 'postsPerWeek',
                story: 'storiesPerWeek',
                carousel: 'carouselPerWeek',
            };
            const usageKey = usageMap[type];
            const limitKey = limitMap[type];
            const used = subscription.usage[usageKey];
            const limit = plan[limitKey];
            if (used >= limit) {
                throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `Weekly limit reached for ${type}. Your current plan allows ${limit} ${type}s per week.`);
            }
            const usageKeyField = `usage.${usageKey}`;
            const updatedSubscription = await subscription_model_1.Subscription.findByIdAndUpdate(subscription._id, { $inc: { [usageKeyField]: 1 } }, { new: true }).orFail();
            return {
                subscriptionId: updatedSubscription._id,
                type,
                used: updatedSubscription.usage[usageKey],
                limit,
            };
        }
        catch (error) {
            if (error instanceof ApiError_1.default)
                throw error;
            console.error('Error checking and incrementing usage:', error);
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to update usage');
        }
    }
    // Get current usage for a user
    async getCurrentUsage(userId) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        try {
            const subscription = await subscription_model_1.Subscription.findOne({
                userId: new mongoose_1.Types.ObjectId(userId),
                status: { $in: ['active', 'trialing'] },
            });
            const businessesUsed = await socialintegration_model_1.Socialintegration.countDocuments({
                user: new mongoose_1.Types.ObjectId(userId),
            });
            return {
                userId,
                storageUsed: 0,
                apiCallsThisMonth: 0,
                reelsUsed: (_b = (_a = subscription === null || subscription === void 0 ? void 0 : subscription.usage) === null || _a === void 0 ? void 0 : _a.reelsUsed) !== null && _b !== void 0 ? _b : 0,
                postsUsed: (_d = (_c = subscription === null || subscription === void 0 ? void 0 : subscription.usage) === null || _c === void 0 ? void 0 : _c.postsUsed) !== null && _d !== void 0 ? _d : 0,
                storiesUsed: (_f = (_e = subscription === null || subscription === void 0 ? void 0 : subscription.usage) === null || _e === void 0 ? void 0 : _e.storiesUsed) !== null && _f !== void 0 ? _f : 0,
                businessesUsed: businessesUsed,
                carouselUsed: (_h = (_g = subscription === null || subscription === void 0 ? void 0 : subscription.usage) === null || _g === void 0 ? void 0 : _g.carouselUsed) !== null && _h !== void 0 ? _h : 0,
            };
        }
        catch (error) {
            console.error('Error getting current usage:', error);
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to get usage data');
        }
    }
    // Get usage with plan limits
    async getUsageWithLimits(userId) {
        try {
            const subscription = await subscription_model_1.Subscription.findOne({
                userId: new mongoose_1.Types.ObjectId(userId),
                status: { $in: ['active', 'trialing'] },
            }).populate('planId');
            if (!subscription) {
                throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'No active subscription found');
            }
            let plan;
            if (subscription.planId &&
                typeof subscription.planId === 'object' &&
                'name' in subscription.planId) {
                plan = subscription.planId;
            }
            else {
                const { subscriptionService } = await Promise.resolve().then(() => __importStar(require('./subscription.service')));
                plan = await subscriptionService.getPlanById(subscription.planId.toString());
            }
            const usage = await this.getCurrentUsage(userId);
            return {
                usage,
                limits: {
                    reelsPerWeek: plan.reelsPerWeek,
                    postsPerWeek: plan.postsPerWeek,
                    storiesPerWeek: plan.storiesPerWeek,
                    businessesManageable: plan.businessesManageable,
                    carouselPerWeek: plan.carouselPerWeek,
                },
                percentages: {
                    reelsUsed: Math.round((usage.reelsUsed / plan.reelsPerWeek) * 100) || 0,
                    postsUsed: Math.round((usage.postsUsed / plan.postsPerWeek) * 100) || 0,
                    storiesUsed: Math.round((usage.storiesUsed / plan.storiesPerWeek) * 100) || 0,
                    businessesUsed: Math.round((usage.businessesUsed / plan.businessesManageable) * 100) || 0,
                    carouselUsed: Math.round((usage.carouselUsed / plan.carouselPerWeek) * 100) || 0,
                },
            };
        }
        catch (error) {
            if (error instanceof ApiError_1.default)
                throw error;
            console.error('Error getting usage with limits:', error);
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to get usage data');
        }
    }
    // Get weekly content checklist
    async getWeeklyChecklist(userId) {
        const data = await this.getUsageWithLimits(userId);
        const checklist = [
            {
                id: 'reel',
                title: 'Create Reels',
                task: `Create ${data.limits.reelsPerWeek} reels this week`,
                completed: data.usage.reelsUsed,
                target: data.limits.reelsPerWeek,
                description: 'Create short, engaging videos using our templates to reach new audiences.',
                isDone: data.usage.reelsUsed >= data.limits.reelsPerWeek,
            },
            {
                id: 'post',
                title: 'Create Posts',
                task: `Create ${data.limits.postsPerWeek} posts this week`,
                completed: data.usage.postsUsed,
                target: data.limits.postsPerWeek,
                description: 'Share high-quality images or graphics to keep your feed active and consistent.',
                isDone: data.usage.postsUsed >= data.limits.postsPerWeek,
            },
            {
                id: 'story',
                title: 'Create Stories',
                task: `Create ${data.limits.storiesPerWeek} stories this week`,
                completed: data.usage.storiesUsed,
                target: data.limits.storiesPerWeek,
                description: 'Post daily updates and behind-the-scenes to stay connected with your followers.',
                isDone: data.usage.storiesUsed >= data.limits.storiesPerWeek,
            },
        ];
        const isFullDone = checklist.every(item => item.isDone);
        return {
            isFullDone,
            checklist,
        };
    }
    // Check if user is approaching limits (80% threshold)
    async checkApproachingLimits(userId) {
        try {
            const data = await this.getUsageWithLimits(userId);
            const warnings = [];
            const suggestions = [];
            return { warnings, suggestions };
        }
        catch (error) {
            console.error('Error checking approaching limits:', error);
            return { warnings: [], suggestions: [] };
        }
    }
    // Private helper methods
    async getCurrentServiceCount(userId) {
        try {
            // This can be used to track any user-created content that is limited by plan
            // For now returning 0, can be connected to any content model (e.g., Posts, Recipes)
            return 0;
        }
        catch (error) {
            console.error('Error getting content count:', error);
            return 0;
        }
    }
    async getCurrentTeamMemberCount(userId) {
        try {
            // For now, we assume a professional always has themselves as a member
            // Expand this if a formal Team/Member collection is added later
            return 1;
        }
        catch (error) {
            console.error('Error getting team member count:', error);
            return 1;
        }
    }
    // Track feature usage (for analytics)
    async trackFeatureUsage(userId, feature) {
        try {
            console.log(`Feature used: ${feature} by user: ${userId}`);
        }
        catch (error) {
            console.error('Error tracking feature usage:', error);
        }
    }
}
exports.usageTrackingService = new UsageTrackingService();
