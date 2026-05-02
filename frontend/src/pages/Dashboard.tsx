import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { socialService, contentService } from '../services/api';
import { useAuth } from '../App';
import type { SocialAccount, Content, GeneratedContent } from '../types';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [prompt, setPrompt] = useState('');
  const [platform, setPlatform] = useState<'TWITTER' | 'LINKEDIN'>('TWITTER');
  const [loading, setLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [currentContentId, setCurrentContentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadAccounts();
    loadContents();

    const twitterStatus = searchParams.get('twitter');
    const linkedinStatus = searchParams.get('linkedin');
    const error = searchParams.get('error');

    if (twitterStatus === 'connected') setMessage('Twitter connected successfully!');
    if (linkedinStatus === 'connected') setMessage('LinkedIn connected successfully!');
    if (error) setMessage(`Error: ${error}`);
  }, [searchParams]);

  const loadAccounts = async () => {
    try {
      const data = await socialService.getAccounts();
      setAccounts(data);
    } catch (err) {
      console.error('Failed to load accounts:', err);
    }
  };

  const loadContents = async () => {
    try {
      const data = await contentService.getAll();
      setContents(data);
    } catch (err) {
      console.error('Failed to load contents:', err);
    }
  };

  const connectTwitter = () => {
    window.location.href = socialService.getTwitterAuthUrl();
  };

  const connectLinkedIn = () => {
    window.location.href = socialService.getLinkedInAuthUrl();
  };

  const disconnectAccount = async (id: string) => {
    try {
      await socialService.deleteAccount(id);
      loadAccounts();
      setMessage('Account disconnected');
    } catch (err) {
      setMessage('Failed to disconnect account');
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    const hasAccount = accounts.some((a) => a.platform === platform);
    if (!hasAccount) {
      setMessage(`Please connect your ${platform} account first`);
      return;
    }

    setLoading(true);
    try {
      const { content, generated } = await contentService.generate(prompt, platform);
      setGeneratedContent(generated);
      setCurrentContentId(content.id);
      setEditContent(generated.content);
      loadContents();
      setMessage('Content generated!');
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Failed to generate content');
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async () => {
    if (!currentContentId) return;

    setLoading(true);
    try {
      await contentService.post(currentContentId, editContent);
      setMessage('Posted successfully!');
      setGeneratedContent(null);
      setCurrentContentId(null);
      setEditContent('');
      loadContents();
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Failed to post');
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async () => {
    if (!currentContentId || !scheduleTime) return;

    setLoading(true);
    try {
      await contentService.schedule(currentContentId, editContent, scheduleTime);
      setMessage('Scheduled successfully!');
      setGeneratedContent(null);
      setCurrentContentId(null);
      setEditContent('');
      setScheduleTime('');
      loadContents();
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Failed to schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await contentService.delete(id);
      loadContents();
      setMessage('Content deleted');
    } catch (err) {
      setMessage('Failed to delete content');
    }
  };

  const clearMessage = () => setMessage('');

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Content Forge AI</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">{user?.email}</span>
              <button
                onClick={logout}
                className="text-sm text-red-600 hover:text-red-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {message && (
          <div className="mb-4 p-4 rounded bg-blue-50 text-blue-700 flex justify-between items-center">
            <span>{message}</span>
            <button onClick={clearMessage} className="text-blue-700 font-bold">&times;</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Connected Accounts</h2>
            <div className="space-y-3 mb-4">
              {accounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      account.platform === 'TWITTER' ? 'bg-black text-white' : 'bg-blue-600 text-white'
                    }`}>
                      {account.platform}
                    </span>
                    <span className="text-gray-700">{account.profileName || 'Connected'}</span>
                  </div>
                  <button
                    onClick={() => disconnectAccount(account.id)}
                    className="text-sm text-red-600 hover:text-red-500"
                  >
                    Disconnect
                  </button>
                </div>
              ))}
              {accounts.length === 0 && (
                <p className="text-gray-500 text-sm">No accounts connected</p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={connectTwitter}
                className="flex-1 px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition"
              >
                Connect Twitter
              </button>
              <button
                onClick={connectLinkedIn}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Connect LinkedIn
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Generate Content</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as 'TWITTER' | 'LINKEDIN')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="TWITTER">Twitter</option>
                  <option value="LINKEDIN">LinkedIn</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content Idea</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Enter your content idea..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  rows={3}
                />
              </div>
              <button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {loading ? 'Generating...' : 'Generate Content'}
              </button>
            </div>
          </div>

          {generatedContent && (
            <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
              <h2 className="text-lg font-semibold mb-4">Generated Content</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Edit Content</label>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    rows={4}
                  />
                  {platform === 'TWITTER' && (
                    <p className="text-sm text-gray-500 mt-1">{editContent.length}/280 characters</p>
                  )}
                </div>
                {generatedContent.hashtags && generatedContent.hashtags.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Hashtags:</p>
                    <p className="text-gray-600">{generatedContent.hashtags.join(' ')}</p>
                  </div>
                )}
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={handlePost}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition"
                  >
                    Post Now
                  </button>
                  <button
                    onClick={() => setGeneratedContent(null)}
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <div className="flex items-center gap-2">
                    <input
                      type="datetime-local"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded"
                    />
                    <button
                      onClick={handleSchedule}
                      disabled={loading || !scheduleTime}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition"
                    >
                      Schedule
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Content History</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Platform</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Prompt</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {contents.map((content) => (
                    <tr key={content.id}>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          content.platform === 'TWITTER' ? 'bg-black text-white' : 'bg-blue-600 text-white'
                        }`}>
                          {content.platform}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600 max-w-xs truncate">{content.prompt}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          content.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                          content.status === 'SCHEDULED' ? 'bg-yellow-100 text-yellow-800' :
                          content.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {content.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {content.publishedAt || content.scheduledAt || content.createdAt}
                      </td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => handleDelete(content.id)}
                          className="text-red-600 hover:text-red-500 text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {contents.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-4 text-center text-gray-500">No content yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}