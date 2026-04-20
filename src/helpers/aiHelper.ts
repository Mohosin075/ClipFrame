import axios from 'axios'
import config from '../config'

const generateCaption = async (
  prompt: string,
  tone?: string,
  suggestions?: string,
) => {
  if (!config.openAi_api_key) {
    console.error('OpenAI API Key is missing')
    return null
  }

  const systemPrompt = `You are a professional social media manager. Generate engaging captions, emojis, and hashtags based on the provided content details. 
  ${tone ? `The tone of the caption should be ${tone}.` : ''}
  ${suggestions ? `Incorporate these suggestions: ${suggestions}.` : ''}
  Respond in JSON format with fields: caption, emojis (array), and hashtags (array).`

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.openAi_api_key}`,
        },
      },
    )

    const result = JSON.parse(response.data.choices[0].message.content)
    return result
  } catch (error: any) {
    console.error(
      'Error generating caption with OpenAI:',
      error.response?.data || error.message,
    )
    return null
  }
}

export const AIHelper = {
  generateCaption,
}
