# Utilise l'image Node officielle
FROM node:18-alpine 

WORKDIR /app

# Installer curl et netcat pour le healthcheck
RUN apk add --no-cache curl netcat-openbsd && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY package*.json ./
RUN npm ci --frozen-lockfile --production

# Variables d'environnement
ENV PORT=3000
ENV NODE_ENV=production
ENV HEALTH_PORT=3000
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Copier et configurer le script de healthcheck
COPY healthcheck.sh /usr/local/bin/healthcheck.sh
RUN chmod +x /usr/local/bin/healthcheck.sh

# Copier tout le code
COPY . .

# Changer la propriété vers l'utilisateur nodejs et créer les dossiers nécessaires
RUN chown -R nodejs:nodejs /app && \
    mkdir -p /app/logs && \
    chown -R nodejs:nodejs /app/logs
USER nodejs

EXPOSE 3000

# Healthcheck avec plus de tolérance
HEALTHCHECK --interval=30s --timeout=15s --start-period=45s --retries=5 \
    CMD /usr/local/bin/healthcheck.sh

# Lancer le serveur principal avec healthcheck intégré
CMD ["node", "index.js"]