import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { IUser } from './user.interface'
import { User } from './user.model'

import { USER_ROLES, USER_STATUS } from '../../../enum/user'

import { JwtPayload } from 'jsonwebtoken'
import { logger } from '../../../shared/logger'
import { paginationHelper } from '../../../helpers/paginationHelper'
import { IPaginationOptions } from '../../../interfaces/pagination'
import { S3Helper } from '../../../helpers/image/s3helper'
import { Useronboarding } from '../useronboarding/useronboarding.model'
import config from '../../../config'
import { IUseronboarding } from '../useronboarding/useronboarding.interface'
import { Subscription } from '../subscription/subscription.model'
import { IPlan } from '../plan/plan.interface'
import {
  createFacebookMultiPhotoPost,
  createInstagramReel,
  deleteFacebookPost,
  editFacebookPostCaption,
  getAllPageVideoStats,
  getFacebookPages,
  getFacebookPostDetails,
  getFacebookUser,
  getFacebookVideoFullDetails,
  getInstagramAccountDetails,
  postInstagramPhoto,
  postToFacebookPage,
  postVideoToFacebookPage,
  publishInstagramReel,
  publishInstagramStory,
  uploadFacebookPhoto,
} from '../../../utils/facebookTokenVerify'
import { Socialintegration } from '../socialintegration/socialintegration.model'
import { validateFacebookToken } from '../../../helpers/graphAPIHelper'

const updateProfile = async (user: JwtPayload, payload: Partial<IUser>) => {
  const isUserExist = await User.findOne({
    _id: user.authId,
    status: { $nin: [USER_STATUS.DELETED] },
  })

  if (!isUserExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found.')
  }

  if (isUserExist.profile) {
    const url = new URL(isUserExist.profile)
    const key = url.pathname.substring(1)
    await S3Helper.deleteFromS3(key)
  }

  const updatedProfile = await User.findOneAndUpdate(
    { _id: user.authId, status: { $nin: [USER_STATUS.DELETED] } },
    {
      $set: payload,
    },
    { new: true },
  )

  if (!updatedProfile) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to update profile.')
  }

  return 'Profile updated successfully.'
}

const createAdmin = async (): Promise<Partial<IUser> | null> => {
  const admin = {
    email: config.super_admin.email,
    name: config.super_admin.name,
    password: config.super_admin.password,
    role: USER_ROLES.ADMIN,
    status: USER_STATUS.ACTIVE,
    verified: true,
    authentication: {
      oneTimeCode: null,
      restrictionLeftAt: null,
      expiresAt: null,
      latestRequestAt: new Date(),
      authType: '',
    },
  }

  const isAdminExist = await User.findOne({
    email: admin.email,
    status: { $nin: [USER_STATUS.DELETED] },
  })

  if (isAdminExist) {
    logger.log('info', 'Admin account already exist, skipping creation.🦥')
    return isAdminExist
  }
  const result = await User.create([admin])
  if (!result) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create admin')
  }
  return result[0]
}

const getAllUsers = async (paginationOptions: IPaginationOptions) => {
  console.log('iiiii')
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(paginationOptions)

  const [result, total] = await Promise.all([
    User.find({ status: { $nin: [USER_STATUS.DELETED] } })
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder })
      .exec(),

    User.countDocuments({ status: { $nin: [USER_STATUS.DELETED] } }),
  ])

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: result,
  }
}

const deleteUser = async (userId: string): Promise<string> => {
  const isUserExist = await User.findOne({
    _id: userId,
    status: { $nin: [USER_STATUS.DELETED] },
  })
  if (!isUserExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found.')
  }

  const deletedUser = await User.findOneAndUpdate(
    { _id: userId, status: { $nin: [USER_STATUS.DELETED] } },
    { $set: { status: USER_STATUS.DELETED } },
    { new: true },
  )

  if (!deletedUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to delete user.')
  }

  return 'User deleted successfully.'
}

const deleteProfile = async (
  userId: string,
  password: string,
): Promise<string> => {
  const isUserExist = await User.findOne({
    _id: userId,
    status: { $nin: [USER_STATUS.DELETED] },
  }).select('+password')
  if (!isUserExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found.')
  }
  const isPasswordMatched = await User.isPasswordMatched(
    password,
    isUserExist.password,
  )

  if (!isPasswordMatched) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Password is incorrect.')
  }

  const deletedUser = await User.findOneAndUpdate(
    { _id: userId, status: { $nin: [USER_STATUS.DELETED] } },
    { $set: { status: USER_STATUS.DELETED } },
    { new: true },
  )

  if (!deletedUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to delete user.')
  }

  return 'User deleted successfully.'
}

const getUserById = async (userId: string): Promise<IUser | null> => {
  const isUserExist = await User.findOne({
    _id: userId,
    status: { $nin: [USER_STATUS.DELETED] },
  })
  if (!isUserExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found.')
  }
  const user = await User.findOne({
    _id: userId,
    status: { $nin: [USER_STATUS.DELETED] },
  })
  return user
}

const updateUserStatus = async (userId: string, status: USER_STATUS) => {
  const isUserExist = await User.findOne({
    _id: userId,
    status: { $nin: [USER_STATUS.DELETED] },
  })
  if (!isUserExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found.')
  }

  const updatedUser = await User.findOneAndUpdate(
    { _id: userId, status: { $nin: [USER_STATUS.DELETED] } },
    { $set: { status } },
    { new: true },
  )

  if (!updatedUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to update user status.')
  }

  return 'User status updated successfully.'
}

export const getProfile = async (user: JwtPayload) => {
  // const accessTokenForFacebook =
  //   'EAATItxj1TL8BPZAtWTNvZA0lncReLA7uXSKZAnqZAcQM5NFsT56bz51hLrHloJ0SZAysukKRxIewsMBAZB11XGzMZAouBMXnHehwSCc0a0OGj50AYsmLQgxVHrSEH0nzWxSkH5u4V7KzqRptDO6xl6aAk4sF4PQeB7h1ZAkFqBg47LvzfRmoe8oXcgmZBdwZBlhhrk4uMoNef7mOmLtfELKvyX96ZCvVfKsmlX59hAQNnkjjiPUXcZAbzDdM4VxQZATDuRWyfhA25dDtwHQZDZD'
  const accessTokenForFacebook =
    'EAATItxj1TL8BPcVANZBAuO2YPcf8eZCIA8R71iYEiv4kxicvbFwTOIOZCSPxoKhANTEiwGdDYPSqw4OxSRZB2nJWYZCvZBedawhNpNzIqZBvDIaZA15v6XV5wfAmHENfv1gFAyxbm12LApxFif89CCl02rl3EcvjJKZCvwhAHeb3QJIPGBsSsqBHGHsLbdjUEFEhgcWsSaZAG4kZCMQ'

  const pageAccessToken =
    'EAATItxj1TL8BPT10uT2lZCdm87HZAxEokZAaWZC8BK44sgKttuY4FBZBUOFYtmXZBIWMorvdraUZCXnXb0xdPHRAwvGDZAMMhAjEnRTZBeSGPDsXUlOowonYWwVGZAEidLjLkZBndP2FnjgmkoKPRPLceZB5vNeiYuWIfmMFZAeeBZAuv58MQ21uPeYYjpdXP8iSxc8ZABvxwTZBJb3RlizW6TOp8Ilq'
  const token = await Socialintegration.findOne({ user: user.authId })

  // if (token) {
  //   const isValid = await validateFacebookToken(token.accessToken)
  //   console.log({ tokenValid: isValid })
  // }

  // getFacebookUser(accessTokenForFacebook)

  // getFacebookPages(accessTokenForFacebook)

  // postToFacebookPage(
  //   '823267804193695',
  //   pageAccessToken,
  //   'Its dev mode now.',
  // )

  // Get post details
  // const post = await getFacebookPostDetails('798669632642408', pageAccessToken)

  // console.log(post)

  // const stats = await getFacebookVideoStats("798669632642408", pageAccessToken);
  // console.log(stats.metrics.total_video_views);

  // Delete a post
  // await deleteFacebookPost('107280208355828_1204360558163683', pageAccessToken)

  // for posting video in facebook page
  const pageId = '823267804193695'
  const videoUrl =
    'https://clipframe.s3.ap-southeast-1.amazonaws.com/videos/1757808276395-9k4ec4p1bs7.mp4'
  const description = 'Check Post'

  // const dadta = await postVideoToFacebookPage(pageId, pageAccessToken, videoUrl, description)

  // console.log({dadta})

  const videoPostId = '1296375255515316'

  // it's not permission from meta. just amni add korsi
  const res = await getFacebookVideoFullDetails(videoPostId, pageAccessToken)
  // console.log({res})

  // const stats = await getAllPageVideoStats(pageId, pageAccessToken)
  // console.log(stats)

  // For upload multiple images with description
  const images = [
    'https://clipframe.s3.ap-southeast-1.amazonaws.com/image/1757809793604.png',
    'https://clipframe.s3.ap-southeast-1.amazonaws.com/image/1757809793604.png',
    'https://clipframe.s3.ap-southeast-1.amazonaws.com/image/1757809793604.png',
  ]

  // const photoIds = []
  // for (const img of images) {
  //   const id = await uploadFacebookPhoto(pageId, pageAccessToken, img)
  //   photoIds.push(id)
  // }

  // const postId = await createFacebookMultiPhotoPost(
  //   pageId,
  //   pageAccessToken,
  //   photoIds,
  //   'Check out our new carousel!',
  // )

  // const postId = '107280208355828_1204338478165891'
  const newCaption = 'Updated caption from ClipFrame! ✨'

  // await editFacebookPostCaption(
  //     postId,
  //     pageAccessToken,
  //     newCaption,
  //   )

  // For instagram

  const igBusinessId = '17841443388295568'

  // await getInstagramAccountDetails(igBusinessId, pageAccessToken)

  // await postInstagramPhoto(
  //   igBusinessId,
  //   pageAccessToken,
  //   'https://clipframe.s3.ap-southeast-1.amazonaws.com/image/1757809793604.png',
  //   '🔥 First Insta post from ClipFrame!',
  // )

  // for IG reels create

  // const creationId = await createInstagramReel(
  //   igBusinessId,
  //   pageAccessToken,
  //   'https://clipframe.s3.ap-southeast-1.amazonaws.com/videos/1757808619430-7clmu0rg4wo.mp4',
  //   '🔥 Instant Reel from ClipFrame!',
  // )
  // console.log({ creationId })
  // publishInstagramReel(igBusinessId, pageAccessToken, '18055106300446277')

  // const mediaUrl =
  //   'https://clipframe.s3.ap-southeast-1.amazonaws.com/image/1757809793604.png'
  // const caption = '🔥 My first Story from ClipFrame!'

  // try {
  //   const creationId = await createInstagramStory(
  //     igBusinessId,
  //     pageAccessToken,
  //     mediaUrl,
  //     caption,
  //   )
  //   console.log('Story creation_id:', creationId)
  // } catch (err) {
  //   console.error(err)
  // }

  // Step 2: publish the story immediately
  const creationId = '18055107215446277'
  // await publishInstagramStory(igBusinessId, pageAccessToken, creationId)

  // --- Fetch user ---
  const isUserExist = await User.findOne({
    _id: user.authId,
    status: { $nin: [USER_STATUS.DELETED] },
  }).select('-authentication -password -location -__v')

  if (!isUserExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found.')
  }

  // --- Fetch onboarding + subscription ---
  const [isOnboarded, subscriber] = await Promise.all([
    Useronboarding.findOne({ userId: user.authId }),
    Subscription.findOne({
      status: 'active',
      user: user.authId,
    })
      .populate<{ plan: IPlan }>({
        path: 'plan',
        select: 'name price features duration title',
      })
      .lean()
      .exec(),
  ])

  // --- Extract onboarding details ---
  const socialPlatforms =
    isOnboarded?.socialHandles?.map(s => s?.platform) ?? []

  // --- Build profile response ---
  return {
    ...isUserExist.toObject(),
    platforms: socialPlatforms,
    membership: subscriber?.plan?.title ?? '',
    preferredLanguages: isOnboarded?.preferredLanguages ?? [],
    businessType: isOnboarded?.businessType ?? 'General'
  }
}

export const UserServices = {
  updateProfile,
  createAdmin,
  getAllUsers,
  deleteUser,
  getUserById,
  updateUserStatus,
  getProfile,
  deleteProfile,
}
