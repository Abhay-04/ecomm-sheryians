# Store — E-Commerce Admin

A full-stack product catalog admin: users register, sign in, and manage products (create, list, edit, delete) through a secure JWT authentication system with access and refresh tokens.

## Overview

- **Backend:** a REST API built with Express and MongoDB. Passwords are hashed with bcrypt. Authentication uses a short-lived **access token** (sent in the `Authorization` header) and a long-lived **refresh token** (stored in an `httpOnly` cookie and tracked in the database so it can be revoked).
- **Frontend:** a React single-page app built with Vite, Tailwind CSS and shadcn/ui. It keeps the access token in memory only, refreshes it automatically when it expires, and retries the failed request.

## Features

**Authentication**
- Register with name, email, password and confirmation (validated on the server)
- Login returns an access token (15 min) and sets a refresh token cookie (7 days)
- Silent token refresh with **refresh token rotation**: each refresh token works once
- Logout revokes the refresh token on the server and clears the cookie
- Session is restored after a page reload using the refresh cookie
- Rate limiting on login/register (20 failed attempts per 15 minutes per IP)

**Products**
- Public list and detail endpoints; create, update and delete require authentication
- Search by name/description and filter by category
- Stock status badges: *In stock*, *Low stock* (≤ 5), *Out of stock*
- Delete confirmation dialog
- Field-level validation messages from the server shown under each input

**UI**
- Responsive layout (1 / 2 / 3–4 column grid, compact mobile menu)
- Skeleton loading states, empty states, error states with retry, and toasts

## Tech Stack

| Layer | Technologies |
|---|---|
| Backend | Node.js, Express 5, MongoDB, Mongoose, jsonwebtoken, bcrypt, express-validator, cookie-parser, cors, dotenv, express-rate-limit |
| Frontend | React 19, Vite, React Router, Tailwind CSS v4, shadcn/ui (Radix), Lucide icons, Axios, Sonner |
| Hosting | Vercel (frontend + backend), MongoDB Atlas |

## Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── config/        # env loading + validation, DB connection, constants
│   │   ├── controllers/   # auth + product request handlers
│   │   ├── middleware/    # authenticate, validate, errorHandler, rateLimiter
│   │   ├── models/        # User, Product, RefreshToken (Mongoose)
│   │   ├── routes/        # /api/auth, /api/products
│   │   ├── utils/         # ApiError, token helpers
│   │   ├── validators/    # express-validator rule lists
│   │   ├── app.js         # Express app (middleware + routes)
│   │   ├── server.js      # connects to MongoDB, starts the server
│   │   └── seed.js        # optional sample products
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/    # Navbar, ProductCard, ProductForm, route guards, states
│   │   │   └── ui/        # shadcn/ui components
│   │   ├── context/       # AuthContext (user state, login/logout)
│   │   ├── lib/           # utils (cn, formatPrice), constants, form helpers
│   │   ├── pages/         # Login, Register, Products, AddProduct, EditProduct, Profile
│   │   ├── services/      # api.js (Axios instance, token refresh, API calls)
│   │   ├── App.jsx        # routes
│   │   └── index.css      # Tailwind + design tokens
│   ├── vercel.json        # /api proxy to the backend + SPA fallback
│   └── .env.example
├── DEPLOY.md              # step-by-step Vercel deployment
└── docs/
    └── CODE_EXPLANATION.md
```

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | no | `development` (default) or `production` |
| `PORT` | no | API port, default `4000` |
| `MONGO_URI` | yes | MongoDB connection string |
| `CLIENT_URL` | yes | Frontend origin allowed by CORS, e.g. `http://localhost:5173` (no trailing slash) |
| `ACCESS_TOKEN_SECRET` | yes | Secret for signing access tokens |
| `REFRESH_TOKEN_SECRET` | yes | Secret for signing refresh tokens (must differ from the access secret) |
| `ACCESS_TOKEN_EXPIRES_IN` | no | Access token lifetime, default `15m` |

Generate each secret with:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | yes | API base URL including `/api`, e.g. `http://localhost:4000/api` |

`.env` files are git-ignored. Only the `.env.example` templates are committed.

## Installation

Requirements: Node.js 20+ and a MongoDB database (local, or a free MongoDB Atlas cluster).

```bash
git clone https://github.com/Abhay-04/ecomm-sheryians
cd ecomm-sheryians

cd backend
npm install
cp .env.example .env     # then fill in MONGO_URI and the two secrets

cd ../frontend
npm install
cp .env.example .env
```

## Running Locally

In two terminals:

```bash
# Terminal 1: API on http://localhost:4000
cd backend
npm run dev

# Terminal 2: app on http://localhost:5173
cd frontend
npm run dev
```

Optional: add 10 sample products with real photos (only runs if the catalog is empty):

```bash
cd backend && npm run seed
```

> **macOS note:** port 5000 is used by AirPlay Receiver, which is why the API defaults to port 4000.

## API Documentation

Base URL: `http://localhost:4000/api`

All responses are JSON. Errors always have a `message`; validation errors also include an `errors` array:

```json
{
  "message": "Validation failed",
  "errors": [{ "field": "price", "message": "Price must be a positive number" }]
}
```

### Auth

| Method | Endpoint | Auth | Body | Success |
|---|---|---|---|---|
| POST | `/auth/register` | — | `name, email, password, confirmPassword` | `201 { message, user }` |
| POST | `/auth/login` | — | `email, password` | `200 { message, accessToken, user }` + sets `refreshToken` cookie |
| POST | `/auth/refresh-token` | refresh cookie | — | `200 { accessToken, user }` + sets a new cookie |
| POST | `/auth/logout` | Bearer token | — | `200 { message }` + clears cookie |
| GET | `/auth/me` | Bearer token | — | `200 { user: { id, name, email } }` |

Password rules: 8–72 characters with at least one uppercase letter, one lowercase letter, one number and one symbol.

### Products

| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| GET | `/products` | — | Optional query: `search` (text), `category`. Returns `{ products }`, newest first |
| GET | `/products/:id` | — | Returns `{ product }` |
| POST | `/products` | Bearer token | Returns `201 { message, product }` |
| PUT | `/products/:id` | Bearer token | Full update (all fields required). Returns `{ message, product }` |
| DELETE | `/products/:id` | Bearer token | Returns `{ message, product }` |

Product body:

```json
{
  "name": "Wireless Headphones",
  "description": "Noise-cancelling over-ear headphones.",
  "price": 2999,
  "stock": 25,
  "category": "Electronics",
  "image": "https://example.com/headphones.jpg"
}
```

`category` must be one of: Electronics, Clothing, Home & Kitchen, Beauty, Books, Sports, Accessories, Other. `image` is optional (http/https URL).

### Status codes

| Code | When |
|---|---|
| 400 | Validation failed, invalid product ID, malformed JSON |
| 401 | Missing/invalid/expired access token, bad login, invalid/revoked refresh token |
| 404 | Product or route not found |
| 409 | Email already registered |
| 429 | Too many failed login/register attempts |
| 500 | Unexpected server error (stack trace only shown outside production) |

## Authentication Flow

```
Register ──► Login ──► { accessToken } in JSON  +  refreshToken in httpOnly cookie
                          │
                          ▼
         Access token kept in memory (a JS variable, not localStorage)
                          │
     API request ──► Authorization: Bearer <accessToken>
                          │
               Access token expires (15 min)
                          │
     API returns 401 ──► POST /auth/refresh-token (browser sends the cookie)
                          │
         ┌────────────────┴────────────────┐
     Success                           Failure
  new access token + new cookie     user is signed out
  original request is retried       and sent to /login
```

On logout, the server deletes the stored refresh token, so the old cookie can never be used again.

See [docs/CODE_EXPLANATION.md](docs/CODE_EXPLANATION.md) for a step-by-step walkthrough of the code.

## Deployment

Both the frontend and backend are deployed on **Vercel** as two projects from this one repository, with the database on **MongoDB Atlas**. The frontend proxies `/api` to the backend, so the refresh cookie is first-party and works in every browser.

Full step-by-step instructions: **[DEPLOY.md](DEPLOY.md)**

## GitHub Repository

https://github.com/Abhay-04/ecomm-sheryians

## Live Project

https://ecomm-sheryians-frontend.vercel.app/
