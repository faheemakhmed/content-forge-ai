import { Response, Request } from 'express';
import axios from 'axios';
import prisma from '../utils/db.js';
import { AuthRequest } from '../middleware/auth.js';

const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID!;
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET!;
const TWITTER_REDIRECT_URI = process.env.TWITTER_REDIRECT_URI!;

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID!;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET!;
const LINKEDIN_REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI!;

export const twitterAuth = (req: AuthRequest, res: Response): void => {
  const scopes = ['tweet.read', 'tweet.write', 'users.read', 'offline.access'];
  const authUrl = `https://twitter.com/i/oauth2/authorize?${new URLSearchParams({
    response_type: 'code',
    client_id: TWITTER_CLIENT_ID,
    redirect_uri: TWITTER_REDIRECT_URI,
    scope: scopes.join(' '),
    state: req.user?.id || '',
    code_challenge: 'challenge',
    code_challenge_method: 'plain',
  })}`;

  res.redirect(authUrl);
};

export const twitterCallback = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { code, state: userId } = req.query;

    if (!code || typeof code !== 'string') {
      res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=twitter_auth_failed`);
      return;
    }

    const tokenResponse = await axios.post(
      'https://api.twitter.com/2/oauth2/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: TWITTER_REDIRECT_URI,
        client_id: TWITTER_CLIENT_ID,
        client_secret: TWITTER_CLIENT_SECRET,
        code_verifier: 'challenge',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token, refresh_token } = tokenResponse.data;

    const userResponse = await axios.get('https://api.twitter.com/2/users/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const twitterUser = userResponse.data.data;

    await prisma.socialAccount.upsert({
      where: {
        id: undefined,
      },
      create: {
        userId: userId as string,
        platform: 'TWITTER',
        accessToken: access_token,
        refreshToken: refresh_token,
        profileId: twitterUser.id,
        profileName: twitterUser.username,
      },
      update: {
        accessToken: access_token,
        refreshToken: refresh_token,
        profileId: twitterUser.id,
        profileName: twitterUser.username,
      },
    });

    res.redirect(`${process.env.FRONTEND_URL}/dashboard?twitter=connected`);
  } catch (error) {
    console.error('Twitter callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=twitter_auth_failed`);
  }
};

export const linkedinAuth = (req: AuthRequest, res: Response): void => {
  const scopes = ['openid', 'profile', 'w_member_social'];
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?${new URLSearchParams({
    response_type: 'code',
    client_id: LINKEDIN_CLIENT_ID,
    redirect_uri: LINKEDIN_REDIRECT_URI,
    scope: scopes.join(' '),
    state: req.user?.id || '',
  })}`;

  res.redirect(authUrl);
};

export const linkedinCallback = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { code, state: userId } = req.query;

    if (!code || typeof code !== 'string') {
      res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=linkedin_auth_failed`);
      return;
    }

    const tokenResponse = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: LINKEDIN_REDIRECT_URI,
        client_id: LINKEDIN_CLIENT_ID,
        client_secret: LINKEDIN_CLIENT_SECRET,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token } = tokenResponse.data;

    const userResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const linkedinUser = userResponse.data;

    await prisma.socialAccount.upsert({
      where: {
        id: undefined,
      },
      create: {
        userId: userId as string,
        platform: 'LINKEDIN',
        accessToken: access_token,
        profileId: linkedinUser.sub,
        profileName: linkedinUser.name,
      },
      update: {
        accessToken: access_token,
        profileId: linkedinUser.sub,
        profileName: linkedinUser.name,
      },
    });

    res.redirect(`${process.env.FRONTEND_URL}/dashboard?linkedin=connected`);
  } catch (error) {
    console.error('LinkedIn callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=linkedin_auth_failed`);
  }
};

export const getAccounts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const accounts = await prisma.socialAccount.findMany({
      where: { userId: req.user!.id },
      select: {
        id: true,
        platform: true,
        profileName: true,
        createdAt: true,
      },
    });

    res.json({ accounts });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const account = await prisma.socialAccount.findFirst({
      where: { id, userId: req.user!.id },
    });

    if (!account) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }

    await prisma.socialAccount.delete({ where: { id } });

    res.json({ message: 'Account disconnected successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};