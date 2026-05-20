# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json bun.lock* package-lock.json* ./
RUN npm install -g bun && bun install --frozen-lockfile || npm install
COPY . .
RUN bun run build || npm run build

# --- Runtime stage ---
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app /app
EXPOSE 3000
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3000"]
