# ---- Build stage: install all deps and compile TypeScript ----
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run build

# ---- Runtime stage: production deps + compiled dist only ----
FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
USER node
# Render injects PORT; 3000 is the local default
EXPOSE 3000
# Pending migrations run on boot (migrationsRun is on when NODE_ENV=production)
CMD ["node", "dist/main"]
