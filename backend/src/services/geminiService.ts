import axios from 'axios';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

export interface GeneratedContent {
  content: string;
  hashtags?: string[];
  title?: string;
}

export const generateTwitterContent = async (prompt: string): Promise<GeneratedContent> => {
  const systemPrompt = `You are a social media expert. Generate a creative, engaging Twitter post (max 280 characters) based on the user's idea. Return JSON with "content" (the tweet) and "hashtags" (array of hashtags).`;

  const response = await axios.post(
    GEMINI_URL,
    {
      contents: [
        {
          parts: [
            { text: systemPrompt },
            { text: `Create a tweet about: ${prompt}` },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
        responseMimeType: 'application/json',
      },
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  const text = response.data.candidates[0].content.parts[0].text;
  const parsed = JSON.parse(text);

  return {
    content: parsed.content.slice(0, 280),
    hashtags: parsed.hashtags || [],
  };
};

export const generateLinkedInContent = async (prompt: string): Promise<GeneratedContent> => {
  const systemPrompt = `You are a professional content creator. Generate a LinkedIn post based on the user's idea. Make it professional, insightful, and engaging. Return JSON with "content" (the post) and "title" (an optional headline).`;

  const response = await axios.post(
    GEMINI_URL,
    {
      contents: [
        {
          parts: [
            { text: systemPrompt },
            { text: `Create a LinkedIn post about: ${prompt}` },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
        responseMimeType: 'application/json',
      },
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  const text = response.data.candidates[0].content.parts[0].text;
  const parsed = JSON.parse(text);

  return {
    content: parsed.content,
    hashtags: parsed.hashtags || [],
    title: parsed.title,
  };
};

export const generateContent = async (
  prompt: string,
  platform: 'TWITTER' | 'LINKEDIN'
): Promise<GeneratedContent> => {
  if (platform === 'TWITTER') {
    return generateTwitterContent(prompt);
  }
  return generateLinkedInContent(prompt);
};