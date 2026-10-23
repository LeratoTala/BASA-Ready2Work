# Multi-stage build: compile the client, then run the Express server that serves it plus /api.
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# VITE_* values are baked into the client at build time. Pass them as build args.
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_FIRESTORE_DATABASE_ID
ARG VITE_API_BASE_URL
ENV VITE_ENABLE_DEMO_DATA=false
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci
COPY --from=build /app/dist ./dist
COPY server ./server
COPY tsconfig.json ./
USER node
EXPOSE 3000
CMD ["npx", "tsx", "server/index.ts"]
