# Content Forge AI

An AI-powered content automation engine that generates and posts content to Twitter and LinkedIn using Google Gemini AI.

## Features

- **User Authentication**: Secure JWT-based auth with HTTP-only cookies
- **Platform Integration**: Connect Twitter and LinkedIn via OAuth 2.0
- **AI Content Generation**: Generate posts using Google Gemini API
- **Real Posting**: Publish directly to Twitter and LinkedIn APIs
- **Scheduling**: Schedule posts for automatic publishing

## Prerequisites

- Node.js 18+
- PostgreSQL database
- Google Gemini API key
- Twitter Developer Account
- LinkedIn Developer Account

## Quick Start

### 1. Clone and Install

```bash
cd content-forge-ai

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend` directory (copy from `.env.example`):

```env
DATABASE_URL="postgresql://user:password@localhost:5432/contentforge?schema=public"
JWT_SECRET="your-secret-key"
GEMINI_API_KEY="your-gemini-api-key"
TWITTER_CLIENT_ID="your-twitter-client-id"
TWITTER_CLIENT_SECRET="your-twitter-client-secret"
TWITTER_REDIRECT_URI="http://localhost:3000/api/auth/twitter/callback"
LINKEDIN_CLIENT_ID="your-linkedin-client-id"
LINKEDIN_CLIENT_SECRET="your-linkedin-client-secret"
LINKEDIN_REDIRECT_URI="http://localhost:3000/api/auth/linkedin/callback"
FRONTEND_URL="http://localhost:5173"
PORT=3000
```

### 3. Set Up Database

```bash
cd backend
npx prisma generate
npx prisma db push
```

### 4. Run the Application

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

### 5. Open Browser

Go to `http://localhost:5173`

---

## How to Get API Credentials

### 1. Google Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and add to your `.env` as `GEMINI_API_KEY`

---

### 2. Twitter Developer Account

#### Step 1: Apply for Developer Account
1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Click "Apply" for a developer account
3. Select "Making a bot" as your use case
4. Fill in the required information
5. Wait for approval (usually几分钟)

#### Step 2: Create a Project and App
1. Once approved, create a new project
2. Name your project (e.g., "Content Forge AI")
3. Select "Production" environment
4. Create a new app within the project
5. Note your `App ID` from the dashboard

#### Step 3: Get OAuth 2.0 Credentials
1. Go to your App's "Keys and tokens" section
2. Under "OAuth 2.0", generate:
   - **Client ID** (Client ID)
   - **Client Secret** (Client Secret)
3. Set up OAuth 2.0 redirect URLs:
   - Go to "App settings" > "User authentication setup"
   - Enable "OAuth 2.0"
   - Set Type of App: "Web App"
   - Callback URL: `http://localhost:3000/api/auth/twitter/callback`
   - Website URL: `http://localhost:5173`
   - Save

#### Step 4: Configure Scopes
Add these scopes in your Twitter app settings:
- `tweet.read`
- `tweet.write`
- `users.read`
- `offline.access`

Add credentials to `.env`:
```
TWITTER_CLIENT_ID=your-client-id
TWITTER_CLIENT_SECRET=your-client-secret
TWITTER_REDIRECT_URI=http://localhost:3000/api/auth/twitter/callback
```

---

### 3. LinkedIn Developer Account

#### Step 1: Create Developer Account
1. Go to [LinkedIn Developer Portal](https://developer.linkedin.com/)
2. Sign in with your LinkedIn account
3. Create an app or use existing one

#### Step 2: Configure App Settings
1. Go to your app's "Auth" tab
2. Add redirect URLs:
   - `http://localhost:3000/api/auth/linkedin/callback`
3. Note your `Client ID` and `Client Secret`

#### Step 3: Request API Permissions
For posting functionality, you need these products:

1. **Sign In with LinkedIn** - Basic profile access
2. **Marketing Developer Platform** - For posting (requires approval)

To get posting permissions:
1. Go to "Products" in your developer dashboard
2. Apply for "Marketing Developer Platform"
3. Fill out the application explaining your use case
4. Wait for LinkedIn approval (can take几天)

#### Step 4: Add Scopes
When implementing OAuth, use these scopes:
- `openid`
- `profile`
- `w_member_social` (for posting)

Add credentials to `.env`:
```
LINKEDIN_CLIENT_ID=your-client-id
LINKEDIN_CLIENT_SECRET=your-client-secret
LINKEDIN_REDIRECT_URI=http://localhost:3000/api/auth/linkedin/callback
```

---

## Project Structure

```
content-forge-ai/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   ├── src/
│   │   ├── index.ts           # Express server entry
│   │   ├── routes/            # API route definitions
│   │   ├── controllers/       # Request handlers
│   │   ├── services/          # Business logic
│   │   ├── middleware/        # Auth middleware
│   │   └── utils/             # Utilities
│   ├── .env                   # Environment variables
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── pages/             # Login, Register, Dashboard
    │   ├── services/          # API service layer
    │   ├── types/             # TypeScript types
    │   └── App.tsx            # Main app component
    └── package.json
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout user |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/auth/twitter` | Start Twitter OAuth |
| GET | `/api/auth/twitter/callback` | Twitter OAuth callback |
| GET | `/api/auth/linkedin` | Start LinkedIn OAuth |
| GET | `/api/auth/linkedin/callback` | LinkedIn OAuth callback |
| GET | `/api/social/accounts` | List connected accounts |
| DELETE | `/api/social/accounts/:id` | Disconnect account |
| POST | `/api/content/generate` | Generate AI content |
| POST | `/api/content/post` | Post immediately |
| POST | `/api/content/schedule` | Schedule post |
| GET | `/api/content` | Get all content |
| PUT | `/api/content/:id` | Update content |
| DELETE | `/api/content/:id` | Delete content |

---

## Usage Flow

1. **Register/Login**: Create an account or sign in
2. **Connect Accounts**: Click "Connect Twitter" and "Connect LinkedIn"
3. **Generate Content**: Enter a content idea and select platform
4. **Edit**: Modify the AI-generated content if needed
5. **Post or Schedule**: Click "Post Now" or set a future time

---

## Troubleshooting

### Database Connection Error
- Ensure PostgreSQL is running
- Check your `DATABASE_URL` format

### OAuth Errors
- Verify callback URLs match exactly
- Ensure scopes are properly configured

### Gemini API Errors
- Check your API key is valid
- Verify API quotas in Google AI Studio

### Posting Errors
- Ensure your Twitter/LinkedIn apps have required permissions
- Check app approval status for LinkedIn marketing

---

## License

MIT