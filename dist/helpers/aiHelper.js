"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIHelper = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = __importDefault(require("../config"));
const generateCaption = async (prompt, tone, suggestions) => {
    var _a;
    if (!config_1.default.openAi_api_key) {
        console.error('OpenAI API Key is missing');
        return null;
    }
    const systemPrompt = `You are a professional social media manager. Generate engaging captions, emojis, and hashtags based on the provided content details. 
  ${tone ? `The tone of the caption should be ${tone}.` : ''}
  ${suggestions ? `Incorporate these suggestions: ${suggestions}.` : ''}
  Respond in JSON format with fields: caption, emojis (array), and hashtags (array).`;
    try {
        const response = await axios_1.default.post('https://api.openai.com/v1/chat/completions', {
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
        }, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${config_1.default.openAi_api_key}`,
            },
        });
        const result = JSON.parse(response.data.choices[0].message.content);
        return result;
    }
    catch (error) {
        console.error('Error generating caption with OpenAI:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        return null;
    }
};
exports.AIHelper = {
    generateCaption,
};
