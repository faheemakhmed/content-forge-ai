import axios from 'axios';

export interface TweetResult {
  id: string;
  text: string;
}

export const postTweet = async (accessToken: string, content: string): Promise<TweetResult> => {
  const response = await axios.post(
    'https://api.twitter.com/2/tweets',
    { text: content },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data.data;
};

export const refreshTwitterToken = async (
  refreshToken: string
): Promise<{ access_token: string; refresh_token: string }> => {
  const response = await axios.post(
    'https://api.twitter.com/2/oauth2/token',
    new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: process.env.TWITTER_CLIENT_ID!,
      client_secret: process.env.TWITTER_CLIENT_SECRET!,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  return response.data;
};