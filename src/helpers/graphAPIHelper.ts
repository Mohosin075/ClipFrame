import fetch from 'node-fetch'
import config from '../config'
import ApiError from '../errors/ApiError'
import { StatusCodes } from 'http-status-codes'
import { VideoStats } from '../app/modules/content/content.interface'

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


export async function getFacebookVideoFullDetails(
  videoId: string,
  pageAccessToken: string
) {
  const fields = [
    // Core video meta
    "id",
    "description",
    "permalink_url",
    "created_time",
    "updated_time",
    "length",
    "content_category",
    "source",
    "embeddable",
    "published",
    "privacy",
    "status",
    "thumbnails",
    // Engagement stats
    "likes.summary(true)",
    "comments.summary(true)",
    "video_insights.metric(total_video_impressions,total_video_views,total_video_10s_views,post_video_avg_time_watched)",
  ].join(",");

  const url = `https://graph.facebook.com/v21.0/${videoId}?fields=${fields}&access_token=${pageAccessToken}`;

  const res = await fetch(url);
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
    privacy: data.privacy?.value,
    status: data.status?.video_status,
    thumbnails: data.thumbnails?.data ?? [],
    likesCount: data.likes?.summary?.total_count ?? 0,
    commentsCount: data.comments?.summary?.total_count ?? 0,
    // Insights array comes back nested—map it to key/value
    insights: (data.video_insights?.data ?? []).reduce(
      (acc: any, item: any) => ({ ...acc, [item.name]: item.values?.[0]?.value }),
      {}
    ),
    // raw: data // keep full payload if you need it later
  };
}


export async function getAllPageVideoStats(
  pageId: string,
  pageAccessToken: string
): Promise<VideoStats[]> {
  // 1️⃣ Fetch the page feed
  const feedUrl = `https://graph.facebook.com/v23.0/${pageId}/feed?fields=id,attachments{media_type,target,url},created_time,updated_time&access_token=${pageAccessToken}`;
  const feedRes = await fetch(feedUrl);
  if (!feedRes.ok) throw new Error(`Failed to fetch page feed: ${feedRes.statusText}`);
  const feedData = await feedRes.json();

  const results: VideoStats[] = [];

  for (const post of feedData.data) {
    const attachment = post.attachments?.data?.[0];
    if (!attachment || attachment.media_type !== "video") continue;

    const videoId = attachment.target?.id;
    if (!videoId) continue;

    // 2️⃣ Fetch video node for full details (description, videoUrl, duration)
    const videoRes = await fetch(
      `https://graph.facebook.com/v23.0/${videoId}?fields=description,source,length&access_token=${pageAccessToken}`
    );
    const videoData = await videoRes.json();

    const description = videoData.description ?? null;
    const videoUrl = videoData.source ?? "";
    const durationSec = videoData.length ?? 0;

    // 3️⃣ Fetch post-level likes/comments
    const postRes = await fetch(
      `https://graph.facebook.com/v23.0/${post.id}?fields=likes.summary(true),comments.summary(true)&access_token=${pageAccessToken}`
    );
    const postData = await postRes.json();
    const likesCount = postData.likes?.summary?.total_count ?? 0;
    const commentsCount = postData.comments?.summary?.total_count ?? 0;

    // 4️⃣ Fetch video insights
    const metricsList = [
      "total_video_views",
      "total_video_impressions",
      "total_video_10s_views",
      "total_video_15s_views",
      "total_video_30s_views",
      "total_video_complete_views",
      "post_video_avg_time_watched",
    ].join(",");

    const insightsRes = await fetch(
      `https://graph.facebook.com/v23.0/${videoId}/video_insights?metric=${metricsList}&access_token=${pageAccessToken}`
    );
    const insightsData = await insightsRes.json();

    const metrics: Record<string, number> = {};
    for (const m of insightsData.data || []) {
      metrics[m.name] = Number(m.values?.[0]?.value ?? 0);
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
