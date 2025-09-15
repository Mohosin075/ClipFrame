import fetch from 'node-fetch'
import config from '../config'
import ApiError from '../errors/ApiError'
import { StatusCodes } from 'http-status-codes'

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

export async function postToFacebookPage(
  pageId: string,
  pageAccessToken: string,
  message: string,
) {
  const res = await fetch(`https://graph.facebook.com/v23.0/${pageId}/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, access_token: pageAccessToken }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data
}

export async function scheduleFacebookPost(
  pageId: string,
  pageAccessToken: string,
  message: string,
  publishTime: number, // UNIX timestamp
) {
  const res = await fetch(`https://graph.facebook.com/v23.0/${pageId}/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      published: false,
      scheduled_publish_time: publishTime,
      access_token: pageAccessToken,
    }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data
}

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

export async function uploadFacebookPhoto(
  pageId: string,
  pageAccessToken: string,
  imageUrl: string,
) {
  const res = await fetch(`https://graph.facebook.com/v23.0/${pageId}/photos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: imageUrl,
      published: false,
      access_token: pageAccessToken,
    }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.id
}

export async function getFacebookPostInsights(
  postId: string,
  pageAccessToken: string,
) {
  const res = await fetch(
    `https://graph.facebook.com/v23.0/${postId}/insights?metric=post_impressions,post_engaged_users,post_reactions_like_total,post_comments&access_token=${pageAccessToken}`,
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data
}

// ----------------------
// Instagram Functions
// ----------------------
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

export async function createInstagramReel(
  igBusinessId: string,
  pageAccessToken: string,
  videoUrl: string,
  caption: string,
) {
  const res = await fetch(
    `https://graph.facebook.com/v23.0/${igBusinessId}/media`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        media_type: 'REELS',
        video_url: videoUrl,
        caption,
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
