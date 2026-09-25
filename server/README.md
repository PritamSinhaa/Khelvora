# Khelvora API

Express 5 API with MongoDB, Socket.IO, and optional Cloudinary uploads.

## Deploy

Deploy the `server` directory as the service root. Use Node.js 24, install dependencies with `npm ci`, and start the service with `npm start`. The service listens on `0.0.0.0` and uses the hosting provider's `PORT` value.

Set these environment variables in the hosting provider's dashboard:

| Variable | Required | Value |
| --- | --- | --- |
| `NODE_ENV` | Yes | `production` |
| `PORT` | Usually provided by host | Leave host-provided value; defaults to `5000` locally |
| `CLIENT_ORIGIN` | Yes | Exact public origin of the frontend, including scheme and port if applicable |
| `MONGODB_URI` | Yes | MongoDB Atlas or another replica-set connection URI |
| `JWT_SECRET` | Yes | A unique random secret with at least 32 characters |
| `CLOUDINARY_CLOUD_NAME` | No | Cloudinary cloud name; configure all three Cloudinary values to enable uploads |
| `CLOUDINARY_API_KEY` | No | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | No | Cloudinary API secret |

Copy `.env.example` to `.env` for local setup. Never commit `.env` or put production secrets in source control. Generate a JWT secret with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.

Configure the platform health check to use `GET /api/v1/ready`. It returns `200` when MongoDB is connected and `503` otherwise. `GET /api/v1/health` is a basic process check. The database must support transactions (Atlas or a MongoDB replica set); a standalone MongoDB server will fail startup.

For Socket.IO in production, configure the hosting provider to allow WebSocket connections and set `CLIENT_ORIGIN` to the frontend origin. If deploying behind multiple trusted proxies, review the `trust proxy` setting in `src/app.js` for your provider's topology.

## Local development

```sh
npm ci
cp .env.example .env
npm run dev
```

Optional seed commands: `npm run seed:sports` and `npm run seed:demo`.
