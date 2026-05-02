export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface SocialAccount {
  id: string;
  platform: 'TWITTER' | 'LINKEDIN';
  profileName?: string;
  createdAt: string;
}

export interface GeneratedContent {
  content: string;
  hashtags?: string[];
  title?: string;
}

export interface Content {
  id: string;
  userId: string;
  platform: 'TWITTER' | 'LINKEDIN';
  prompt: string;
  generatedContent: GeneratedContent | null;
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED';
  scheduledAt?: string;
  publishedAt?: string;
  externalPostId?: string;
  errorMessage?: string;
  createdAt: string;
}