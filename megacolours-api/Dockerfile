FROM node:24-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4000
ENV DATABASE_PATH=/app/data/megacolours.sqlite
ENV UPLOAD_DIR=/app/data/uploads

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

VOLUME ["/app/data"]
EXPOSE 4000
CMD ["node", "dist/server.js"]
