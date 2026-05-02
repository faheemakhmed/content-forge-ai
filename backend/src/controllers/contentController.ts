import { Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../utils/db.js';
import { AuthRequest } from '../middleware/auth.js';
import { generateContent } from '../services/geminiService.js';
import { postTweet } from '../services/twitterService.js';
import { postToLinkedIn, getLinkedInProfile } from '../services/linkedinService.js';

export const generateContentHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { prompt, platform } = req.body;

    if (!prompt || !platform) {
      res.status(400).json({ error: 'Prompt and platform are required' });
      return;
    }

    if (!['TWITTER', 'LINKEDIN'].includes(platform)) {
      res.status(400).json({ error: 'Invalid platform' });
      return;
    }

    const generated = await generateContent(prompt, platform);

    const content = await prisma.content.create({
      data: {
        userId: req.user!.id,
        platform,
        prompt,
        generatedContent: generated as unknown as Prisma.InputJsonValue,
        status: 'DRAFT',
      },
    });

    res.json({ content, generated });
  } catch (error) {
    console.error('Generate content error:', error);
    res.status(500).json({ error: 'Failed to generate content' });
  }
};

export const postContent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { contentId, editedContent } = req.body;

    const content = await prisma.content.findFirst({
      where: { id: contentId, userId: req.user!.id },
      include: { user: true },
    });

    if (!content) {
      res.status(404).json({ error: 'Content not found' });
      return;
    }

    const socialAccount = await prisma.socialAccount.findFirst({
      where: { userId: req.user!.id, platform: content.platform },
    });

    if (!socialAccount) {
      res.status(400).json({ error: `${content.platform} account not connected` });
      return;
    }

    const finalContent = editedContent || (content.generatedContent as any)?.content;

    let externalPostId: string;

    if (content.platform === 'TWITTER') {
      const result = await postTweet(socialAccount.accessToken, finalContent);
      externalPostId = result.id;
    } else {
      const profile = await getLinkedInProfile(socialAccount.accessToken);
      const result = await postToLinkedIn(socialAccount.accessToken, profile.urn, finalContent);
      externalPostId = result.id;
    }

    await prisma.content.update({
      where: { id: contentId },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        externalPostId,
      },
    });

    res.json({ message: 'Posted successfully', externalPostId });
  } catch (error) {
    console.error('Post content error:', error);

    const { contentId } = req.body;
    if (contentId) {
      await prisma.content.update({
        where: { id: contentId },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }

    res.status(500).json({ error: 'Failed to post content' });
  }
};

export const scheduleContent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { contentId, editedContent, scheduledAt } = req.body;

    if (!contentId || !scheduledAt) {
      res.status(400).json({ error: 'Content ID and schedule time are required' });
      return;
    }

    const content = await prisma.content.findFirst({
      where: { id: contentId, userId: req.user!.id },
    });

    if (!content) {
      res.status(404).json({ error: 'Content not found' });
      return;
    }

    const socialAccount = await prisma.socialAccount.findFirst({
      where: { userId: req.user!.id, platform: content.platform },
    });

    if (!socialAccount) {
      res.status(400).json({ error: `${content.platform} account not connected` });
      return;
    }

    const finalContent = editedContent || (content.generatedContent as any)?.content;

    await prisma.content.update({
      where: { id: contentId },
      data: {
        generatedContent: { ...(content.generatedContent as any), content: finalContent } as unknown as Prisma.InputJsonValue,
        status: 'SCHEDULED',
        scheduledAt: new Date(scheduledAt),
      },
    });

    res.json({ message: 'Scheduled successfully', scheduledAt });
  } catch (error) {
    console.error('Schedule content error:', error);
    res.status(500).json({ error: 'Failed to schedule content' });
  }
};

export const getContent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const contents = await prisma.content.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ contents });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({ error: 'Failed to get content' });
  }
};

export const updateContent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { generatedContent } = req.body;

    const content = await prisma.content.findFirst({
      where: { id, userId: req.user!.id },
    });

    if (!content) {
      res.status(404).json({ error: 'Content not found' });
      return;
    }

    await prisma.content.update({
      where: { id },
      data: { generatedContent: generatedContent as unknown as Prisma.InputJsonValue },
    });

    res.json({ message: 'Content updated successfully' });
  } catch (error) {
    console.error('Update content error:', error);
    res.status(500).json({ error: 'Failed to update content' });
  }
};

export const deleteContent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const content = await prisma.content.findFirst({
      where: { id, userId: req.user!.id },
    });

    if (!content) {
      res.status(404).json({ error: 'Content not found' });
      return;
    }

    await prisma.content.delete({ where: { id } });

    res.json({ message: 'Content deleted successfully' });
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({ error: 'Failed to delete content' });
  }
};