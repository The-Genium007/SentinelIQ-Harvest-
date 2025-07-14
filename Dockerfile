# Utilise l'image Node officielle
FROM node:18-alpine 

WORKDIR /app

# Installer curl, netcat et Chromium pour Puppeteer
RUN apk add --no-cache \
    curl \
    netcat-openbsd \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY package*.json ./
RUN npm ci --frozen-lockfile --production

# Variables d'environnement
ENV PORT=3000
ENV NODE_ENV=production
ENV HEALTH_PORT=3000
ENV NODE_OPTIONS="--max-old-space-size=2048"
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copier tout le code
COPY . .

# Changer la propriété vers l'utilisateur nodejs et créer les dossiers nécessaires
RUN chown -R nodejs:nodejs /app && \
    mkdir -p /app/logs && \
    chown -R nodejs:nodejs /app/logs
USER nodejs

EXPOSE 3000

# Lancer le serveur principal avec healthcheck intégré
CMD ["node", "index.js"]