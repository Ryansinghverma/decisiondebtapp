# Decision Debt Tracker — Backend API

Built with Node.js, Express, and MongoDB.

## Endpoints

### Auth
| Method | URL | What it does |
|--------|-----|--------------|
| POST | /api/auth/register | Create a new account |
| POST | /api/auth/login | Log in |
| GET | /api/auth/me | Get current user info |

### Decisions
| Method | URL | What it does |
|--------|-----|--------------|
| GET | /api/decisions | Get all your decisions |
| POST | /api/decisions | Log a new decision |
| GET | /api/decisions/stats | Get dashboard stats |
| POST | /api/decisions/predict | Predict mood from activities |
| PATCH | /api/decisions/:id/review | Rate a past decision (regret score) |
| DELETE | /api/decisions/:id | Delete a decision |

### Streaks
| Method | URL | What it does |
|--------|-----|--------------|
| GET | /api/streaks | Get all your habits |
| POST | /api/streaks | Create a new habit |
| POST | /api/streaks/:id/log | Mark habit done today |
| DELETE | /api/streaks/:id | Delete a habit |

## Setup — Local

1. Install dependencies:
   ```
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in your MongoDB URI and JWT secret.

3. Run in development mode:
   ```
   npm run dev
   ```

## Deploy to Render.com

1. Push this folder to a GitHub repo
2. Go to render.com → New → Web Service
3. Connect your GitHub repo
4. Set these settings:
   - Build command: `npm install`
   - Start command: `node server.js`
5. Add environment variables (MONGODB_URI, JWT_SECRET, PORT)
6. Click Deploy!
