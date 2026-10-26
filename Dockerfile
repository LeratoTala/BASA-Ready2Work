# Multi-stage build: compile the client, then run the Express server that serves it plus /api.
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# VITE_* values are baked into the client at build time. Pass them as --build-arg to docker build
# or as Cloud Run substitution variables. Never pass secrets here — these become public.
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_FIRESTORE_DATABASE_ID
ARG VITE_API_BASE_URL
ARG VITE_RECAPTCHA_SITE_KEY
ARG VITE_MINIMUM_USER_AGE=18
# Demo mode MUST be false in production builds. Override explicitly if building a demo image.
ARG VITE_ENABLE_DEMO_DATA=false
ENV VITE_ENABLE_DEMO_DATA=${VITE_ENABLE_DEMO_DATA}

RUN npm run build

# ---- Runtime image (production) ----
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
# Only production dependencies are needed at runtime.
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY server ./server
COPY src/domain ./src/domain
COPY src/config ./src/config
COPY tsconfig.json ./
# Run as non-root for security.
USER node
EXPOSE 3000
CMD ["npx", "tsx", "server/index.ts"]
