FROM node:22-alpine
WORKDIR /app
COPY packages/npm /app/packages/npm
COPY packages/docker/server.js /app/packages/docker/server.js
COPY packages/hf-space /app/packages/hf-space
COPY packages/npm/lib/index.js /app/packages/hf-space/age.js
ENV NODE_ENV=production
ENV PORT=8787
ENV STATIC_DIR=/app/packages/hf-space
WORKDIR /app/packages/docker
EXPOSE 8787
USER node
CMD ["node", "server.js"]
