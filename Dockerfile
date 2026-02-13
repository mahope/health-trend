# Health Trend
# Use Debian-based images so we can install Python easily for Garmin login.
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:20-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Python runtime for Garmin login (install-only PWA, but Garmin login uses Python).
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-venv \
  && rm -rf /var/lib/apt/lists/*

# Install Garmin deps for the helper scripts.
COPY garmin/requirements.txt /app/garmin/requirements.txt
RUN python3 -m venv /opt/venv \
  && /opt/venv/bin/pip install --no-cache-dir -r /app/garmin/requirements.txt

# App code
COPY --from=build /app .
EXPOSE 3000
CMD ["npm","start"]
