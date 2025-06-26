# Utilise l'image Node officielle
FROM node:18-alpine 

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --frozen-lockfile \
    apk add --no-cache curl

ENV PORT=3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
    CMD curl --fail http://localhost:3000/ || exit 1

EXPOSE 3000

# Copier tout le code — ou précision selon ta structure
COPY . .

# Lancer le bon script si le fichier start.js se trouve dans WireScanner
CMD ["node", "WireScanner/start.js"]