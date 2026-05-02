import cron from 'node-cron';
import prisma from '../utils/db.js';
import { postTweet } from './twitterService.js';
import { postToLinkedIn, getLinkedInProfile } from './linkedinService.js';

export const startScheduler = (): void => {
  console.log('Scheduler started - checking every 60 seconds for scheduled posts');

  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();

      const scheduledContents = await prisma.content.findMany({
        where: {
          status: 'SCHEDULED',
          scheduledAt: { lte: now },
        },
        include: {
          user: true,
        },
      });

      console.log(`Found ${scheduledContents.length} scheduled posts to publish`);

      for (const content of scheduledContents) {
        try {
          const socialAccount = await prisma.socialAccount.findFirst({
            where: { userId: content.userId, platform: content.platform },
          });

          if (!socialAccount) {
            await prisma.content.update({
              where: { id: content.id },
              data: {
                status: 'FAILED',
                errorMessage: 'Social account not found',
              },
            });
            continue;
          }

          const generatedData = content.generatedContent as any;
          const finalContent = generatedData?.content;

          if (!finalContent) {
            await prisma.content.update({
              where: { id: content.id },
              data: {
                status: 'FAILED',
                errorMessage: 'No content to post',
              },
            });
            continue;
          }

          let externalPostId: string;

          if (content.platform === 'TWITTER') {
            const result = await postTweet(socialAccount.accessToken, finalContent);
            externalPostId = result.id;
          } else {
            const profile = await getLinkedInProfile(socialAccount.accessToken);
            const result = await postToLinkedIn(
              socialAccount.accessToken,
              profile.urn,
              finalContent
            );
            externalPostId = result.id;
          }

          await prisma.content.update({
            where: { id: content.id },
            data: {
              status: 'PUBLISHED',
              publishedAt: new Date(),
              externalPostId,
            },
          });

          console.log(`Published scheduled post ${content.id}`);
        } catch (error) {
          console.error(`Failed to publish scheduled post ${content.id}:`, error);

          await prisma.content.update({
            where: { id: content.id },
            data: {
              status: 'FAILED',
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
            },
          });
        }
      }
    } catch (error) {
      console.error('Scheduler error:', error);
    }
  });
};