import axios from 'axios';

export interface LinkedInPostResult {
  id: string;
}

export const postToLinkedIn = async (
  accessToken: string,
  authorUrn: string,
  content: string
): Promise<LinkedInPostResult> => {
  const response = await axios.post(
    'https://api.linkedin.com/v2/ugcPosts',
    {
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content,
          },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
    }
  );

  const id = response.headers['x-linkedin-id'] || response.data.id;
  return { id: id.toString() };
};

export const getLinkedInProfile = async (accessToken: string): Promise<{ urn: string }> => {
  const response = await axios.get('https://api.linkedin.com/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return { urn: `urn:li:person:${response.data.sub}` };
};