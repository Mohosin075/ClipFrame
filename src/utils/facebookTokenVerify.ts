import fetch from 'node-fetch'

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
  postId: string,
  pageAccessToken: string,
) {
  try {
    const url = `https://graph.facebook.com/${postId}?fields=id,message,created_time,likes.summary(true),comments.summary(true)&access_token=${pageAccessToken}`
    const res = await fetch(url)
    const data = await res.json()
    console.log({ postDetails: data })

    if (data.error) {
      console.error('FB Post Details Error:', data.error)
      throw new Error(data.error.message)
    }

    return data // Contains likes, comments, message, created_time, etc.
  } catch (err) {
    console.error(err)
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
) {
  const url = `https://graph.facebook.com/v17.0/${pageId}/videos`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      file_url: videoUrl, // Publicly accessible URL
      description: description,
      access_token: pageAccessToken,
    }),
  })

  const data = await res.json()

  console.log({ data })

  if (data.error) {
    throw new Error(`FB Video Post Error: ${data.error.message}`)
  }

  return data.id // This is the video post ID
}

// it's not permission from meta. just amni add korsi
export async function getFacebookVideoInsights(
  videoPostId: string,
  pageAccessToken: string,
) {
  try {
    const url = `https://graph.facebook.com/${videoPostId}?fields=video_insights&access_token=${pageAccessToken}`
    const res = await fetch(url)
    const data = await res.json()

    console.log({ data })

    if (data.error) {
      console.error('FB Video Insights Error:', data.error)
      throw new Error(data.error.message)
    }

    return data.video_insights // Array of metrics like views, avg watch time, engagement
  } catch (err) {
    console.error(err)
    throw err
  }
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

export async function createInstagramStory(
  igBusinessId: string,
  pageAccessToken: string,
  mediaUrl: string, // HTTPS image/video URL
  caption?: string,
) {
  const res = await fetch(
    `https://graph.facebook.com/v21.0/${igBusinessId}/media`,
    {
      method: 'POST',
      body: new URLSearchParams({
        media_type: mediaUrl.endsWith('.mp4') ? 'VIDEO' : 'IMAGE',
        story: 'true', // marks it as a Story
        caption: caption || '',
        [mediaUrl.endsWith('.mp4') ? 'video_url' : 'image_url']: mediaUrl,
        access_token: pageAccessToken,
      }),
    },
  )

  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.id // creation_id
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
  if (data.error) throw new Error(data.error.message)
  return data.id // live Story ID
}
