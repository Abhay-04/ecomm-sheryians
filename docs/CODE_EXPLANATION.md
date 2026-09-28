# Code Explanation

A plain-language walkthrough of how this project works. Every section points to the file where the logic lives.

---

## 1. Registration flow

**Files:** `backend/src/routes/auth.routes.js`, `backend/src/validators/auth.validators.js`, `backend/src/controllers/auth.controller.js` → `register`

```
POST /api/auth/register
  → authRateLimiter       (blocks after too many failed attempts)
  → registerValidator     (express-validator rules)
  → validate              (stops with 400 if any rule failed)
  → register controller
```

The controller:
1. Reads only the validated fields using `matchedData(req)`.
2. Checks if the email already exists (`User.exists`). If so it throws `ApiError(409, ...)`.
3. Hashes the password with bcrypt.
4. Saves the user and responds `201` with `{ id, name, email }`.

No tokens are created at registration. The user signs in separately.

## 2. Password hashing

**Files:** `auth.controller.js`, `backend/src/config/constants.js`

```js
const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS); // 12 rounds
```

- bcrypt adds a random **salt** to each password, so two users with the same password get different hashes.
- **Salt rounds = 12** means the hash is computed 2¹² times. This makes brute-forcing slow (the assignment requires at least 10).
- The hash is one-way: we can never recover the password, only check a guess using `bcrypt.compare`.

The `password` field in `models/User.js` has `select: false`, so queries never return it unless we explicitly ask with `.select('+password')` (only the login controller does). The `toJSON` transform also deletes it as a second safety net.

## 3. Login flow

**File:** `auth.controller.js` → `login`

1. Validate `email` and `password` (`loginValidator`).
2. Find the user by email, including the password hash.
3. `bcrypt.compare(password, hash)`.
4. If the user doesn't exist **or** the password is wrong, respond `401 "Invalid email or password"`. The message is the same in both cases, so an attacker can't find out which emails are registered.
   - If the email doesn't exist, we still run `bcrypt.compare` against a dummy hash. This makes both cases take the same time, so response timing doesn't reveal it either.
5. On success, create an **access token** (returned in JSON) and a **refresh token** (saved in the database and set as a cookie).

## 4. Access token

**File:** `backend/src/utils/tokens.js` → `generateAccessToken`

```js
jwt.sign({ sub: userId }, ACCESS_TOKEN_SECRET, { expiresIn: '15m' })
```

- A JWT containing the user's ID (`sub` = "subject") and an expiry time, signed with a secret only the server knows.
- It's sent with every protected request: `Authorization: Bearer <token>`.
- It's **short-lived (15 minutes)**, so a stolen token is only useful briefly.
- The server doesn't store access tokens; it only verifies the signature and expiry.

## 5. Refresh token

**File:** `tokens.js` → `generateRefreshToken`

```js
jwt.sign({ sub: userId }, REFRESH_TOKEN_SECRET, { expiresIn: '7d', jwtid: crypto.randomUUID() })
```

- Its only job is to get a **new access token** when the old one expires, so the user doesn't log in every 15 minutes.
- It lasts **7 days** and uses a **different secret**, so it can't be used as an access token (and vice versa).
- `jwtid` adds a random ID so every refresh token is unique.

## 6. httpOnly cookie

**File:** `tokens.js` → `setRefreshTokenCookie`

```js
res.cookie('refreshToken', token, {
  httpOnly: true,                                  // JavaScript can't read it
  secure: isProduction,                            // HTTPS only in production
  sameSite: isProduction ? 'none' : 'lax',
  path: '/api/auth',                               // only sent to auth routes
  maxAge: 7 days,
});
```

- **httpOnly** means `document.cookie` can't see the token. Even if an attacker injects JavaScript into the page (XSS), they can't steal the refresh token. That's why it isn't stored in `localStorage`.
- The browser attaches the cookie automatically to requests to `/api/auth/*`.
- **SameSite:** in development the frontend (`localhost:5173`) and API (`localhost:4000`) count as the same site, so `lax` works. In production they're usually on different domains, which requires `SameSite=None`, and browsers only allow that together with `Secure` (HTTPS).

## 7. Refresh token persistence

**File:** `backend/src/models/RefreshToken.js`

Each login creates one document:

```js
{ user: ObjectId, tokenHash: 'sha256...', expiresAt: Date }
```

- We store a **SHA-256 hash**, not the token itself. If the database leaked, the hashes couldn't be used as cookies.
- We use SHA-256 rather than bcrypt because we need to **look the token up** by its hash. SHA-256 always gives the same output for the same input; bcrypt doesn't. The token is already a long random value, so the slowness of bcrypt isn't needed.
- A **TTL index** on `expiresAt` makes MongoDB delete expired tokens automatically.
- One document per login means each device has its own session, and logging out on one device doesn't affect the others.

Why store it at all? A JWT is valid until it expires. Without a server-side record, there would be no way to **revoke** it on logout.

## 8. Logout / revocation

**File:** `auth.controller.js` → `logout`

1. The route requires a valid access token (`authenticate`).
2. The refresh token from the cookie is hashed and its database document deleted.
3. The cookie is cleared (`clearRefreshTokenCookie`, using the same options it was set with, which browsers require).

After this, `POST /refresh-token` with the old cookie fails with `401 "Refresh token has been revoked"`, because the lookup in the database finds nothing.

### Refresh token rotation (`refreshAccessToken`)

Every time a refresh token is used, it is **deleted and replaced** with a new one:

```js
const storedToken = await RefreshToken.findOneAndDelete({ tokenHash, user: payload.sub });
if (!storedToken) throw new ApiError(401, 'Refresh token has been revoked');
// ...issue a new access token and a new refresh token
```

- Each refresh token works exactly **once**. A stolen, already-used token is rejected.
- `findOneAndDelete` is a single atomic database operation, so two requests with the same token can't both succeed.

The refresh endpoint rejects a token when:
- the cookie is missing → 401
- the JWT signature is wrong or it's expired → 401
- it's not in the database (already used, logged out, or never issued) → 401
- the user no longer exists → 401

## 9. `authenticate` middleware

**File:** `backend/src/middleware/authenticate.js`

1. Read the `Authorization` header and check it looks like `Bearer <token>`. If not, respond `401 "Access token is missing"`.
2. `jwt.verify(token, ACCESS_TOKEN_SECRET)` checks the signature and expiry.
   - Expired → `401 "Access token has expired"`
   - Anything else wrong → `401 "Access token is invalid"`
3. Load the user from the database (so a deleted account can't keep using an old token).
4. Put the user on `req.user` and call `next()`.

It's added per route: `router.post('/', authenticate, ...)`.

## 10. `req.user`

After `authenticate` runs, `req.user` is the Mongoose user document (without the password, because of `select: false`). Controllers use it to know **who** is making the request:
- `getCurrentUser` returns `{ id, name, email }` from it.
- `logout` uses `req.user._id` so a user can only delete their own refresh token.

## 11. express-validator

**Files:** `backend/src/validators/*.js`, `backend/src/middleware/validate.js`

Validators are arrays of rules that run as middleware **before** the controller:

```js
router.post('/', authenticate, productBodyValidator, validate, createProduct);
```

- Each rule checks one field, e.g. `body('price').isFloat({ gt: 0 }).withMessage('Price must be a positive number')`.
- `.bail()` stops checking a field after its first failure, so each field shows one clear message.
- Sanitizers like `.trim()`, `.toFloat()`, `.toInt()` clean the values.
- The `validate` middleware collects the results. If anything failed, it responds `400` with `{ message: 'Validation failed', errors: [{ field, message }] }` and the controller never runs.
- Controllers read data with `matchedData(req)`, which returns **only validated fields**. Extra fields a client might send (like `_id` or `createdAt`) are ignored.

What's validated:
- Register: name, email, password strength, password confirmation
- Login: email and password present
- Products: all body fields, the `:id` param (`isMongoId()`), and the `search`/`category` query

Checking `:id` with `isMongoId()` before querying means a bad ID like `/products/abc` returns a clear `400 "Invalid product ID"`, not a database error.

## 12. Product CRUD

**Files:** `backend/src/models/Product.js`, `backend/src/controllers/product.controller.js`, `backend/src/routes/product.routes.js`

| Action | Controller | Notes |
|---|---|---|
| List | `getProducts` | Optional `search` (case-insensitive match on name/description) and `category`. Sorted newest first |
| Read one | `getProductById` | 404 if not found |
| Create | `createProduct` | 201 with the new product |
| Update | `updateProduct` | `PUT` replaces all fields. Uses `product.set()` + `save()` so Mongoose schema validation runs |
| Delete | `deleteProduct` | 404 if not found |

- `findProductOrFail(id)` is a small helper so the 404 check isn't repeated three times.
- The search text is escaped (`escapeRegex`) before being put in a regular expression, so characters like `(` are matched literally.

### Error handling

**File:** `backend/src/middleware/errorHandler.js`

Controllers just `throw new ApiError(status, message)`. Express 5 automatically passes errors from `async` functions to the error handler, so no `try/catch` or wrapper is needed. The handler turns every error into JSON:
- `ApiError` → its own status and message
- Mongoose `CastError` → 400, `ValidationError` → 400 with field errors
- MongoDB duplicate key (`code 11000`) → 409
- Malformed JSON body → 400
- Anything else → 500 with a generic message. The error is logged on the server, and the stack trace is only included outside production.

## 13. Protected routes

**Backend:** `authenticate` on `POST`, `PUT` and `DELETE` product routes, `/auth/logout` and `/auth/me`. Product `GET` routes are public, as required.

**Frontend:** `frontend/src/components/ProtectedRoute.jsx`

```jsx
if (isRestoringSession) return <FullPageLoader />;
if (!user) return <Navigate to="/login" state={{ from: location.pathname }} />;
return <Outlet />;
```

All app pages are nested inside it in `App.jsx`. The `from` path lets the login page send the user back to where they were. `PublicOnlyRoute.jsx` does the reverse: signed-in users visiting `/login` or `/register` are sent to `/products`.

## 14. React auth state

**File:** `frontend/src/context/AuthContext.jsx`

`AuthProvider` holds:
- `user`: the signed-in user, or `null`
- `isRestoringSession`: `true` while checking for an existing session on first load
- `login()`, `register()`, `logout()`

Any component reads it with `useAuth()`.

On app start it calls `refreshSession()`. If the browser has a valid refresh cookie, this returns a new access token and the user, so a **page reload keeps you signed in** even though the access token only lived in memory.

`logout()` calls the API, shows a toast, then clears the token and user. Once `user` is `null`, `ProtectedRoute` redirects to `/login` automatically.

## 15. API requests

**File:** `frontend/src/services/api.js`

A single Axios instance:

```js
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL, withCredentials: true });
```

- `baseURL` comes from `VITE_API_URL`, so no URL is hardcoded.
- `withCredentials: true` tells the browser to send and accept cookies on cross-origin requests. Without it the refresh cookie would be ignored.
- A **request interceptor** adds `Authorization: Bearer <accessToken>` when we have one.
- The access token is a plain module variable (`let accessToken`), not `localStorage`, so injected scripts can't read it from storage.
- `authApi` and `productApi` group the endpoint calls. `getErrorMessage` and `getFieldErrors` turn API errors into text the forms can show.

## 16. Access token expiry

After 15 minutes the server starts answering protected requests with `401 "Access token has expired"`. The user doesn't notice, because the response interceptor handles it (next section).

## 17. Refresh flow

**File:** `api.js` → response interceptor + `refreshSession`

```
request fails with 401
  → is it a normal API call (not login/register/refresh) and not already retried?
      → POST /auth/refresh-token   (cookie sent automatically)
      → store the new access token
      → retry the original request once
  → refresh failed?
      → clear the token, call the session-expired handler
        (AuthContext sets user = null and shows a toast → redirect to /login)
```

**Only one refresh at a time.** If three requests fail together, they all wait for the same refresh request (`refreshRequest` promise). This matters because of rotation: the first refresh consumes the refresh token, so a second refresh sent with the same cookie would be rejected and log the user out.

The `hasRetried` flag stops an infinite loop if the retried request also fails.

## 18. CORS

**File:** `backend/src/app.js`

```js
app.use(cors({ origin: env.clientUrl, credentials: true }));
```

- The browser blocks a page on one origin (`localhost:5173`) from reading responses from another (`localhost:4000`) unless the server allows it.
- `origin: CLIENT_URL` allows only our frontend. Other websites can't call the API from a user's browser and read the results.
- `credentials: true` sends `Access-Control-Allow-Credentials: true`, which is required for cookies. It only works with a specific origin, never `*`.
- It works together with `withCredentials: true` on the frontend.

## 19. MongoDB / Mongoose

**Files:** `backend/src/config/db.js`, `backend/src/models/*.js`

- **MongoDB** stores data as JSON-like documents in collections (`users`, `products`, `refreshtokens`).
- **Mongoose** adds schemas: field types, `required`, `min`, `maxlength`, `enum` (allowed categories), `trim`, `lowercase`.
- `{ timestamps: true }` adds `createdAt` and `updatedAt` automatically.
- `unique: true` on `User.email` creates a unique index. Even if two registrations race past the `exists` check, the database rejects the duplicate (the error handler turns it into a 409).
- `toJSON` transforms rename `_id` to `id` and remove `__v` (and `password` for users) whenever a document is sent as JSON.
- `connectDatabase()` in `config/db.js` connects **once** and reuses the connection. Locally, `server.js` calls it before starting the server, so a bad `MONGO_URI` stops the app immediately with a clear error.
- On Vercel there is no long-running server: the Express app runs as a serverless function. A small middleware in `app.js` calls `connectDatabase()` before the routes, so the first request opens the connection and later requests on the same instance reuse it.
- `config/env.js` checks at startup that all required environment variables exist and that the two JWT secrets differ, so misconfiguration fails fast with a clear message.
