import axios from 'axios';
import type { User, SocialAccount, Content, GeneratedContent } from '../types';

const API_URL = 'http://localhost:3000/api';

let isRedirecting = false;

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !isRedirecting) {
      isRedirecting = true;
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  register: async (email: string, password: string, name?: string) => {
    const { data } = await api.post<{ user: User }>('/auth/register', { email, password, name });
    return data.user;
  },

  login: async (email: string, password: string) => {
    const { data } = await api.post<{ user: User }>('/auth/login', { email, password });
    return data.user;
  },

  logout: async () => {
    await api.post('/auth/logout');
  },

  me: async () => {
    const { data } = await api.get<{ user: User }>('/auth/me');
    return data.user;
  },
};

export const socialService = {
  getTwitterAuthUrl: () => {
    return `${API_URL}/auth/twitter`;
  },

  getLinkedInAuthUrl: () => {
    return `${API_URL}/auth/linkedin`;
  },

  getAccounts: async () => {
    const { data } = await api.get<{ accounts: SocialAccount[] }>('/social/accounts');
    return data.accounts;
  },

  deleteAccount: async (id: string) => {
    await api.delete(`/social/accounts/${id}`);
  },
};

export const contentService = {
  generate: async (prompt: string, platform: 'TWITTER' | 'LINKEDIN') => {
    const { data } = await api.post<{ content: Content; generated: GeneratedContent }>('/content/generate', {
      prompt,
      platform,
    });
    return data;
  },

  post: async (contentId: string, editedContent?: string) => {
    const { data } = await api.post<{ message: string; externalPostId: string }>('/content/post', {
      contentId,
      editedContent,
    });
    return data;
  },

  schedule: async (contentId: string, editedContent: string, scheduledAt: string) => {
    const { data } = await api.post<{ message: string; scheduledAt: string }>('/content/schedule', {
      contentId,
      editedContent,
      scheduledAt,
    });
    return data;
  },

  getAll: async () => {
    const { data } = await api.get<{ contents: Content[] }>('/content');
    return data.contents;
  },

  update: async (id: string, generatedContent: GeneratedContent) => {
    await api.put(`/content/${id}`, { generatedContent });
  },

  delete: async (id: string) => {
    await api.delete(`/content/${id}`);
  },
};