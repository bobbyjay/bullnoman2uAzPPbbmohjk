# sports-betting-api

Node.js + Express sports betting API scaffold with MongoDB (Mongoose) and Cloudinary for media storage.

## Features
- JWT authentication
- Role-based admin authorization
- Cloudinary for image storage (public_id stored only)
- Server-side streaming of images to clients (no direct cloudinary urls returned)
- Input validation, rate-limiting, helmet, mongo-sanitization
- Modular controllers, services, models
- Useful endpoints for events, bets, support tickets, notifications, winners, accounts, admin

## Setup
1. Copy `.env.example` to `.env` and fill environment variables.
2. `npm install`
3. `npm run dev`

## Security notes
- Keep `.env` and Cloudinary API secret confidential.
- The server stores only Cloudinary `public_id` in DB. Clients receive only the `public_id` and request image binary via the API. This prevents exposure of credentials or direct cloud URLs.
- Harden further for production (2FA, WAF, monitoring, secret rotation).

## Endpoints (high-level)
See routes files. Key endpoints include:
- `POST /auth/register`, `POST /auth/login`
- `GET /events/:id`
- `POST /bets`, `GET /bets`, `GET /bets/me`
- `POST /upload/profile-image`, `GET /upload/profile-image?id=<public_id>`
- `GET /account/balance`, `POST /account/deposit`, `POST /account/withdraw`
- Support: `POST /support/tickets`, `GET /support/tickets`, `POST /support/ticket/:id/messages`
- Admin: many under `/admin` (protected)

## Next steps
- Add unit/integration tests
- Add real payment integration
- Replace emailService stub
- Add RBAC and audit logs

