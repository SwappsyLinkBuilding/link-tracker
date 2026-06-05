# --- Build the client ---
# Node 22+ for the built-in node:sqlite module (no native build step).
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/
RUN npm install
COPY . .
RUN npm run build

# --- Runtime: server serves the built client ---
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
COPY server/package.json ./server/
RUN npm install --omit=dev -w server
COPY server ./server
# Built client assets, served statically by the server in production
COPY --from=build /app/client/dist ./client/dist
RUN mkdir -p /app/data
EXPOSE 4000
CMD ["node", "server/index.js"]
