import fetch from 'node-fetch'
import config from '../config'
import ApiError from '../errors/ApiError'
import { StatusCodes } from 'http-status-codes'
import { VideoStats } from '../app/modules/content/content.interface'
import axios from 'axios'
import { Socialintegration } from '../app/modules/socialintegration/socialintegration.model'
import { Content } from '../app/modules/content/content.model'

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
export async function getFacebookUser(accessToken: string) {
  const res = await fetch(
    `https://graph.facebook.com/v23.0/me?fields=id,name,email,picture&access_token=${accessToken}`,
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data
}

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
) {
  const body: any = {
    caption,
    url: imageUrl,
    access_token: pageAccessToken,
    published: true,
  }

  const res = await fetch(`https://graph.facebook.com/v23.0/${pageId}/photos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.id
}

// perfect working function for reels
export async function uploadFacebookReelScheduled(
  pageId: string,
  pageAccessToken: string,
  videoUrl: string,
  caption: string,
  scheduledAt?: Date, // optional: if not provided, post immediately
) {
  const body: any = {
    description: caption, // Reels use 'description' instead of 'caption'
    file_url: videoUrl, // video URL
    access_token: pageAccessToken,
  }

  if (scheduledAt) {
    const unixTimestamp = Math.floor(scheduledAt.getTime() / 1000)
    body.published = false // must be false to schedule
    body.scheduled_publish_time = unixTimestamp
  } else {
    body.published = true // publish immediately
  }

  const res = await fetch(`https://graph.facebook.com/v23.0/${pageId}/videos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.id
}

// Perfect working Upload multiple photos as a carousel (scheduled or immediate)
export async function uploadFacebookCarouselScheduled(
  pageId: string,
  pageAccessToken: string,
  imageUrls: string[], // array of image URLs
  caption: string,
  scheduledAt?: Date, // optional: if not provided, post immediately
) {
  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    throw new Error('imageUrls must be a non-empty array')
  }

  // Step 1: Upload each photo as unpublished to get media_fbid
  const mediaFbids: string[] = []

  for (const url of imageUrls) {
    const photoBody: any = {
      url,
      published: false, // must be false for carousel
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
    if (photoData.error) throw new Error(photoData.error.message)

    mediaFbids.push(photoData.id)
  }

  // Step 2: Create the carousel post
  const postBody: any = {
    message: caption,
    attached_media: mediaFbids.map(id => ({ media_fbid: id })),
    access_token: pageAccessToken,
  }

  // Schedule if needed
  if (scheduledAt) {
    const unixTimestamp = Math.floor(scheduledAt.getTime() / 1000)
    postBody.published = false
    postBody.scheduled_publish_time = unixTimestamp
  } else {
    postBody.published = true
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
  if (postData.error) throw new Error(postData.error.message)

  return postData.id
}

// Function to post a Facebook Story (photo or video) == not access by graph api
export async function uploadFacebookPageStory(
  pageId: string,
  pageAccessToken: string,
  mediaUrl: string, // photo or video URL
  type: 'photo' | 'video', // media type
  caption?: string, // optional caption
  scheduledAt?: Date, // optional: schedule reel
) {
  const body: any = {
    access_token: pageAccessToken,
  }

  if (type === 'photo') {
    body.url = mediaUrl // photo URL
    if (caption) body.description = caption
  } else if (type === 'video') {
    body.file_url = mediaUrl // video URL
    if (caption) body.description = caption
  } else {
    throw new Error('Invalid type: must be photo or video')
  }

  // Schedule if provided
  if (scheduledAt) {
    const unixTimestamp = Math.floor(scheduledAt.getTime() / 1000)
    body.published = false
    body.scheduled_publish_time = unixTimestamp
  } else {
    body.published = true // publish immediately
  }

  const endpoint =
    type === 'video'
      ? `https://graph.facebook.com/v23.0/${pageId}/videos`
      : `https://graph.facebook.com/v23.0/${pageId}/photos`

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  if (data.error) throw new Error(data.error.message)

  return {
    id: data.id,
    simulatedStory: true,
    type,
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

    if (type === 'post') {
      payload = { image_url: mediaUrl, caption }
    } else if (type === 'reel') {
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
  type: 'post' | 'reel',
  caption: string,
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

async function instagramPublishWorker() {
  const pendingContents = await Content.find({
    'platformStatus.instagram': 'pending',
  })

  for (const content of pendingContents) {
    try {
      if (!content.instagramContainerId) continue

      const { instagramId, instagramAccessToken } =
        await getInstagramTokenAndIdFromDB(content.user?.toString() || '')

      // If it's a reel, check container status first
      if (content.contentType === 'reels') {
        await checkContainerStatus(
          content.instagramContainerId,
          instagramAccessToken,
        )
        await new Promise(res => setTimeout(res, 5000)) // small buffer
      }

      await tryPublish(
        instagramId,
        instagramAccessToken,
        content.instagramContainerId,
        'reel',
        content.caption!,
      )

      content?.platformStatus!.set('instagram', 'published')
      await content.save()
      console.log('✅ Instagram content published:', content._id)
    } catch (err: any) {
      console.log('Will retry later:', content._id, err.message)
    }
  }
}

// run every 5s
setInterval(() => {
  instagramPublishWorker().catch(console.error)
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

  if (content.contentType === 'reels') {
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
  await content.save()

  return containerId
}
