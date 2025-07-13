# Utilise l'image Node officielle
FROM node:18-alpine 

WORKDIR /app

# Installer curl et netcat pour le healthcheck
RUN apk add --no-cache curl netcat-openbsd

COPY package.json package-lock.json ./
RUN npm install --frozen-lockfile

ENV PORT=3000

# Copier et configurer le script de healthcheck
COPY healthcheck.sh /usr/local/bin/healthcheck.sh
RUN chmod +x /usr/local/bin/healthcheck.sh

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD /usr/local/bin/healthcheck.sh

EXPOSE 3000

# Copier tout le code
COPY . .

# Lancer le serveur principal avec healthcheck intégré
CMD ["node", "index.js"]