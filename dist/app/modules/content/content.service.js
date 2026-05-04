"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentServices = exports.createContent = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const content_model_1 = require("./content.model");
const paginationHelper_1 = require("../../../helpers/paginationHelper");
const content_constants_1 = require("./content.constants");
const mongoose_1 = require("mongoose");
const usage_tracking_service_1 = require("../subscription/usage-tracking.service");
const socialintegration_model_1 = require("../socialintegration/socialintegration.model");
const caption_1 = require("../../../utils/caption");
const graphAPIHelper_1 = require("../../../helpers/graphAPIHelper");
const contenttemplate_model_1 = require("../contenttemplate/contenttemplate.model");
const detectMedia_1 = require("../../../helpers/detectMedia");
const stats_model_1 = require("../stats/stats.model");
const aiHelper_1 = require("../../../helpers/aiHelper");
// Old version
// export const createContent = async (
//   user: JwtPayload,
//   payload: IContent,
// ): Promise<IContent> => {
//   if (!payload.mediaUrls || payload.mediaUrls.length === 0) {
//     throw new ApiError(
//       StatusCodes.BAD_REQUEST,
//       'Media URLs are required to create content.',
//     )
//   }
//   let facebook, instagram
//   if (payload.platform) {
//     facebook = payload.platform.includes('facebook')
//     instagram = payload.platform.includes('instagram')
//   }
//   if (!facebook && !instagram) {
//     throw new ApiError(
//       StatusCodes.BAD_REQUEST,
//       'Please select at least one platform (Facebook or Instagram) to publish the content.',
//     )
//   }
//   if (
//     (payload.contentType === 'post' ||
//       payload.contentType === 'reel' ||
//       payload.contentType === 'story') &&
//     Array.isArray(payload.mediaUrls)
//   ) {
//     payload.mediaUrls = payload.mediaUrls.slice(0, 1)
//   }
//   if (payload.contentType === 'carousel') {
//     if (payload.mediaUrls.length < 2) {
//       throw new ApiError(
//         StatusCodes.BAD_REQUEST,
//         'At least 2 media URLs are required for carousel content.',
//       )
//     }
//   }
//   try {
//     // Check and increment usage inside the session
//     await checkAndIncrementUsage(user, payload.contentType as ContentType)
//     // Create content inside the same session
//     // const result = await Content.create(payload) // note the array form
//     const result = await Content.create([payload]) // note the array form
//     if (!result || result.length === 0) {
//       throw new ApiError(
//         StatusCodes.BAD_REQUEST,
//         'Failed to create Content, please try again with valid data.',
//       )
//     }
//     const caption = buildCaptionWithTags(payload?.caption, payload?.tags)
//     // implement facebook content posting
//     if (facebook) {
//       console.log('hit facebook')
//       const facebookAccount = await Socialintegration.findOne({
//         user: user.authId,
//         platform: 'facebook',
//       })
//       if (
//         !facebookAccount ||
//         !facebookAccount.accounts ||
//         facebookAccount.accounts.length === 0
//       ) {
//         throw new ApiError(
//           StatusCodes.BAD_REQUEST,
//           'No Facebook social account found, please connect your Facebook account first.',
//         )
//       }
//       if (facebookAccount && facebookAccount?.accounts?.length > 0) {
//         const pageId = facebookAccount.accounts[0].pageId
//         const pageAccessToken = facebookAccount.accounts[0].pageAccessToken!
//         // For Post
//         if (payload.contentType === 'post') {
//           const published = await uploadFacebookPhotoScheduled(
//             pageId,
//             pageAccessToken,
//             payload.mediaUrls![0],
//             caption,
//             result[0]._id,
//             true,
//           )
//           console.log('Published to Facebook Page:', published)
//           if (!published) {
//             throw new ApiError(
//               StatusCodes.BAD_REQUEST,
//               'Failed to schedule Facebook post, please try again.',
//             )
//           }
//         } else if (payload.contentType === 'reel') {
//           const reelsPublished = await uploadFacebookReelScheduled(
//             pageId,
//             pageAccessToken,
//             payload.mediaUrls![0],
//             caption,
//             result[0]._id,
//             true,
//           )
//           console.log('Published to Facebook Page:', reelsPublished)
//           if (!reelsPublished) {
//             throw new ApiError(
//               StatusCodes.BAD_REQUEST,
//               'Failed to schedule Facebook reel, please try again.',
//             )
//           }
//         } else if (payload.contentType === 'carousel') {
//           const carouselPublished = await uploadFacebookCarouselScheduled(
//             pageId,
//             pageAccessToken,
//             payload.mediaUrls!,
//             caption,
//             result[0]._id,
//             true,
//           )
//           console.log('Published to Facebook Page:', carouselPublished)
//           if (!carouselPublished) {
//             throw new ApiError(
//               StatusCodes.BAD_REQUEST,
//               'Failed to schedule Facebook carousel, please try again.',
//             )
//           }
//         } else if (payload.contentType === 'story') {
//           const type = await detectMediaType(payload.mediaUrls![0])
//           if (type === 'video') {
//             throw new ApiError(
//               StatusCodes.BAD_REQUEST,
//               'Facebook Stories support images only. Videos are not allowed.',
//             )
//           }
//           const storyPostId = await uploadFacebookStory({
//             pageId,
//             pageAccessToken,
//             mediaUrl: payload.mediaUrls![0],
//             type: type,
//             caption: 'Check this video!',
//             contentId: result[0]._id,
//           })
//           console.log('Published to Facebook Page:', storyPostId)
//           if (!storyPostId) {
//             throw new ApiError(
//               StatusCodes.BAD_REQUEST,
//               'Failed to schedule Facebook story, please try again.',
//             )
//           }
//         }
//       }
//     }
//     // implementing instagram content posing
//     if (instagram) {
//       console.log('hit instagram')
//       // get Id and token from DB
//       const { instagramId, instagramAccessToken } =
//         await getInstagramTokenAndIdFromDB(user.authId)
//       if (payload.contentType === 'post' || payload.contentType === 'reel') {
//         console.log('hit post')
//         const containerId = await uploadAndQueueInstagramContent(
//           result[0]._id.toString(),
//           instagramId,
//           instagramAccessToken,
//         )
//         console.log(containerId)
//       } else if (payload.contentType === 'carousel') {
//         console.log('hit carousel')
//         const carouselContainerId = await createInstagramCarousel({
//           igUserId: instagramId,
//           accessToken: instagramAccessToken,
//           imageUrls: result[0].mediaUrls!,
//           caption: result[0].caption,
//           contentId: result[0]._id,
//         })
//         console.log('Carousel Container ID:', carouselContainerId)
//       } else if (payload.contentType === 'story') {
//         const type = await detectMediaType(payload.mediaUrls![0])
//         console.log('hit story')
//         const carouselContainerId = await uploadInstagramStory({
//           igUserId: instagramId,
//           accessToken: instagramAccessToken,
//           mediaUrl:
//             (result[0] && result[0].mediaUrls && result[0].mediaUrls[0]) || '',
//           caption: result[0].caption,
//           type: type,
//           contentId: result[0]._id,
//         })
//         console.log('Carousel Container ID:', carouselContainerId)
//       }
//     }
//     if (result[0].templateId) {
//       await ContentTemplate.findByIdAndUpdate(
//         result[0].templateId,
//         { $inc: { 'stats.reuseCount': 1 } },
//         { new: true },
//       )
//     }
//     return result[0]
//     // return result[0]
//   } catch (error: any) {
//     if (error.code === 11000) {
//       throw new ApiError(StatusCodes.CONFLICT, 'Duplicate entry found')
//     }
//     throw error
//   }
// }
// new version
const createContent = async (user, payload) => {
    var _a;
    const CONTENT_TYPES = ['post', 'reel', 'carousel', 'story'];
    if (!payload.mediaUrls || payload.mediaUrls.length === 0) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Media URLs are required to create content.');
    }
    console.log(payload, 'payload');
    const platforms = payload.platform || [];
    const facebook = platforms.includes('facebook');
    const instagram = platforms.includes('instagram');
    const tiktok = platforms.includes('tiktok');
    if (!facebook && !instagram && !tiktok) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Please select at least one platform (Facebook , Instagram or Tiktok).');
    }
    // Restrict mediaUrls for single media content
    if (['post', 'reel', 'story'].includes(payload.contentType)) {
        payload.mediaUrls = payload.mediaUrls.slice(0, 1);
    }
    if (payload.contentType === 'carousel' && payload.mediaUrls.length < 2) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'At least 2 media URLs are required for carousel content.');
    }
    if (payload.contentType === 'reel') {
        const urlType = await (0, detectMedia_1.detectMediaType)(payload.mediaUrls[0]);
        if (urlType !== 'video') {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'The provided media is not a video.');
        }
    }
    try {
        // Auto generate caption if not provided and templateId exists
        if (!payload.caption && payload.templateId) {
            const template = await contenttemplate_model_1.ContentTemplate.findById(payload.templateId);
            if (template) {
                const prompt = `Generate a caption for a social media ${payload.contentType || 'post'} based on this template:
        Title: ${template.title}
        Description: ${template.description}
        Steps: ${(_a = template.steps) === null || _a === void 0 ? void 0 : _a.map(step => step.title).join(', ')}
        Hashtags: ${template.hashtags.join(', ')}`;
                const aiResult = await aiHelper_1.AIHelper.generateCaption(prompt);
                if (aiResult) {
                    payload.caption = aiResult.caption;
                    if (aiResult.hashtags && Array.isArray(aiResult.hashtags)) {
                        payload.tags = [...(payload.tags || []), ...aiResult.hashtags];
                    }
                }
            }
        }
        await usage_tracking_service_1.usageTrackingService.checkAndIncrementUsage(user.authId.toString(), payload.contentType);
        const [createdContent] = await content_model_1.Content.create([payload]);
        if (!createdContent) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create content, try again.');
        }
        const caption = (0, caption_1.buildCaptionWithTags)(payload.caption, payload.tags);
        const tasks = [];
        // todo : need to uncomments
        // if (facebook) tasks.push(postToFacebook(user.authId, createdContent))
        // if (instagram) tasks.push(postToInstagram(user.authId, createdContent))
        // await Promise.all(tasks)
        // TODO, NEED UNCOMMENTS
        // if (createdContent.templateId) {
        //   await ContentTemplate.findByIdAndUpdate(
        //     createdContent.templateId,
        //     { $inc: { 'stats.reuseCount': 1 } },
        //     { new: true },
        //   )
        // }
        return createdContent;
    }
    catch (error) {
        if (error.code === 11000) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.CONFLICT, 'Duplicate entry found');
        }
        throw error;
    }
};
exports.createContent = createContent;
// Facebook posting
const postToFacebook = async (userId, content) => {
    var _a;
    const fbAccount = await socialintegration_model_1.Socialintegration.findOne({
        user: userId,
        platform: 'facebook',
    });
    if (!((_a = fbAccount === null || fbAccount === void 0 ? void 0 : fbAccount.accounts) === null || _a === void 0 ? void 0 : _a.length)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'No Facebook account connected.');
    }
    const { pageId, pageAccessToken } = fbAccount.accounts[0];
    let isPublished = true;
    let scheduledPublishTime;
    if (content.scheduledAt && content.scheduledAt.type === 'single') {
        const { date, time } = content.scheduledAt;
        if (date && time) {
            const scheduledDateTime = new Date(date);
            const [hours, minutes] = time.split(':').map(Number);
            scheduledDateTime.setHours(hours, minutes, 0, 0);
            const now = new Date();
            // Facebook requires scheduled_publish_time to be between 10 minutes and 30 days in the future
            const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);
            if (scheduledDateTime > tenMinutesFromNow) {
                isPublished = false;
                scheduledPublishTime = Math.floor(scheduledDateTime.getTime() / 1000);
            }
        }
    }
    switch (content.contentType) {
        case 'post':
            return (0, graphAPIHelper_1.uploadFacebookPhotoScheduled)(pageId, pageAccessToken, content.mediaUrls[0], content.caption, content._id, isPublished, scheduledPublishTime);
        case 'reel':
            return (0, graphAPIHelper_1.uploadFacebookReelScheduled)(pageId, pageAccessToken, content.mediaUrls[0], content.caption, content._id, isPublished, scheduledPublishTime);
        case 'carousel':
            return (0, graphAPIHelper_1.uploadFacebookCarouselScheduled)(pageId, pageAccessToken, content.mediaUrls, content.caption, content._id, isPublished, scheduledPublishTime);
        case 'story':
            const type = await (0, detectMedia_1.detectMediaType)(content.mediaUrls[0]);
            if (type === 'video')
                throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Facebook stories support images only.');
            if (isPublished) {
                return (0, graphAPIHelper_1.uploadFacebookStory)({
                    pageId,
                    pageAccessToken,
                    mediaUrl: content.mediaUrls[0],
                    type,
                    caption: content.caption,
                    contentId: content._id,
                });
            }
            else {
                await content_model_1.Content.findByIdAndUpdate(content._id, {
                    $set: { 'platformStatus.facebook': 'pending' },
                });
                return;
            }
    }
};
// Instagram posting
const postToInstagram = async (userId, content) => {
    const { instagramId, instagramAccessToken } = await (0, graphAPIHelper_1.getInstagramTokenAndIdFromDB)(userId);
    switch (content.contentType) {
        case 'post':
        case 'reel':
            return (0, graphAPIHelper_1.uploadAndQueueInstagramContent)(content._id.toString(), instagramId, instagramAccessToken);
        case 'carousel':
            return (0, graphAPIHelper_1.createInstagramCarousel)({
                igUserId: instagramId,
                accessToken: instagramAccessToken,
                imageUrls: content.mediaUrls,
                caption: content.caption,
                contentId: content._id,
            });
        case 'story':
            const type = await (0, detectMedia_1.detectMediaType)(content.mediaUrls[0]);
            return (0, graphAPIHelper_1.uploadInstagramStory)({
                igUserId: instagramId,
                accessToken: instagramAccessToken,
                mediaUrl: content.mediaUrls[0],
                caption: content.caption,
                type,
                contentId: content._id,
            });
    }
};
const getAllContents = async (user, filterables, pagination) => {
    const { searchTerm, date, ...otherFilters } = filterables;
    const { page, skip, limit, sortBy, sortOrder } = paginationHelper_1.paginationHelper.calculatePagination(pagination);
    const andConditions = [];
    // 🔍 Search functionality
    if (searchTerm) {
        andConditions.push({
            $or: [
                ...content_constants_1.contentSearchableFields.map(field => ({
                    [field]: { $regex: searchTerm, $options: 'i' },
                })),
                { caption: { $regex: searchTerm, $options: 'i' } },
                { 'captionI18n.en': { $regex: searchTerm, $options: 'i' } },
                { 'captionI18n.es': { $regex: searchTerm, $options: 'i' } },
            ],
        });
    }
    // 🎯 Single date filtering
    if (date) {
        const target = new Date(date);
        const startOfDay = new Date(target.setHours(0, 0, 0, 0));
        const endOfDay = new Date(target.setHours(23, 59, 59, 999));
        andConditions.push({
            'scheduledAt.date': { $gte: startOfDay, $lte: endOfDay },
        });
    }
    // 🛑 Always exclude deleted
    andConditions.push({
        status: { $nin: [content_constants_1.CONTENT_STATUS.DELETED, null] },
    });
    // 🎯 Other filters (status, contentType, etc.)
    if (Object.keys(otherFilters).length) {
        for (const [key, value] of Object.entries(otherFilters)) {
            andConditions.push({ [key]: value });
        }
    }
    const whereConditions = andConditions.length ? { $and: andConditions } : {};
    const [result, total] = await Promise.all([
        content_model_1.Content.find(whereConditions)
            .skip(skip)
            .limit(limit)
            .sort({ [sortBy]: sortOrder })
            .populate({
            path: 'user',
            select: 'name email verified',
        }),
        content_model_1.Content.countDocuments(whereConditions),
    ]);
    return {
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
        data: result,
    };
};
const getSingleContent = async (id) => {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid Content ID');
    }
    const result = await content_model_1.Content.findOne({
        _id: new mongoose_1.Types.ObjectId(id),
        status: { $ne: content_constants_1.CONTENT_STATUS.DELETED },
    }).populate({
        path: 'user',
        select: 'name email verified',
    });
    const stats = await stats_model_1.Stats.findOne({ contentId: result === null || result === void 0 ? void 0 : result._id });
    // .populate('facebookAccounts')
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Requested content not found, please try again with valid id');
    }
    return result;
};
const updateContent = async (id, payload) => {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid Content ID');
    }
    const result = await content_model_1.Content.findByIdAndUpdate(new mongoose_1.Types.ObjectId(id), { $set: payload }, {
        new: true,
        runValidators: true,
    }).populate({
        path: 'user',
        select: 'name email verified',
    });
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Requested content not found, please try again with valid id');
    }
    return result;
};
const deleteContent = async (id, user) => {
    var _a;
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid Content ID');
    }
    const isContentExists = await content_model_1.Content.findById(id);
    if (!isContentExists) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Content not found, please try again with valid id.');
    }
    const contentUser = (_a = isContentExists === null || isContentExists === void 0 ? void 0 : isContentExists.user) === null || _a === void 0 ? void 0 : _a.toString();
    const isUserMatched = contentUser === user.authId;
    if (!isUserMatched) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'You are not authorized to delete this content.');
    }
    const result = await content_model_1.Content.findByIdAndUpdate(new mongoose_1.Types.ObjectId(id), { status: 'deleted', user: new mongoose_1.Types.ObjectId(user.authId) }, { new: true });
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Something went wrong while deleting content, please try again with valid id.');
    }
    return result;
};
const duplicateContent = async (id, user) => {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid Content ID');
    }
    // 1️⃣ Fetch the original content
    const originalContent = await content_model_1.Content.findOne({
        _id: new mongoose_1.Types.ObjectId(id),
        status: { $ne: content_constants_1.CONTENT_STATUS.DELETED },
    });
    if (!originalContent) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Content not found or deleted');
    }
    // 2️⃣ Prepare duplicate data
    const base = originalContent.toObject();
    const dupSuffix = ' (Duplicate)';
    const i18n = base.captionI18n;
    const nextCaptionI18n = i18n &&
        typeof i18n === 'object' &&
        (i18n.en || i18n.es)
        ? {
            ...(i18n.en ? { en: `${i18n.en}${dupSuffix}` } : {}),
            ...(i18n.es ? { es: `${i18n.es}${dupSuffix}` } : {}),
        }
        : undefined;
    const duplicatedData = {
        ...base,
        _id: undefined, // Remove _id so MongoDB generates a new one
        createdAt: undefined,
        updatedAt: undefined,
        user: new mongoose_1.Types.ObjectId(user.authId), // assign new user if needed
        status: content_constants_1.CONTENT_STATUS.SCHEDULED, // reset status
        caption: base.caption ? `${base.caption}${dupSuffix}` : base.caption,
        captionI18n: nextCaptionI18n !== null && nextCaptionI18n !== void 0 ? nextCaptionI18n : base.captionI18n,
    };
    // 3️⃣ Create new content
    const duplicatedContent = await content_model_1.Content.create(duplicatedData);
    return duplicatedContent;
};
const getAllMyContents = async (user, filterables, pagination) => {
    const { searchTerm, date, ...otherFilters } = filterables;
    const { page, skip, limit, sortBy, sortOrder } = paginationHelper_1.paginationHelper.calculatePagination(pagination);
    const andConditions = [];
    // 🔍 Search functionality
    if (searchTerm) {
        andConditions.push({
            $or: [
                ...content_constants_1.contentSearchableFields.map(field => ({
                    [field]: { $regex: searchTerm, $options: 'i' },
                })),
                { caption: { $regex: searchTerm, $options: 'i' } },
                { 'captionI18n.en': { $regex: searchTerm, $options: 'i' } },
                { 'captionI18n.es': { $regex: searchTerm, $options: 'i' } },
            ],
        });
    }
    // 🛑 Always exclude deleted
    andConditions.push({
        status: { $nin: [content_constants_1.CONTENT_STATUS.DELETED, null] },
    });
    // ✅ Only current user
    andConditions.push({ user: new mongoose_1.Types.ObjectId(user.authId) });
    // 🎯 Other filters (status, contentType, etc.)
    if (Object.keys(otherFilters).length) {
        for (const [key, value] of Object.entries(otherFilters)) {
            andConditions.push({ [key]: value });
        }
    }
    const whereConditions = andConditions.length ? { $and: andConditions } : {};
    const [result, total] = await Promise.all([
        content_model_1.Content.find(whereConditions)
            .skip(skip)
            .limit(limit)
            .sort({ [sortBy]: sortOrder })
            .populate({
            path: 'user',
            select: 'name email verified',
        }),
        content_model_1.Content.countDocuments(whereConditions),
    ]);
    return {
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
        data: result,
    };
};
const generateCaption = async (templateId, tone, suggestions) => {
    var _a;
    const template = await contenttemplate_model_1.ContentTemplate.findById(templateId);
    if (!template) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Template not found');
    }
    const prompt = `Generate a social media caption based on this template:
  Title: ${template.title}
  Description: ${template.description}
  Steps: ${(_a = template.steps) === null || _a === void 0 ? void 0 : _a.map(step => step.title).join(', ')}
  Hashtags: ${template.hashtags.join(', ')}`;
    const result = await aiHelper_1.AIHelper.generateCaption(prompt, tone, suggestions);
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to generate caption');
    }
    return result;
};
exports.ContentServices = {
    createContent: exports.createContent,
    getAllContents,
    getSingleContent,
    updateContent,
    deleteContent,
    duplicateContent,
    getAllMyContents,
    generateCaption,
};
