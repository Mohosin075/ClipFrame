import axios from 'axios'
import config from '../config'
import { upsertTikTokAccounts } from '../app/modules/socialintegration/socialintegration.service'

export async function getTiktokToken(code: string, state: string) {
  try {
    const tokenRes = await axios.post(
      'https://open.tiktokapis.com/v2/oauth/token/',
      new URLSearchParams({
        client_key: config.tikok.client_id!,
        client_secret: config.tikok.client_secret!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: config.tikok.callback_url!,
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    )

    const shortTokenData = tokenRes.data.access_token
    const userId = state

    if (shortTokenData && userId) {
      await upsertTikTokAccounts(shortTokenData, userId)
      return { accessToken: shortTokenData, userId }
    }

    throw new Error('TikTok token or userId missing')
  } catch (err) {
    console.error('Error getting TikTok token:', err)
    throw err
  }
}

export async function getTikTokAccounts(accessToken: string) {
  try {
    const fields = 'open_id,display_name,avatar_url,union_id' // specify required fields
    const url = `https://open.tiktokapis.com/v2/user/info/?fields=${fields}`

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    const data = response.data.data.user // user object is inside data.user

    return [
      {
        id: data.open_id,
        username: data.display_name,
        profilePicture: data.avatar_url,
        unionId: data.union_id,
        accessToken,
      },
    ]
  } catch (error: any) {
    console.error(
      'Error fetching TikTok accounts:',
      error.response?.data || error.message,
    )
    return []
  }
}
