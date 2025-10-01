import fetch from 'node-fetch'
import { VideoStats } from '../app/modules/content/content.interface'

/**
 * 1️⃣ Get basic Facebook user info
 * @param accessToken - Facebook user access token from mobile SDK
 */
export async function getFacebookUser(accessToken: string) {
  try {
    const url = `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`
    const res = await fetch(url)
    const data = await res.json()
    console.log({ data })

    if (data.error) {
      console.error('FB User Error:', data.error)
      throw new Error('Invalid Facebook user token')
    }

    return data // { id, name, email, picture }
  } catch (err) {
    console.error(err)
    throw err
  }
}

/**
 * 2️⃣ Get Facebook Pages and linked Instagram Business accounts
//  * @param accessToken - Facebook user access token
 */
export async function getFacebookPages(accessToken: string) {
  try {
    const url = `https://graph.facebook.com/v17.0/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${accessToken}`
    const res = await fetch(url)
    const data = await res.json()
    // console.log(data )

    if (data.error) {
      console.error('FB Pages Error:', data.error)
      throw new Error('Cannot fetch Facebook pages')
    }

    // Map to include Instagram Business ID if linked
    const pages = data.data.map((page: any) => ({
      pageId: page.id,
      pageName: page.name,
      pageAccessToken: page.access_token,
      instagramBusinessId: page.instagram_business_account?.id || null,
    }))

    console.log(pages)

    return pages
  } catch (err) {
    console.error(err)
    throw err
  }
}

export async function postToFacebookPage(
  pageId: string,
  pageAccessToken: string,
  message: string,
) {
  const url = `https://graph.facebook.com/${pageId}/feed`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      access_token: pageAccessToken,
    }),
  })

  const data = await res.json()
  console.log({ post: data })
  if (data.error) {
    throw new Error(`FB Post Error: ${data.error.message}`)
  }

  return data // { id: "post_id" }
}

export async function getFacebookPostDetails(
  objectId: string,
  pageAccessToken: string,
) {
  console.log('hit')
  try {
    // Step 1: Detect type of object
    const typeUrl = `https://graph.facebook.com/v23.0/${objectId}?fields=id,object_type&access_token=${pageAccessToken}`
    const typeRes = await fetch(typeUrl)
    const typeData = await typeRes.json()

    if (typeData.error) {
      throw new Error(typeData.error.message)
    }

    // Step 2: Fetch fields based on type
    let detailsUrl = ''

    if (typeData.object_type === 'video') {
      // For videos
      detailsUrl = `https://graph.facebook.com/v23.0/${objectId}?fields=id,title,description,permalink_url,created_time,length&access_token=${pageAccessToken}`
    } else {
      // Default: post
      detailsUrl = `https://graph.facebook.com/v23.0/${objectId}?fields=id,message,created_time,likes.summary(true),comments.summary(true)&access_token=${pageAccessToken}`
    }

    const detailsRes = await fetch(detailsUrl)
    const detailsData = await detailsRes.json()

    if (detailsData.error) {
      throw new Error(detailsData.error.message)
    }

    return {
      type: typeData.object_type || 'post',
      details: detailsData,
    }
  } catch (err) {
    console.error('FB Fetch Error:', err)
    throw err
  }
}

/**
 * 2️⃣ Delete a Facebook Page post
 * @param postId - Facebook Page post ID
 * @param pageAccessToken - Page access token
 */
export async function deleteFacebookPost(
  postId: string,
  pageAccessToken: string,
) {
  try {
    const url = `https://graph.facebook.com/${postId}?access_token=${pageAccessToken}`
    const res = await fetch(url, { method: 'DELETE' })
    const data = await res.json()
    console.log({ deletePost: data })

    if (data.error) {
      console.error('FB Delete Post Error:', data.error)
      throw new Error(data.error.message)
    }

    return data // Usually { success: true }
  } catch (err) {
    console.error(err)
    throw err
  }
}

export async function postVideoToFacebookPage(
  pageId: string,
  pageAccessToken: string,
  videoUrl: string,
  description: string,
): Promise<{ videoId: string; permalink: string }> {
  const url = `https://graph.facebook.com/v17.0/${pageId}/videos`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      file_url: videoUrl,
      description,
      published: true,
      access_token: pageAccessToken,
    }),
  })

  const data = await res.json()

  if (!res.ok || data.error) {
    throw new Error(
      `FB Video Post Error: ${data.error?.message || res.statusText}`,
    )
  }

  // Get permalink
  const metaRes = await fetch(
    `https://graph.facebook.com/v17.0/${data.id}?fields=permalink_url&access_token=${pageAccessToken}`,
  )
  const meta = await metaRes.json()

  return { videoId: data.id, permalink: meta.permalink_url }
}

// it's not permission from meta. just amni add korsi
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

export async function uploadFacebookPhoto(
  pageId: string,
  pageAccessToken: string,
  imageUrl: string,
) {
  const url = `https://graph.facebook.com/v17.0/${pageId}/photos`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: imageUrl,
      published: false, // Important! Don’t publish yet
      access_token: pageAccessToken,
    }),
  })

  const data = await res.json()
  console.log({ photos: data })
  if (data.error)
    throw new Error(`FB Photo Upload Error: ${data.error.message}`)

  return data.id // photo ID
}

export async function createFacebookMultiPhotoPost(
  pageId: string,
  pageAccessToken: string,
  photoIds: string[],
  message: string,
) {
  const attached_media = photoIds.map(id => ({ media_fbid: id }))

  const url = `https://graph.facebook.com/v17.0/${pageId}/feed`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      attached_media,
      access_token: pageAccessToken,
    }),
  })

  const data = await res.json()
  console.log({ posts: data })
  console.log({ postWithPhotos: data })
  if (data.error)
    throw new Error(`FB Multi-Photo Post Error: ${data.error.message}`)

  return data.id // post ID
}

export async function editFacebookPostCaption(
  postId: string,
  pageAccessToken: string,
  newCaption: string,
) {
  const url = `https://graph.facebook.com/v17.0/${postId}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: newCaption,
      access_token: pageAccessToken,
    }),
  })
  const data = await res.json()
  console.log({ updated: data })
  if (data.error) throw new Error(data.error.message)
  return data.id
}

// Instagram part

export async function getInstagramAccountDetails(
  igUserId: string, // Instagram Business Account ID
  pageAccessToken: string, // Page Access Token linked to Instagram
) {
  try {
    const url = `https://graph.facebook.com/v23.0/${igUserId}?fields=id,username,followers_count,follows_count,media_count&access_token=${pageAccessToken}`

    const res = await fetch(url)
    const data = await res.json()

    console.log({ instagramDetails: data })

    if (data.error) {
      console.error('Instagram Details Error:', data.error)
      throw new Error(data.error.message)
    }

    return data // Contains id, username, followers_count, follows_count, media_count
  } catch (err) {
    console.error(err)
    throw err
  }
}

// need update for create two different function
export async function postInstagramPhoto(
  igBusinessId: string,
  pageAccessToken: string,
  imageUrl: string,
  caption: string,
) {
  // Step 1: create the media container
  const creationRes = await fetch(
    `https://graph.facebook.com/v21.0/${igBusinessId}/media`,
    {
      method: 'POST',
      body: new URLSearchParams({
        image_url: imageUrl, // must be a public HTTPS URL
        caption,
        access_token: pageAccessToken,
      }),
    },
  )
  const creationData = await creationRes.json()
  if (creationData.error) throw new Error(creationData.error.message)

  // Step 2: publish it
  const publishRes = await fetch(
    `https://graph.facebook.com/v21.0/${igBusinessId}/media_publish`,
    {
      method: 'POST',
      body: new URLSearchParams({
        creation_id: creationData.id,
        access_token: pageAccessToken,
      }),
    },
  )
  const publishData = await publishRes.json()
  if (publishData.error) throw new Error(publishData.error.message)

  return publishData // returns the IG media ID
}

// instagram reels

export async function createInstagramReel(
  igBusinessId: string,
  pageAccessToken: string,
  videoUrl: string,
  caption: string,
): Promise<string> {
  const res = await fetch(
    `https://graph.facebook.com/v21.0/${igBusinessId}/media`,
    {
      method: 'POST',
      body: new URLSearchParams({
        media_type: 'REELS', // indicates a reel
        video_url: videoUrl,
        caption,
        access_token: pageAccessToken,
      }),
    },
  )

  const data = await res.json()
  if (data.error) throw new Error(data.error.message)

  return data.id // creation_id
}

export async function publishInstagramReel(
  igBusinessId: string,
  pageAccessToken: string,
  creationId: string,
): Promise<string> {
  const res = await fetch(
    `https://graph.facebook.com/v21.0/${igBusinessId}/media_publish`,
    {
      method: 'POST',
      body: new URLSearchParams({
        creation_id: creationId,
        access_token: pageAccessToken,
      }),
    },
  )

  const data = await res.json()
  console.log({ published_Reels: data })
  if (data.error) throw new Error(data.error.message)

  return data.id // final IG post ID
}

// for IG story posting

export async function createInstagramImageStory(
  igBusinessId: string,
  pageAccessToken: string,
  imageUrl: string,
  caption?: string,
): Promise<string> {
  try {
    // Construct request body for image only
    const body = {
      access_token: pageAccessToken,
      media_type: 'IMAGE',
      image_url: imageUrl,
      caption: caption || '',
    }

    // Call Graph API to create media container
    const res = await fetch(
      `https://graph.facebook.com/v23.0/${igBusinessId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    )

    const data = await res.json()

    if (data.error) {
      console.error('Instagram Image Story Error Response:', data.error)
      throw new Error(data.error.message)
    }

    console.log('Instagram Image Story Created:', data)
    return data.id // creation_id
  } catch (err) {
    console.error('Instagram Image Story Error:', err)
    throw err
  }
}

export async function publishInstagramStory(
  igBusinessId: string,
  pageAccessToken: string,
  creationId: string,
) {
  const res = await fetch(
    `https://graph.facebook.com/v21.0/${igBusinessId}/media_publish`,
    {
      method: 'POST',
      body: new URLSearchParams({
        creation_id: creationId,
        access_token: pageAccessToken,
      }),
    },
  )

  const data = await res.json()
  console.log({ data })
  if (data.error) throw new Error(data.error.message)
  return data.id // live Story ID
}
