import fetch from 'node-fetch'
import config from '../config'
import ApiError from '../errors/ApiError'
import { StatusCodes } from 'http-status-codes'
import { IContent, VideoStats } from '../app/modules/content/content.interface'
import axios from 'axios'
import { Socialintegration } from '../app/modules/socialintegration/socialintegration.model'
import { Content } from '../app/modules/content/content.model'
import { Types } from 'mongoose'
import { CONTENT_STATUS } from '../app/modules/content/content.constants'
import { detectMediaType } from './detectMedia'

// exchange token short to long
export async function exchangeForLongLivedToken(
  shortLivedToken: string,
  appId: string,
  appSecret: string,
) {
  const url = new URL(`https://graph.facebook.com/v23.0/oauth/access_token`)
  url.searchParams.set('grant_type', 'fb_exchange_token')
  url.searchParams.set('client_id', appId)
  url.searchParams.set('client_secret', appSecret)
  url.searchParams.set('fb_exchange_token', shortLivedToken)

  const res = await fetch(url.toString(), { method: 'GET' })
  const data = await res.json()

  if (data.error) {
    console.error('Facebook Token Exchange Error:', data.error)
    throw new Error(data.error.message)
  }

  return {
    accessToken: data.access_token,
    tokenType: data.token_type,
    expiresIn: data.expires_in, // usually 60 days in seconds
  }
}

// token facebook validation
export async function validateFacebookToken(inputToken: string) {
  const appId = config.facebook.app_id
  const appSecret = config.facebook.app_secret

  const url = `https://graph.facebook.com/v23.0/debug_token?input_token=${inputToken}&access_token=${appId}|${appSecret}`

  const res = await fetch(url)
  const result = await res.json()

  // This is the actual token info object
  const tokenInfo = result.data

  if (!tokenInfo.is_valid) {
    // return tokenInfo.is_valid
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Facebook token expired')
  }

  return tokenInfo.is_valid // { is_valid, expires_at, scopes, user_id, ... }
}

// ----------------------
// Facebook Functions
// ----------------------
// get user by token
export async function getFacebookUser(accessToken: string) {
  const res = await fetch(
    `https://graph.facebook.com/v23.0/me?fields=id,name,email,picture&access_token=${accessToken}`,
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data
}

// get page by token
export async function getFacebookPages(accessToken: string) {
  const res = await fetch(
    `https://graph.facebook.com/v23.0/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${accessToken}`,
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.data.map((p: any) => ({
    pageId: p.id,
    pageName: p.name,
    pageAccessToken: p.access_token,
    instagramBusinessId: p.instagram_business_account?.id || null,
  }))
}

// not needed in clipframe but it's working for feed post
export async function postToFacebookPage(
  pageId: string,
  pageAccessToken: string,
  message: string,
) {
  console.log({ pageId, pageAccessToken, message })
  const res = await fetch(`https://graph.facebook.com/v23.0/${pageId}/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, access_token: pageAccessToken }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data
}

// not use this time i user later
export async function deleteFacebookPost(
  postId: string,
  pageAccessToken: string,
) {
  const res = await fetch(
    `https://graph.facebook.com/v23.0/${postId}?access_token=${pageAccessToken}`,
    { method: 'DELETE' },
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data
}

// perfect working function for photo
export async function uploadFacebookPhotoScheduled(
  pageId: string,
  pageAccessToken: string,
  imageUrl: string,
  caption: string,
  contentId: Types.ObjectId,
  isPublished: boolean,
  scheduledPublishTime?: number,
) {
  const type = await detectMediaType(imageUrl)

  if (type === 'video') {
    return await uploadFacebookReelScheduled(
      pageId,
      pageAccessToken,
      imageUrl,
      caption!,
      contentId!,
      isPublished,
      scheduledPublishTime,
    )
  }
  if (type === 'photo') {
    const body: any = {
      caption,
      url: imageUrl,
      access_token: pageAccessToken,
      published: isPublished,
    }

    if (!isPublished && scheduledPublishTime) {
      body.scheduled_publish_time = scheduledPublishTime
    }

    const res = await fetch(
      `https://graph.facebook.com/v23.0/${pageId}/photos`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    )

    const data = await res.json()
    if (data.error) throw new Error(data.error.message)
    const containerId = data.id

    if (containerId) {
      await Content.findOneAndUpdate(
        { _id: contentId },
        {
          $set: {
            facebookContainerId: containerId,
            status: isPublished ? CONTENT_STATUS.PUBLISHED : CONTENT_STATUS.SCHEDULED,
            'platformStatus.facebook': 'published',
          },
        },
        { new: true },
      )
    }

    return data.id
  }
}


// perfect working function for reel
export async function uploadFacebookReelScheduled(
  pageId: string,
  pageAccessToken: string,
  videoUrl: string,
  caption: string,
  contentId: Types.ObjectId,
  isPublished: boolean,
  scheduledPublishTime?: number,
) {
  const body: any = {
    description: caption, // Reels use 'description' instead of 'caption'
    file_url: videoUrl, // video URL
    access_token: pageAccessToken,
    published: isPublished,
  }

  if (!isPublished && scheduledPublishTime) {
    body.scheduled_publish_time = scheduledPublishTime
  }

  const res = await fetch(`https://graph.facebook.com/v23.0/${pageId}/videos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  if (data.error) throw new Error(data.error.message)

  const containerId = data.id

  if (containerId) {
    await Content.findOneAndUpdate(
      { _id: contentId },
      {
        $set: {
          facebookContainerId: containerId,
          status: isPublished ? CONTENT_STATUS.PUBLISHED : CONTENT_STATUS.SCHEDULED,
          'platformStatus.facebook': 'published',
        },
      },
      { new: true },
    )
  }
  return data.id
}


// Perfect working Upload multiple photos as a carousel (scheduled or immediate)
export async function uploadFacebookCarouselScheduled(
  pageId: string,
  pageAccessToken: string,
  imageUrls: string[], // array of image URLs
  caption: string,
  contentId: Types.ObjectId,
  isPublished: boolean,
  scheduledPublishTime?: number,
) {
  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    throw new Error('imageUrls must be a non-empty array')
  }

  const mediaFbids: string[] = []

  // Step 1: Upload each photo as unpublished to get media_fbid
  for (const url of imageUrls) {
    const photoBody = {
      url,
      published: false, // important — upload as unpublished
      access_token: pageAccessToken,
    }

    const photoRes = await fetch(
      `https://graph.facebook.com/v23.0/${pageId}/photos`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(photoBody),
      },
    )

    const photoData = await photoRes.json()
    if (!photoRes.ok || photoData.error) {
      throw new Error(photoData.error?.message || 'Failed to upload image')
    }

    mediaFbids.push(photoData.id)
  }

  // Step 2: Create the carousel post (unpublished container)
  const postBody: any = {
    message: caption,
    published: isPublished,
    attached_media: mediaFbids.map(id => ({ media_fbid: id })),
    access_token: pageAccessToken,
  }

  if (!isPublished && scheduledPublishTime) {
    postBody.scheduled_publish_time = scheduledPublishTime
  }

  const postRes = await fetch(
    `https://graph.facebook.com/v23.0/${pageId}/feed`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postBody),
    },
  )

  const postData = await postRes.json()
  if (!postRes.ok || postData.error) {
    throw new Error(postData.error?.message || 'Failed to create carousel post')
  }

  const containerId = postData.id

  if (containerId) {
    await Content.findOneAndUpdate(
      { _id: contentId },
      {
        $set: {
          facebookContainerId: containerId,
          status: isPublished ? CONTENT_STATUS.PUBLISHED : CONTENT_STATUS.SCHEDULED,
          'platformStatus.facebook': 'published',
        },
      },
      { new: true },
    )
  }

  return containerId
}


// Function to post a Facebook Story (photo or video) == not access by graph api

interface UploadStoryOptions {
  pageId: string
  pageAccessToken: string
  type: 'photo' | 'video'
  mediaUrl: string // public URL of photo or video
  contentId?: Types.ObjectId
  caption?: string // optional caption for video
}

// perfect working for facebook story
export async function uploadFacebookStory({
  pageId,
  pageAccessToken,
  type,
  mediaUrl,
  contentId,
  caption,
}: UploadStoryOptions) {
  if (type === 'photo') {
    // --- PHOTO STORY ---
    // Step 1: Upload photo as unpublished
    const uploadRes = await fetch(
      `https://graph.facebook.com/v24.0/${pageId}/photos`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: mediaUrl,
          published: false,
          access_token: pageAccessToken,
        }),
      },
    )

    const uploadData = await uploadRes.json()
    if (!uploadRes.ok || uploadData.error) {
      throw new Error(uploadData.error?.message || 'Failed to upload photo')
    }

    const photoId = uploadData.id
    console.log('✅ Uploaded photo ID:', photoId)

    // Step 2: Publish photo as story
    const storyRes = await fetch(
      `https://graph.facebook.com/v24.0/${pageId}/photo_stories`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photo_id: photoId,
          access_token: pageAccessToken,
        }),
      },
    )

    const storyData = await storyRes.json()
    if (!storyRes.ok || storyData.error || !storyData.success) {
      throw new Error(
        storyData.error?.message || 'Failed to publish photo story',
      )
    }

    const postId = storyData.post_id
    console.log('✅ Published Facebook photo story:', postId)

    if (contentId) {
      await Content.findOneAndUpdate(
        { _id: contentId },
        {
          $set: {
            facebookContainerId: postId,
            status: CONTENT_STATUS.SCHEDULED,
            'platformStatus.facebook': 'published',
          },
        },
        { new: true },
      )
    }

    return postId
  }
  // For video , meta not allow published vidoe story
  if (type === 'video') {
    // Step 1: Initialize video story session
    const initRes = await fetch(
      `https://graph.facebook.com/v24.0/${pageId}/video_stories`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          upload_phase: 'start',
          access_token: pageAccessToken,
        }),
      },
    )
    const initData = await initRes.json()
    if (!initRes.ok || initData.error)
      throw new Error(
        initData.error?.message || 'Failed to initialize video story',
      )
    const { video_id, upload_url } = initData

    console.log({ video_id, upload_url })

    // Step 2: Upload hosted video
    const uploadRes = await fetch(upload_url, {
      method: 'POST',
      headers: { file_url: mediaUrl },
    })
    const uploadData = await uploadRes.json()
    console.log({ uploadError: uploadData })
    if (!uploadRes.ok || uploadData.error || !uploadData.success)
      throw new Error(uploadData.error?.message || 'Failed to upload video')

    console.log({ uploadData })

    // Step 3: Finish upload and publish story
    const finishRes = await fetch(
      `https://graph.facebook.com/v24.0/${pageId}/video_stories`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          upload_phase: 'finish',
          video_id,
          access_token: pageAccessToken,
          description: caption,
        }),
      },
    )
    const finishData = await finishRes.json()
    console.log({ finishData })
    console.log({ error: finishData.error })
    if (!finishRes.ok || finishData.error || !finishData.success)
      throw new Error(
        finishData.error?.message || 'Failed to publish video story',
      )

    const postId = finishData.post_id

    if (contentId) {
      await Content.findByIdAndUpdate(contentId, {
        facebookContainerId: postId,
        status: CONTENT_STATUS.SCHEDULED,
        'platformStatus.facebook': 'published',
      })
    }
    return postId
  }
}

export async function getFacebookPhotoDetails(
  photoId: string,
  pageAccessToken: string,
) {
  const fields = [
    'id',
    'created_time',
    'updated_time',
    'images',
    'likes.summary(true)',
    'comments.summary(true)',
    'insights.metric(post_impressions)',
  ].join(',')

  const url = `https://graph.facebook.com/v24.0/${photoId}?fields=${fields}&access_token=${pageAccessToken}`

  const res = await fetch(url)
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`FB API error: ${res.status} – ${errText}`)
  }

  const data = await res.json()

  // Retrieve impressions
  const impressions =
    data.insights?.data?.find((i: any) => i.name === 'post_impressions')
      ?.values?.[0]?.value ?? 0

  // Retrieve shares count
  const sharesCount = data.shares?.count ?? 0

  return {
    id: data.id,
    createdAt: data.created_time,
    updatedAt: data.updated_time,
    imageUrl: data.images?.[0]?.source ?? '',
    likesCount: data.likes?.summary?.total_count ?? 0,
    commentsCount: data.comments?.summary?.total_count ?? 0,
    sharesCount,
    impressions,
  }
}

// work later for video insights and stats
export async function getFacebookVideoFullDetails(
  videoId: string,
  pageAccessToken: string,
) {
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
  ].join(',')

  const url = `https://graph.facebook.com/v21.0/${videoId}?fields=${fields}&access_token=${pageAccessToken}`

  const res = await fetch(url)
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`FB API error: ${res.status} – ${errText}`)
  }

  const data = await res.json()

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
    privacy: data.privacy?.value,
    status: data.status?.video_status,
    thumbnails: data.thumbnails?.data ?? [],
    likesCount: data.likes?.summary?.total_count ?? 0,
    commentsCount: data.comments?.summary?.total_count ?? 0,
    // Insights array comes back nested—map it to key/value
    insights: (data.video_insights?.data ?? []).reduce(
      (acc: any, item: any) => ({
        ...acc,
        [item.name]: item.values?.[0]?.value,
      }),
      {},
    ),
    // raw: data // keep full payload if you need it later
  }
}

// work later for all video stats from page
export async function getAllPageVideoStats(
  pageId: string,
  pageAccessToken: string,
): Promise<VideoStats[]> {
  // 1️⃣ Fetch the page feed
  const feedUrl = `https://graph.facebook.com/v23.0/${pageId}/feed?fields=id,attachments{media_type,target,url},created_time,updated_time&access_token=${pageAccessToken}`
  const feedRes = await fetch(feedUrl)
  if (!feedRes.ok)
    throw new Error(`Failed to fetch page feed: ${feedRes.statusText}`)
  const feedData = await feedRes.json()

  const results: VideoStats[] = []

  for (const post of feedData.data) {
    const attachment = post.attachments?.data?.[0]
    if (!attachment || attachment.media_type !== 'video') continue

    const videoId = attachment.target?.id
    if (!videoId) continue

    // 2️⃣ Fetch video node for full details (description, videoUrl, duration)
    const videoRes = await fetch(
      `https://graph.facebook.com/v23.0/${videoId}?fields=description,source,length&access_token=${pageAccessToken}`,
    )
    const videoData = await videoRes.json()

    const description = videoData.description ?? null
    const videoUrl = videoData.source ?? ''
    const durationSec = videoData.length ?? 0

    // 3️⃣ Fetch post-level likes/comments
    const postRes = await fetch(
      `https://graph.facebook.com/v23.0/${post.id}?fields=likes.summary(true),comments.summary(true)&access_token=${pageAccessToken}`,
    )
    const postData = await postRes.json()
    const likesCount = postData.likes?.summary?.total_count ?? 0
    const commentsCount = postData.comments?.summary?.total_count ?? 0

    // 4️⃣ Fetch video insights
    const metricsList = [
      'total_video_views',
      'total_video_impressions',
      'total_video_10s_views',
      'total_video_15s_views',
      'total_video_30s_views',
      'total_video_complete_views',
      'post_video_avg_time_watched',
    ].join(',')

    const insightsRes = await fetch(
      `https://graph.facebook.com/v23.0/${videoId}/video_insights?metric=${metricsList}&access_token=${pageAccessToken}`,
    )
    const insightsData = await insightsRes.json()

    const metrics: Record<string, number> = {}
    for (const m of insightsData.data || []) {
      metrics[m.name] = Number(m.values?.[0]?.value ?? 0)
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
    })
  }

  return results
}

// ----------------------
// Instagram Functions
// ----------------------

// Get Instagram Util for get db token

export const getInstagramTokenAndIdFromDB = async (user: string) => {
  const instagramAccount = await Socialintegration.findOne({
    user,
    platform: 'instagram',
  })

  if (
    !instagramAccount ||
    !instagramAccount.accessToken ||
    instagramAccount.accounts?.length === 0
  ) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'No Instagram social account found, please connect your Instagram account first.',
    )
  }

  const instagramId =
    instagramAccount.accounts && instagramAccount.accounts[0].igUserId
  const instagramAccessToken =
    instagramAccount.accounts && instagramAccount.accounts[0].pageAccessToken!

  return { instagramId, instagramAccessToken }
}

// get DB token and page id
export const getFacebookTokenAndIdFromDB = async (user: string) => {
  const facebookAccount = await Socialintegration.findOne({
    user,
    platform: 'facebook',
  })

  if (
    !facebookAccount ||
    !facebookAccount.accessToken ||
    facebookAccount.accounts?.length === 0
  ) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'No facebook social account found, please connect your facebook account first.',
    )
  }

  const facebookPageId =
    facebookAccount.accounts && facebookAccount.accounts[0].pageId
  const facebookAccessToken =
    facebookAccount.accounts && facebookAccount.accounts[0].pageAccessToken!

  return { facebookPageId, facebookAccessToken }
}

// perfect working function
export async function getInstagramAccounts(accessToken: string) {
  try {
    // 1️⃣ Get all Facebook Pages for this user
    const pagesResp = await axios.get(
      `https://graph.facebook.com/v19.0/me/accounts`,
      {
        params: { access_token: accessToken },
      },
    )

    const pages = pagesResp.data?.data || []
    const igAccounts: Array<{
      pageId: string
      igUserId: string
      pageAccessToken: string
    }> = []

    // 2️⃣ Loop through each page to find connected IG accounts
    for (const page of pages) {
      if (!page.id || !page.access_token) continue

      try {
        const igResp = await axios.get(
          `https://graph.facebook.com/v19.0/${page.id}`,
          {
            params: {
              fields: 'connected_instagram_account',
              access_token: page.access_token,
            },
          },
        )

        const igAccount = igResp.data?.connected_instagram_account
        if (igAccount?.id) {
          igAccounts.push({
            pageId: page.id,
            igUserId: igAccount.id,
            pageAccessToken: page.access_token,
          })
        }
      } catch (err: any) {
        console.warn(
          `Failed to fetch IG account for page ${page.id}`,
          err.message,
        )
      }
    }

    return igAccounts
  } catch (err: any) {
    console.error('Failed to get Instagram accounts', err.message)
    return []
  }
}

const IG_GRAPH_URL = 'https://graph.facebook.com/v21.0'

interface CreateOptions {
  igUserId: string
  accessToken: string
  mediaUrl: string
  caption?: string
  type: 'post' | 'reel'
}

interface PublishOptions {
  igUserId: string
  accessToken: string
  containerId: string
  type: 'post' | 'reel'
}

// Perfect working without scheduling --- Step 1: Create Media Container ---
export async function createInstagramMedia({
  igUserId,
  accessToken,
  mediaUrl,
  caption,
  type,
}: CreateOptions): Promise<string> {
  try {
    let payload: any = {}

    const mediaTypeByURL = await detectMediaType(mediaUrl)

    if (type === 'post' && mediaTypeByURL !== 'video') {
      payload = { image_url: mediaUrl, caption }
    } else if (
      type === 'reel' ||
      (type === 'post' && mediaTypeByURL == 'video')
    ) {
      payload = { video_url: mediaUrl, caption, media_type: 'REELS' }
    }

    const containerRes = await axios.post(
      `${IG_GRAPH_URL}/${igUserId}/media`,
      payload,
      { params: { access_token: accessToken } },
    )

    return containerRes.data.id // return containerId
  } catch (err: any) {
    console.error('Instagram Create Error:', err.response?.data || err)
    throw err
  }
}

// perfect working
async function checkContainerStatus(
  containerId: string,
  accessToken: string,
  maxRetries = 20,
) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const res = await axios.get(`${IG_GRAPH_URL}/${containerId}`, {
      params: { access_token: accessToken, fields: 'status_code,status' },
    })

    const { status_code, status } = res.data

    if (status_code === 'FINISHED') return
    if (status_code === 'ERROR' || status === 'ERROR') {
      throw new Error(`Container processing failed: ${status}`)
    }

    const waitTime = Math.min(attempt * 5, 30) * 1000
    console.log(
      `Container not ready. Retry ${attempt}, wait ${waitTime / 1000}s`,
    )
    await new Promise(res => setTimeout(res, waitTime))
  }

  throw new Error(`Container not ready after ${maxRetries} attempts`)
}

// perfect working
async function tryPublish(
  igUserId: string,
  accessToken: string,
  containerId: string,
  type: 'post' | 'reel' | 'carousel' | 'story',
  caption: string,
  content: IContent,
) {
  const retries = 5
  for (let i = 0; i < retries; i++) {
    try {
      const res = await axios.post(
        `${IG_GRAPH_URL}/${igUserId}/media_publish`,
        { creation_id: containerId, caption },
        { params: { access_token: accessToken } },
      )
      console.log(`✅ Published ${type}:`, containerId)
      console.log({ id: res.data })
      if (res.data) {
        if (res.data) {
          await Content.updateOne(
            { _id: content._id },
            { $set: { contentId: res.data.id } },
          )
        }
      }
      return res.data
    } catch (err: any) {
      const code = err.response?.data?.code
      const subcode = err.response?.data?.error_subcode

      if (code === 9007 && subcode === 2207027) {
        console.log(`⏳ Media not ready, retrying in 5s...`)
        await new Promise(res => setTimeout(res, 5000))
        continue
      }
      throw err
    }
  }
  throw new Error(
    `Failed to publish ${type}: ${containerId} after ${retries} retries`,
  )
}

async function platformPublishWorker() {
  const now = new Date()
  const pendingContents = await Content.find({
    status: CONTENT_STATUS.SCHEDULED,
    $or: [
      { 'platformStatus.instagram': 'pending' },
      { 'platformStatus.facebook': 'pending' },
    ],
  })

  for (const content of pendingContents) {
    try {
      // Logic for checking scheduled time
      if (content.scheduledAt && content.scheduledAt.type === 'single') {
        const { date, time } = content.scheduledAt
        if (date && time) {
          const scheduledDateTime = new Date(date)
          const [hours, minutes] = time.split(':').map(Number)
          scheduledDateTime.setHours(hours, minutes, 0, 0)

          if (scheduledDateTime > now) {
            continue // Still in future
          }
        }
      }

      // 1. Handle Instagram
      if (content.platformStatus?.get('instagram') === 'pending') {
        const { instagramId, instagramAccessToken } =
          await getInstagramTokenAndIdFromDB(content.user?.toString() || '')

        if (content.instagramContainerId) {
          if (content.contentType === 'reel' || content.contentType === 'story') {
            await checkContainerStatus(
              content.instagramContainerId,
              instagramAccessToken,
            )
          }

          await tryPublish(
            instagramId,
            instagramAccessToken,
            content.instagramContainerId,
            content.contentType || 'post',
            content.caption!,
            content,
          )

          content.platformStatus.set('instagram', 'published')
          await content.save()
          console.log('✅ Instagram content published:', content._id)
        }
      }

      // 2. Handle Facebook (mostly for Story scheduling since FB doesn't support it natively)
      if (content.platformStatus?.get('facebook') === 'pending') {
        const { facebookPageId, facebookAccessToken } =
          await getFacebookTokenAndIdFromDB(content.user?.toString() || '')

        if (content.contentType === 'story') {
          const type = await detectMediaType(content.mediaUrls![0])
          await uploadFacebookStory({
            pageId: facebookPageId,
            pageAccessToken: facebookAccessToken,
            mediaUrl: content.mediaUrls![0],
            type,
            caption: content.caption!,
            contentId: content._id,
          })
          // uploadFacebookStory sets status to published internally
          console.log('✅ Facebook story published via worker:', content._id)
        }
      }
    } catch (err: any) {
      console.log('Worker retry later:', content._id, err.message)
    }
  }
}



// run every 5s
setInterval(() => {
  platformPublishWorker().catch(console.error)
}, 5000)


export async function uploadAndQueueInstagramContent(
  contentId: string,
  igUserId: string,
  accessToken: string,
) {
  console.log({ contentId })
  const content = await Content.findOne({ _id: contentId }).populate('user')

  if (!content) throw new Error('Content not found')

  let contentType: 'post' | 'reel' = 'post'

  if (content.contentType === 'reel') {
    contentType = 'reel'
  } else {
    contentType = 'post'
  }
  const containerId = await createInstagramMedia({
    igUserId,
    accessToken,
    mediaUrl: (content.mediaUrls && content.mediaUrls[0]) || '',
    caption: content.caption || '',
    type: contentType,
  })

  content.instagramContainerId = containerId
  content?.platformStatus?.set('instagram', 'pending')
  content.status = CONTENT_STATUS.SCHEDULED
  await content.save()

  return containerId
}

interface CreateCarouselOptions {
  igUserId: string
  accessToken: string
  imageUrls: string[] // array of image URLs
  caption?: string
  contentId: Types.ObjectId
}

/**
 * Create an Instagram carousel container (multiple images)
 * Returns the container ID which can later be published
 */
export async function createInstagramCarousel({
  igUserId,
  accessToken,
  contentId,
  imageUrls,
  caption,
}: CreateCarouselOptions): Promise<string> {
  if (!Array.isArray(imageUrls) || imageUrls.length < 2) {
    throw new Error('Instagram carousel requires at least 2 images')
  }

  try {
    const childrenContainerIds: string[] = []

    // Step 1: Create unpublished media containers for each image
    for (const imageUrl of imageUrls) {
      const res = await axios.post(
        `${IG_GRAPH_URL}/${igUserId}/media`,
        {
          image_url: imageUrl,
          published: false, // MUST be false
        },
        {
          params: { access_token: accessToken },
        },
      )

      if (!res.data.id) {
        throw new Error(
          'Failed to create media container for image: ' + imageUrl,
        )
      }

      childrenContainerIds.push(res.data.id)
    }

    // Step 2: Create the carousel container
    const carouselRes = await axios.post(
      `${IG_GRAPH_URL}/${igUserId}/media`,
      {
        media_type: 'CAROUSEL', // MUST set media_type
        children: childrenContainerIds, // ARRAY of IDs, NOT string
        caption,
        published: false, // MUST be false
      },
      {
        params: { access_token: accessToken },
      },
    )

    if (!carouselRes.data.id) {
      throw new Error('Failed to create carousel container')
    }

    await Content.findOneAndUpdate(
      { _id: contentId },
      {
        $set: {
          instagramContainerId: carouselRes.data.id,
          status: CONTENT_STATUS.SCHEDULED,
          'platformStatus.instagram': 'pending',
        },
      },
      { new: true },
    )

    return carouselRes.data.id
  } catch (err: any) {
    console.error(
      'Instagram Carousel Creation Error:',
      err.response?.data || err.message,
    )
    throw err
  }
}

interface UploadInstagramStoryOptions {
  igUserId: string
  accessToken: string
  mediaUrl: string // photo or video
  type: 'photo' | 'video'
  caption?: string
  contentId?: Types.ObjectId
}

export async function uploadInstagramStory({
  igUserId,
  accessToken,
  mediaUrl,
  type,
  caption,
  contentId,
}: UploadInstagramStoryOptions) {
  try {
    console.log(`📱 Starting Instagram ${type} Story Upload...`)

    const payload: any = {
      media_type: 'STORIES',
    }

    if (type === 'photo') {
      payload.image_url = mediaUrl
      console.log('🖼️ Uploading photo story...')
    } else if (type === 'video') {
      payload.video_url = mediaUrl // ✅ Just use video_url directly
      console.log('🎥 Uploading video story...')
    }

    if (caption) {
      payload.caption = caption
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
    }

    console.log('📤 Sending request to Instagram API...')
    const createRes = await axios.post(
      `${IG_GRAPH_URL}/${igUserId}/media`,
      payload,
      config,
    )

    if (!createRes.data.id) {
      throw new Error(`Failed to create ${type} story container`)
    }

    const containerId = createRes.data.id
    console.log(
      `✅ ${type === 'video' ? 'Video' : 'Photo'} Story Container Created: ${containerId}`,
    )

    // Update database
    if (contentId) {
      await Content.findOneAndUpdate(
        { _id: contentId },
        {
          $set: {
            instagramContainerId: containerId,
            status: CONTENT_STATUS.SCHEDULED,
            'platformStatus.instagram': 'pending',
          },
        },
        { new: true },
      )
    }

    return containerId
  } catch (err: any) {
    console.error(
      `❌ Instagram ${type} Story Upload Error:`,
      err.response?.data || err.message,
    )

    // Provide specific error messages
    if (err.response?.data?.error) {
      const igError = err.response.data.error
      if (igError.code === 100) {
        if (type === 'video') {
          throw new Error(
            'Video URL is invalid or not accessible. Make sure the URL is publicly accessible and the video is in MP4 format.',
          )
        } else {
          throw new Error('Image URL is invalid or not accessible.')
        }
      } else if (igError.code === 10) {
        throw new Error('App does not have permission to publish stories.')
      } else if (igError.message?.includes('permission')) {
        throw new Error(
          'Your Instagram account or app lacks permission to publish stories.',
        )
      }
    }

    throw err
  }
}

// working fine
export async function getInstagramPhotoDetails(
  mediaId: string,
  accessToken: string,
) {
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
    ].join(',')

    const basicUrl = `https://graph.facebook.com/v18.0/${mediaId}?fields=${basicFields}&access_token=${accessToken}`
    const basicRes = await fetch(basicUrl)
    const basicData = await basicRes.json()

    if (basicData.error) {
      throw new Error(`Failed to get photo: ${basicData.error.message}`)
    }

    // Verify it's a photo
    if (
      basicData.media_type !== 'IMAGE' &&
      basicData.media_type !== 'CAROUSEL_ALBUM'
    ) {
      throw new Error(`Not a photo. Media type: ${basicData.media_type}`)
    }

    // Get insights metrics
    const insightsUrl = `https://graph.facebook.com/v18.0/${mediaId}/insights?metric=impressions,reach,engagement,saved&access_token=${accessToken}`
    const insightsRes = await fetch(insightsUrl)
    const insightsData = await insightsRes.json()

    // Process insights
    const insights = (insightsData.data ?? []).reduce((acc: any, item: any) => {
      acc[item.name] = item.values?.[0]?.value || 0
      return acc
    }, {})

    return {
      // Basic photo info
      id: basicData.id,
      caption: basicData.caption ?? null,
      type: basicData.media_type,
      mediaUrl: basicData.media_url ?? null,
      permalink: basicData.permalink ?? null,
      timestamp: basicData.timestamp ?? null,

      // ✅ ENGAGEMENT STATS
      engagement: {
        likes: basicData.like_count ?? 0, // ✅ Like count
        comments: basicData.comments_count ?? 0, // ✅ Comment count
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
    }
  } catch (error) {
    console.error('Error in getInstagramPhotoStats:', error)
    throw error
  }
}

// working fine
export async function getInstagramVideoDetails(
  mediaId: string,
  accessToken: string,
) {
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
    ].join(',')

    const basicUrl = `https://graph.facebook.com/v18.0/${mediaId}?fields=${basicFields}&access_token=${accessToken}`
    const basicRes = await fetch(basicUrl)
    const basicData = await basicRes.json()

    if (basicData.error) {
      throw new Error(`Failed to get reel: ${basicData.error.message}`)
    }

    // ✅ Confirm it’s a video-type reel
    if (basicData.media_type !== 'VIDEO') {
      throw new Error(`Not a reel. Media type: ${basicData.media_type}`)
    }

    // ✅ Fetch insights (Reels support video_views here)
    const insightsUrl = `https://graph.facebook.com/v18.0/${mediaId}/insights?metric=impressions,reach,engagement,saved,video_views&access_token=${accessToken}`
    const insightsRes = await fetch(insightsUrl)
    const insightsData = await insightsRes.json()

    const insights = (insightsData.data ?? []).reduce((acc: any, item: any) => {
      acc[item.name] = item.values?.[0]?.value || 0
      return acc
    }, {})

    return {
      id: basicData.id,
      caption: basicData.caption ?? null,
      type: basicData.media_type,
      mediaUrl: basicData.media_url ?? null,
      permalink: basicData.permalink ?? null,
      timestamp: basicData.timestamp ?? null,

      // ✅ Engagement stats
      engagement: {
        likes: basicData.like_count ?? 0,
        comments: basicData.comments_count ?? 0,
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
    }
  } catch (error) {
    console.error('Error in getInstagramReelDetails:', error)
    throw error
  }
}
