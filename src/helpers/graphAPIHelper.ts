import fetch from 'node-fetch'
import config from '../config'
import ApiError from '../errors/ApiError'
import { StatusCodes } from 'http-status-codes'
import { VideoStats } from '../app/modules/content/content.interface'
import axios from 'axios'
import { Socialintegration } from '../app/modules/socialintegration/socialintegration.model'

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
  scheduledAt?: Date, // optional: if not provided, post immediately
) {
  const body: any = {
    caption,
    url: imageUrl,
    access_token: pageAccessToken,
  }

  if (scheduledAt) {
    const unixTimestamp = Math.floor(scheduledAt.getTime() / 1000)
    body.published = false // must be false to schedule
    body.scheduled_publish_time = unixTimestamp
  } else {
    body.published = true // publish immediately
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

// Get instagram User Profile

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

// for instagram reels with scheduling
export async function scheduleInstagramReel(
  igBusinessId: string,
  accessToken: string,
  videoUrl: string,
  caption: string,
  publishTime?: Date,
): Promise<string> {
  try {
    // Step 1: Create container
    const { data: container } = await axios.post(
      `https://graph.facebook.com/v23.0/${igBusinessId}/media`,
      {
        media_type: 'REELS',
        video_url: videoUrl,
        caption,
        access_token: accessToken,
      },
    )

    const creationId = container.id

    // Step 2: Poll until ready
    let status = 'IN_PROGRESS'
    const maxRetries = 20
    const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

    for (let i = 0; i < maxRetries; i++) {
      const { data } = await axios.get(
        `https://graph.facebook.com/v23.0/${creationId}`,
        { params: { fields: 'status_code', access_token: accessToken } },
      )

      status = data.status_code
      if (status === 'FINISHED') break

      await delay(5000) // wait 5s before re-checking
    }

    if (status !== 'FINISHED') {
      throw new Error('Video not ready after polling')
    }

    // Step 3: Publish (or schedule)
    const publishPayload: Record<string, any> = {
      creation_id: creationId,
      access_token: accessToken,
    }
    if (publishTime) {
      publishPayload.publish_at = Math.floor(publishTime.getTime() / 1000)
    }

    const { data: publishRes } = await axios.post(
      `https://graph.facebook.com/v23.0/${igBusinessId}/media_publish`,
      publishPayload,
    )

    return publishRes.id
  } catch (err: any) {
    console.error('Error scheduling reel:', err.response?.data || err.message)
    throw new Error('Failed to schedule Reel')
  }
}

export async function createInstagramImage(
  igBusinessId: string,
  pageAccessToken: string,
  imageUrl: string,
  caption?: string,
) {
  const res = await fetch(
    `https://graph.facebook.com/v23.0/${igBusinessId}/media`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        media_type: 'IMAGE',
        image_url: imageUrl,
        caption: caption || '',
        access_token: pageAccessToken,
      }),
    },
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.id
}

export async function createInstagramStory(
  igBusinessId: string,
  pageAccessToken: string,
  mediaUrl: string,
  type: 'IMAGE' | 'VIDEO',
  caption?: string,
) {
  const body: any = { media_type: type, access_token: pageAccessToken }
  if (type === 'IMAGE') body.image_url = mediaUrl
  else body.video_url = mediaUrl
  if (caption) body.caption = caption

  const res = await fetch(
    `https://graph.facebook.com/v23.0/${igBusinessId}/media`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.id
}

export async function publishInstagramMedia(
  igBusinessId: string,
  pageAccessToken: string,
  creationId: string,
) {
  const res = await fetch(
    `https://graph.facebook.com/v23.0/${igBusinessId}/media_publish`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: creationId,
        access_token: pageAccessToken,
      }),
    },
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.id
}

export async function scheduleInstagramPost(
  igBusinessId: string,
  pageAccessToken: string,
  creationId: string,
  publishTime: number,
) {
  const res = await fetch(
    `https://graph.facebook.com/v23.0/${igBusinessId}/media_publish`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: creationId,
        publish_at: publishTime,
        access_token: pageAccessToken,
      }),
    },
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.id
}

export async function createInstagramCarousel(
  igBusinessId: string,
  pageAccessToken: string,
  mediaUrls: string[],
  captions?: string[],
) {
  const creationIds: string[] = []

  for (let i = 0; i < mediaUrls.length; i++) {
    const id = await createInstagramImage(
      igBusinessId,
      pageAccessToken,
      mediaUrls[i],
      captions?.[i],
    )
    creationIds.push(id)
  }

  const res = await fetch(
    `https://graph.facebook.com/v23.0/${igBusinessId}/media`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        media_type: 'CAROUSEL',
        children: creationIds,
        access_token: pageAccessToken,
      }),
    },
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.id
}

// not completed
export async function getInstagramPostInsights(
  igMediaId: string,
  pageAccessToken: string,
) {
  const res = await fetch(
    `https://graph.facebook.com/v23.0/${igMediaId}?fields=like_count,comments_count,impressions,reach,engagement&access_token=${pageAccessToken}`,
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data
}
